# 🍔 FoodieHub: Online Food Ordering

A full-stack food ordering app: mobile OTP accounts, live order tracking, order history with ratings, delivery location, and **FoodieBot**, an AI assistant that recommends dishes from the real menu (RAG).

```
Browser ──► Vercel (Next.js + React) ──► Render (Django API) ──► Neon (PostgreSQL)
                                              └──► Anthropic API (FoodieBot)
```

| Layer | Technology | Hosted on |
|---|---|---|
| Frontend | Next.js 14 (App Router), React 18, plain CSS | **Vercel** |
| Backend | Python, Django 5 (JSON API), gunicorn, WhiteNoise | **Render** |
| Database | PostgreSQL in production, SQLite locally | **Neon** |
| Auth | Mobile / email **OTP**, JWT (PyJWT) | - |
| AI | RAG: BM25 retrieval + Claude (Anthropic API), streamed | - |

## Features
**Ordering**
- Menu of 30 dishes loaded from the database, each with a picture; search, category filter, hover **Menu** dropdown
- **− / +** on every card, cart saved in the browser, limit of 10 per dish
- Checkout with delivery details and UPI / Card / Cash on Delivery (demo, nothing is charged)

**Accounts**
- **Sign up with a mobile number + OTP** (new numbers only), then add name, date of birth, gender
- **Login only for registered** mobile numbers or emails (OTP). Unregistered numbers are told to sign up
- OTP: 6 boxes, valid 5 minutes, resend after 60 seconds with a live timer, 5 wrong tries allowed
- **My Account:** name, DOB, gender are editable; email and mobile are OTP-verified, then locked with a green ✔

**After ordering**
- **Track Order:** confirmed → preparing → packed → assigning delivery partner → on the way → nearby → arrived → delivered, about 10 minutes, a new status every 30 seconds to 2 minutes, delivery partner card
- **Order history:** tabs (All / Active / Delivered), dish pictures, status badge, ETA, Track / Rate / Reorder
- **Ratings:** rate each dish and the delivery partner (stars + comment) once an order is delivered

**Profile menu:** My Account, Deals & Offers (sample codes), Track Order, Order History, Need Help (FAQ, contact, FoodieBot), Terms & Conditions (sample)

**Other:** delivery location (detect, pick a city such as Nellore, or type), FoodieBot, Django admin panel, works on phones (bottom-sheet windows, scrolling menu rows)

## Project structure
```
FoodieHub/
├── frontend/                 Next.js app
│   ├── app/                  layout.js, page.js (main page), globals.css
│   ├── components/           Cart, Checkout, Orders, Track, Rate, Auth, OtpBoxes,
│   │                         Account, Info (offers/help/terms), Location, AssistantChat
│   ├── lib/                  api.js, otp.js, location.js, content.js, dish.js
│   └── public/images/        dish pictures (SVG)
├── backend/                  Django API
│   ├── foodiehub/            settings.py, urls.py, wsgi.py
│   ├── api/                  models.py, views.py, urls.py, admin.py, rag.py,
│   │                         management/commands/ (seed_foods, watch_otps)
│   ├── build.sh              commands Render runs on every deploy
│   └── requirements.txt
├── tools/make_dish_images.py generates the dish pictures
├── static-demo-html/         the first version (plain HTML/CSS/JS)
└── docs/                     PROJECT_EXPLAINED, INTERVIEW_PREP, DEPLOYMENT
```

## Run it locally (Windows)
Install **Node.js LTS** and **Python 3.10+**.

**Backend** (window 1)
```
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python manage.py makemigrations api
python manage.py migrate
python manage.py seed_foods
python manage.py createsuperuser      # optional, for /admin
python manage.py runserver 5000
```
If activate is blocked: `Set-ExecutionPolicy -Scope Process Bypass`.

**Frontend** (window 2)
```
cd frontend
copy .env.local.example .env.local
npm install
npm run dev
```
Open http://localhost:3000. Admin: http://localhost:5000/admin.

## Environment variables
`backend/.env` (locally) or the host's settings (Render):

