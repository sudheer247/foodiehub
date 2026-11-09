import hashlib
import hmac
import json
import re
import secrets
from datetime import date, timedelta
from functools import wraps

import jwt
from django.conf import settings
from django.contrib.auth import authenticate
from django.core.cache import cache
from django.contrib.auth.models import User
from django.db import transaction
from django.http import JsonResponse, StreamingHttpResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_http_methods, require_POST

from . import rag
from .models import OTP, Food, Order, OrderItem, Profile

MAX_QTY = 10
METHODS = ["UPI", "Card", "Cash on Delivery"]


# ---------- helpers ----------
def error(message, status=400):
    return JsonResponse({"error": message}, status=status)


def read_json(request):
    try:
        data = json.loads(request.body or "{}")
    except ValueError:
        return {}
    return data if isinstance(data, dict) else {}


def is_int(value):
    return isinstance(value, int) and not isinstance(value, bool)


def make_token(user):
    payload = {"id": user.id, "exp": timezone.now() + timedelta(days=7)}
    return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")


def profile_of(user):
    return Profile.objects.get_or_create(user=user)[0]


def user_data(user):
    return {
        "id": user.id,
        "name": user.first_name or "Customer",
        "email": user.email,
        "phone": profile_of(user).phone or "",
    }


def account_data(user):
    p = profile_of(user)
    return {
        "name": user.first_name,
        "email": user.email,
        "phone": p.phone or "",
        "dob": p.dob.isoformat() if p.dob else "",
        "gender": p.gender,
        "email_verified": p.email_verified,
        "phone_verified": p.phone_verified,
    }


def auth_user(request):
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
        return User.objects.get(id=payload["id"])
    except (jwt.PyJWTError, User.DoesNotExist, KeyError):
        return None


def require_auth(view):
    @wraps(view)
    def wrapper(request, *args, **kwargs):
        user = auth_user(request)
        if user is None:
            return error("Please log in again.", 401)
        request.api_user = user
        return view(request, *args, **kwargs)
    return wrapper


# ---------- public endpoints ----------
@require_GET
def health(request):
    return JsonResponse({"ok": True})


@require_GET
def foods(request):
    fields = ("id", "name", "category", "price", "rating", "description", "image")
    return JsonResponse(list(Food.objects.values(*fields)), safe=False)


@csrf_exempt
@require_POST
def signup(request):
    data = read_json(request)
    name = str(data.get("name", "")).strip()
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))

    if len(name) < 2:
        return error("Please enter your name.")
    if not re.match(r"^\S+@\S+\.\S+$", email):
        return error("Enter a valid email.")
    if len(password) < 6:
        return error("Password must be at least 6 characters.")
    if User.objects.filter(username=email).exists():
        return error("An account with this email already exists.", 409)

    user = User.objects.create_user(username=email, email=email, password=password, first_name=name)
    return JsonResponse({"token": make_token(user), "user": user_data(user)}, status=201)


@csrf_exempt
@require_POST
def login(request):
    data = read_json(request)
    email = str(data.get("email", "")).strip().lower()
    user = authenticate(username=email, password=str(data.get("password", "")))

    if user is None:
        return error("Wrong email or password.", 401)
    return JsonResponse({"token": make_token(user), "user": user_data(user)})


# ---------- orders (login required) ----------
@csrf_exempt
@require_http_methods(["GET", "POST"])
@require_auth
def orders(request):
    return list_orders(request) if request.method == "GET" else create_order(request)


def list_orders(request):
    qs = request.api_user.orders.prefetch_related("items")[:50]
    return JsonResponse([
        {
            "id": o.id,
            "total": o.total,
            "method": o.method,
            "created_at": o.created_at.isoformat(),
            "items": [
                {"id": i.food_id, "name": i.name, "price": i.price, "quantity": i.quantity}
                for i in o.items.all()
            ],
        }
        for o in qs
    ], safe=False)


def create_order(request):
    data = read_json(request)
    items = data.get("items")
    method = data.get("method")
    name = str(data.get("name") or "").strip()
    phone = str(data.get("phone") or "")
    address = str(data.get("address") or "").strip()

    if not isinstance(items, list) or not items:
        return error("Your cart is empty.")
    if method not in METHODS:
        return error("Choose a valid payment method.")
    if len(name) < 2:
        return error("Please enter your name.")
    if not re.fullmatch(r"\d{10}", phone):
        return error("Enter a valid 10-digit phone number.")
    if len(address) < 5:
        return error("Please enter your delivery address.")

    # Prices always come from the database, never from the browser.
    lines, total = [], 0
    for item in items:
        if not isinstance(item, dict):
            return error("Invalid item in your cart.")
        food_id, qty = item.get("id"), item.get("quantity")
        food = Food.objects.filter(id=food_id).first() if is_int(food_id) and is_int(qty) else None
        if food is None or not 1 <= qty <= MAX_QTY:
            return error("Invalid item in your cart.")
        lines.append((food, qty))
        total += food.price * qty

    order_id = "FH" + secrets.token_hex(3).upper()

    with transaction.atomic():
        order = Order.objects.create(
            id=order_id, user=request.api_user, total=total, method=method,
            name=name, phone=phone, address=address,
        )
        OrderItem.objects.bulk_create([
            OrderItem(order=order, food_id=f.id, name=f.name, price=f.price, quantity=q)
            for f, q in lines
        ])

    return JsonResponse(
        {"id": order.id, "total": total, "method": method, "created_at": order.created_at.isoformat()},
        status=201,
    )


# ---------- OTP (codes are printed in the terminal for now) ----------
OTP_TTL = 300        # an OTP is valid for 5 minutes
RESEND_AFTER = 60    # a new OTP can be requested after 60 seconds
MAX_ATTEMPTS = 5


def normalize_phone(value):
    value = re.sub(r"[\s\-]", "", str(value or ""))
    value = re.sub(r"^(\+91|91|0)(?=\d{10}$)", "", value)
    return value if re.fullmatch(r"[6-9]\d{9}", value) else None


def hash_code(code, target, purpose):
    raw = f"{code}|{target}|{purpose}|{settings.SECRET_KEY}"
    return hashlib.sha256(raw.encode()).hexdigest()


def read_target(data, purpose):
    raw = str(data.get("target", "")).strip()
    if purpose == "email" or (purpose == "login" and "@" in raw):
        target = raw.lower()
        return (target, None) if re.match(r"^\S+@\S+\.\S+$", target) else (None, "Enter a valid email.")
    target = normalize_phone(data.get("target"))
    return (target, None) if target else (None, "Enter a valid 10-digit mobile number.")


def find_account(target):
    """The registered user for a mobile number or an email, or None."""
    if "@" in target:
        return User.objects.filter(email__iexact=target).first()
    profile = Profile.objects.filter(phone=target).select_related("user").first()
    return profile.user if profile else None


@csrf_exempt
@require_POST
def otp_send(request):
    data = read_json(request)
    purpose = data.get("purpose")
    if purpose not in ("login", "signup", "phone", "email"):
        return error("Invalid request.")

    user = None
    if purpose in ("phone", "email"):
        user = auth_user(request)
        if user is None:
            return error("Please log in again.", 401)

    target, problem = read_target(data, purpose)
    if problem:
        return error(problem)

    # Signup is only for NEW mobile numbers. Login is only for REGISTERED mobile numbers or emails.
    if purpose == "signup" and Profile.objects.filter(phone=target).exists():
        return error("This mobile number is already registered. Please log in.", 409)
    if purpose == "login" and find_account(target) is None:
        kind = "email" if "@" in target else "mobile number"
        return error(f"This {kind} is not registered. Please sign up first.", 404)

    if user is not None:
        p = profile_of(user)
        if purpose == "email":
            if p.email_verified:
                return error("Your email is already verified and cannot be changed.")
            if User.objects.filter(email__iexact=target).exclude(id=user.id).exists():
                return error("This email is already in use.", 409)
        else:
            if p.phone_verified:
                return error("Your mobile number is already verified and cannot be changed.")
            if Profile.objects.filter(phone=target).exclude(user=user).exists():
                return error("This mobile number is already in use.", 409)

    last = OTP.objects.filter(target=target, purpose=purpose).order_by("-created_at").first()
    if last:
        wait = RESEND_AFTER - int((timezone.now() - last.created_at).total_seconds())
        if wait > 0:
            return JsonResponse(
                {"error": f"Please wait {wait} seconds before requesting a new OTP.", "retry_after": wait},
                status=429,
            )

    code = f"{secrets.randbelow(10**6):06d}"
    OTP.objects.filter(target=target, purpose=purpose).delete()
    OTP.objects.create(target=target, purpose=purpose, code_hash=hash_code(code, target, purpose))

    # No SMS/email provider yet, so the code is printed in this terminal.
    print(f"\n[FoodieHub OTP] {purpose} code for {target}: {code}  (valid for 5 minutes)\n", flush=True)

    response = {"ok": True, "resend_in": RESEND_AFTER, "expires_in": OTP_TTL}
    if settings.SHOW_OTP_IN_RESPONSE:      # demo deployments only
        response["demo_otp"] = code
    return JsonResponse(response)


def check_otp(target, purpose, code):
    """Returns an error message, or None if the code is correct."""
    otp = OTP.objects.filter(target=target, purpose=purpose).order_by("-created_at").first()
    if otp is None:
        return "Please request an OTP first."
    if timezone.now() > otp.created_at + timedelta(seconds=OTP_TTL):
        otp.delete()
        return "This OTP has expired. Please request a new one."
    if otp.attempts >= MAX_ATTEMPTS:
        otp.delete()
        return "Too many wrong attempts. Please request a new OTP."
    if not hmac.compare_digest(otp.code_hash, hash_code(code, target, purpose)):
        otp.attempts += 1
        otp.save(update_fields=["attempts"])
        return "Incorrect OTP."
    otp.delete()
    return None