| Name | Purpose |
|---|---|
| `SECRET_KEY` | Django secret, also signs login tokens |
| `DEBUG` | `1` locally, `0` online |
| `CLIENT_ORIGIN` | Frontend link allowed by CORS (your Vercel link online) |
| `DATABASE_URL` | Online only: PostgreSQL connection string (Neon). Without it SQLite is used |
| `ALLOWED_HOSTS` | Online only (Render's host is added automatically) |
| `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` | FoodieBot's AI answers (optional) |
| `ORDER_DURATION_SECONDS` | Length of the tracking simulation (default `600`) |
| `STORE_DEMO_OTP` | `1` = keep OTPs readable so `watch_otps` can print them in your terminal (demo only) |
| `SHOW_OTP_IN_RESPONSE` | `1` = show the OTP on screen (demo with fake numbers only) |
| `DJANGO_SUPERUSER_USERNAME / EMAIL / PASSWORD` | Online: creates your admin login on deploy |

`frontend/.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:5000`

## API
| Method | Endpoint | Login | Purpose |
|---|---|---|---|
| GET | `/api/foods` | no | Menu |
| POST | `/api/otp/send`, `/api/otp/verify` | signup/login: no | OTP for `signup`, `login`, and verifying `phone` / `email` |
| GET / POST | `/api/account` | yes | Read or update name, DOB, gender |
| GET / POST | `/api/orders` | yes | Order history / place an order |
| GET | `/api/orders/<id>` | yes | One order with live tracking and stages |
| POST | `/api/orders/<id>/rate` | yes | Rate dishes and delivery (after delivery, once) |
| POST | `/api/assistant` | no | FoodieBot (streamed answer) |

## Where is the OTP?
There is no SMS provider yet, so the server prints it: `[FoodieHub OTP] login code for 9876543210: 123456`
- **Local server:** in the terminal where `runserver` runs (VS Code)
- **Render:** the service's **Logs** tab
- **Your own terminal while the site runs on Render:** set `STORE_DEMO_OTP=1` on Render, then run locally
  `DATABASE_URL="<your Neon string>" python manage.py watch_otps`
  (PowerShell: `$env:DATABASE_URL="<string>"; python manage.py watch_otps`)

## Admin panel
Open `/admin` **of the server that holds the data**. The local admin (`localhost:5000/admin`) shows the local SQLite file; data created on the live site is in Neon, so use `https://<your-render-service>.onrender.com/admin` (set the `DJANGO_SUPERUSER_*` variables on Render). Foods, Orders (with items, ratings, tracking status), Ratings, Profiles and Users are listed.

## Why Neon, Vercel and Render?
- **Vercel** builds and serves the Next.js frontend from a global network; every `git push` deploys. It is made by the creators of Next.js.
- **Render** runs the Django server (a long-running Python process, which Vercel is not designed for) and redeploys on every push.
- **Neon** is a managed PostgreSQL database. The data must live outside the server, because free servers lose their files on restart and SQLite would be wiped.

Real-world reasoning, trade-offs and alternatives: `docs/PROJECT_EXPLAINED.md` (section 4). Steps: `docs/DEPLOYMENT.md`.

## Troubleshooting
| Problem | Fix |
|---|---|
| "Could not load the menu" | Backend not running, asleep (Render free sleeps), or wrong `NEXT_PUBLIC_API_URL` |
| CORS error | `CLIENT_ORIGIN` must equal the Vercel link exactly (https, no trailing `/`) |
| Online admin shows no data / locally admin is empty | Use the Render admin link; local admin reads local SQLite |
| OTP not in VS Code terminal | The live site runs on Render. See "Where is the OTP?" |
| `no such table` / `relation does not exist` | Run `makemigrations` and `migrate`; commit the migration files |
| Detect location shows the wrong place | Laptops only estimate; tap your city instead |
| VS Code "Import could not be resolved" | Select the venv interpreter (`backend\venv\Scripts\python.exe`) |
| Phone shows a tiny desktop page | Turn off "Desktop site" in the browser menu; hard refresh |

## Known limitations
Demo payments; OTP printed (no SMS); tracking is simulated from elapsed time; offers and terms are sample content; veg/non-veg guessed from text; browser location is approximate on laptops; no automated tests yet.