@csrf_exempt
@require_POST
def otp_verify(request):
    data = read_json(request)
    purpose = data.get("purpose")
    if purpose not in ("login", "signup", "phone", "email"):
        return error("Invalid request.")

    user = None
    if purpose in ("phone", "email"):
        user = auth_user(request)
        if user is None:
            return error("Please log in again.", 401)

    target, problem = read_target(data, purpose)
    if problem:
        return error(problem)

    code = re.sub(r"\D", "", str(data.get("code", "")))
    if len(code) != 6:
        return error("Enter the 6-digit OTP.")

    failure = check_otp(target, purpose, code)
    if failure:
        return error(failure)

    if purpose == "login":
        user = find_account(target)
        if user is None:
            kind = "email" if "@" in target else "mobile number"
            return error(f"This {kind} is not registered. Please sign up first.", 404)
        p = profile_of(user)
        if "@" in target:
            p.email_verified = True      # the OTP proved the customer owns this email
        else:
            p.phone_verified = True
        p.save()
        return JsonResponse({"token": make_token(user), "user": user_data(user), "is_new": False})

    if purpose == "signup":
        if Profile.objects.filter(phone=target).exists():
            return error("This mobile number is already registered. Please log in.", 409)
        user = User.objects.create_user(username=f"phone_{target}")
        Profile.objects.create(user=user, phone=target, phone_verified=True)
        return JsonResponse({"token": make_token(user), "user": user_data(user), "is_new": True}, status=201)

    p = profile_of(user)
    if purpose == "phone":
        p.phone, p.phone_verified = target, True
    else:
        user.email = target
        user.save(update_fields=["email"])
        p.email_verified = True
    p.save()
    return JsonResponse(account_data(user))


# ---------- account (name, DOB, gender are editable; verified email/phone are locked) ----------
@csrf_exempt
@require_http_methods(["GET", "POST"])
@require_auth
def account(request):
    user = request.api_user
    p = profile_of(user)

    if request.method == "POST":
        data = read_json(request)
        name = str(data.get("name", "")).strip()
        gender = str(data.get("gender") or "")
        raw_dob = str(data.get("dob") or "")

        if len(name) < 2:
            return error("Please enter your name.")
        if gender not in ("", "Male", "Female", "Other"):
            return error("Choose a valid gender.")

        dob = None
        if raw_dob:
            try:
                dob = date.fromisoformat(raw_dob)
            except ValueError:
                return error("Enter a valid date of birth.")
            if dob > date.today() or dob.year < 1900:
                return error("Enter a valid date of birth.")

        user.first_name = name[:150]
        user.save(update_fields=["first_name"])
        p.dob, p.gender = dob, gender
        p.save(update_fields=["dob", "gender"])

    return JsonResponse(account_data(user))


# ---------- FoodieBot (RAG assistant) ----------
@csrf_exempt
@require_POST
def assistant(request):
    # Simple rate limit: 12 messages per minute per visitor
    key = "assistant:" + request.META.get("REMOTE_ADDR", "unknown")
    cache.add(key, 0, 60)
    if cache.incr(key) > 12:
        return error("You're sending messages too fast. Please wait a minute.", 429)

    data = read_json(request)
    message = str(data.get("message", "")).strip()
    history = data.get("history") if isinstance(data.get("history"), list) else []
    history = [h for h in history if isinstance(h, dict)]

    if not message:
        return error("Please type a message.")
    if len(message) > 300:
        return error("Please keep your message under 300 characters.")

    foods = list(Food.objects.values("id", "name", "category", "price", "rating", "description"))
    hits, max_price, diet = rag.prepare(message, history, foods)
    dishes = [{"id": f["id"], "name": f["name"], "price": f["price"]} for f in hits[:8]]
    cache_key = "bot:" + hashlib.sha1(
        f"{message.lower()}|{[f['id'] for f in hits]}|{max_price}|{diet}".encode()
    ).hexdigest()

    def events():
        # 1) the dish cards go out immediately (no waiting for the AI)
        yield json.dumps({"dishes": dishes}) + "\n"

        # 2) a repeated first question is answered from the cache
        cached = None if history else cache.get(cache_key)
        if cached:
            yield json.dumps({"delta": cached}) + "\n"
        else:
            state, parts = {"ai": False}, []
            for piece in rag.stream_reply(message, history, hits, max_price, diet, state):
                parts.append(piece)
                yield json.dumps({"delta": piece}) + "\n"
            if state["ai"] and not history:
                cache.set(cache_key, "".join(parts), 600)

        yield json.dumps({"done": True}) + "\n"

    response = StreamingHttpResponse(events(), content_type="application/x-ndjson")
    response["Cache-Control"] = "no-cache"
    response["X-Accel-Buffering"] = "no"
    return response