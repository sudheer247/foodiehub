# 🍔 FoodieHub: Online Food Ordering

A full-stack food ordering web app with accounts, OTP verification, order history and an **AI food assistant (RAG)**.

| Layer | Technology |
|---|---|
| Frontend | **Next.js 14** (App Router) + **React 18**, plain CSS |
| Backend | **Python + Django 5** (JSON API, no DRF) |
| Database | **SQLite** (Django ORM) |
| Auth | Email + password, **Mobile OTP login**, **JWT** (PyJWT) |
| AI | **RAG**: BM25 retrieval + **Claude** (Anthropic API) with streaming |
| Hosting | Frontend: Vercel. Backend: any host with a persistent disk (Render, Railway) |

## Features
- Menu loaded from the database (29+ dishes), search, category filter, hover **Menu dropdown**
- Cart with **+ / −** on every card, quantity limit (10 per item), saved in the browser
- **Checkout** with delivery details and UPI / Card / Cash on Delivery (demo, no real payment)
- **Sign up with a mobile number + OTP** (6 OTP boxes, valid 5 min, resend after 60 s with a live timer), then add name, DOB and gender
- **Login only for registered** mobile numbers or emails (OTP). Unregistered numbers are told to sign up first
- **Delivery location** (row above the logo): **Detect location** with the browser (asks you to confirm when the browser is only guessing), **tap a city** (Nellore, Tirupati, ...) or type an address. It is saved and prefills the checkout address
- **Profile panel** and **My Account**: name, DOB, gender (editable); email and mobile (OTP-verified, then locked with a green ✔)
- **Order history** saved per user, with **Reorder**
- **FoodieBot**: ask for "chicken biriyani", "veg under 200", "something sweet"; answers come from your real menu
- Django **admin panel** to add and edit dishes and view orders
- Layout: location row on top, logo row (links in the middle, Cart and profile on the right) stays fixed while scrolling; small side gaps controlled by one CSS variable
- Responsive layout, keyboard and screen-reader friendly (labels, focus outlines, Escape closes)

## Project structure
```
FoodieHub/
├── frontend/                 Next.js + React app
│   ├── app/                  layout.js, page.js (main page), globals.css
│   ├── components/           CartPanel, CheckoutModal, OrdersModal, AuthModal, OtpBoxes,
│   │                         AccountModal, AssistantChat, LocationModal
│   ├── lib/                  api.js (fetch helper), otp.js (countdown hook), location.js
│   └── public/images/        local dish images
├── backend/                  Django API
│   ├── foodiehub/            settings.py, urls.py, wsgi.py
│   └── api/                  models.py, views.py, urls.py, admin.py, rag.py,
│                             management/commands/seed_foods.py
├── static-demo-html/         the first version (plain HTML/CSS/JS)
├── docs/                     PROJECT_EXPLAINED.md, INTERVIEW_PREP.md
└── README.md
```

## Why this structure
- **`frontend/` and `backend/` are separate** so each can be built, deployed and replaced on its own. They talk only through the JSON API.
- **`components/`, `lib/`** keep the UI in small pieces (one file per window) and the shared helpers (API calls, OTP timer, location) in one place.
- **`api/rag.py`** holds the FoodieBot logic away from the views, so it can be read and tested without Django.
- **`seed_foods.py`** loads the menu with one command, so anyone can recreate the same database.
- **`.env.example`** documents the settings; the real `.env` with secrets is never committed.

### What is `static-demo-html/`?
It is the **first version** of the project, made with only HTML, CSS and JavaScript. It has hard-coded dishes and keeps the cart and orders in the browser. It is not used by the running app. It is kept as a backup, to show how the project evolved, and as a demo that opens by double-clicking `index.html` with nothing to install. It lives outside `frontend/` because `frontend/` is a Next.js app and loose HTML files there would be ignored and confusing. You can delete the folder; Git history keeps it.

## Run it locally (Windows PowerShell)
Install **Node.js LTS** and **Python 3.10+** first.

**1. Backend** (window 1)
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
If activate is blocked, run `Set-ExecutionPolicy -Scope Process Bypass` first.

**2. Frontend** (window 2)
```
cd frontend
copy .env.local.example .env.local
npm install
npm run dev
```
Open **http://localhost:3000**. Admin panel: **http://localhost:5000/admin**.

## Environment variables
`backend/.env`
| Name | Purpose |
|---|---|
| `SECRET_KEY` | Django secret, also signs login tokens. Use a long random value in production |
| `DEBUG` | `1` for local, `0` in production |
| `CLIENT_ORIGIN` | Frontend URL allowed by CORS (default `http://localhost:3000`) |
| `ANTHROPIC_API_KEY` | Enables AI answers in FoodieBot (optional) |
| `ANTHROPIC_MODEL` | Model name (default `claude-haiku-5-5`) |

`frontend/.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:5000`

## API
| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | `/api/foods` | no | Menu |
| POST | `/api/auth/signup`, `/api/auth/login` | no | Email + password (older flow, not used by the UI now) |
| POST | `/api/otp/send`, `/api/otp/verify` | signup/login: no, phone/email: yes | `purpose`: `signup` (new number), `login` (registered mobile or email), `phone`/`email` (verify in My Account) |
| GET / POST | `/api/account` | yes | Read or update name, DOB, gender |
| GET / POST | `/api/orders` | yes | Order history / place an order |
| POST | `/api/assistant` | no | FoodieBot (streams the answer) |

## How OTP works (development)
There is no SMS provider yet, so the code is **printed in the backend terminal**:
`[FoodieHub OTP] login code for 9876543210: 123456 (valid for 5 minutes)`

## FoodieBot (RAG)
1. **Retrieve:** parse budget and veg/non-veg, fix typos, match **all** words, rank with BM25
2. **Augment:** only the matching dishes go into the prompt
3. **Generate:** Claude answers in 2 sentences using only those dishes (streamed). Without an API key it falls back to a plain list.

## Deployment
- **Frontend → Vercel:** import the repo, framework **Next.js**, root directory `frontend`, env `NEXT_PUBLIC_API_URL` = backend URL
- **Backend → Render / Railway:** SQLite needs a persistent disk (or switch to PostgreSQL). Set `SECRET_KEY`, `DEBUG=0`, `ALLOWED_HOSTS`, `CLIENT_ORIGIN`, `ANTHROPIC_API_KEY`
- Vercel cannot host the SQLite backend (its files are not permanent)

## Troubleshooting
| Problem | Fix |
|---|---|
| `python` not recognized | Use `py`, or reinstall Python with "Add to PATH" |
| Scripts disabled in PowerShell | `Set-ExecutionPolicy -Scope Process Bypass` |
| "Could not load the menu" | Backend not running, or `seed_foods` not run |
| CORS error | Backend on port 5000, frontend on 3000, `CLIENT_ORIGIN` correct |
| Backend on port 8000 | Start with `runserver 5000`, or change `NEXT_PUBLIC_API_URL` |
| FoodieBot gives plain list | No API key, or see `[FoodieBot] LLM call failed` in the backend terminal |
| Changed `.env.local` | Restart `npm run dev` |
| VS Code shows "Import could not be resolved" (jwt, django, anthropic) | Not a code error. Select the venv: `Ctrl+Shift+P` → **Python: Select Interpreter** → `backend\venv\Scripts\python.exe`; run `pip install -r requirements.txt` inside the venv; then **Developer: Reload Window**. The `.vscode/settings.json` in this repo points to that interpreter |
| Detect location shows the wrong place | Laptops have no GPS, so the browser only estimates (can be tens of km off). Tap your city, or turn on Windows Location, turn off any VPN, or try on a phone |
| Location permission denied | Allow location for the site in the browser's address-bar icon, or choose a city / type an address |

## Known limitations
Demo payments only; OTP printed instead of sent; veg/non-veg is guessed from dish text; browser location is approximate on laptops and there is no delivery-area check; no order tracking status; no automated tests yet. See `docs/PROJECT_EXPLAINED.md` for the roadmap.

## Customizing
| I want to... | Change |
|---|---|
| Add or edit dishes | Admin panel (`/admin` → Foods), or the list in `backend/api/management/commands/seed_foods.py` then run `python manage.py seed_foods` |
| Add cities to the location list | `CITIES` at the top of `frontend/components/LocationModal.js` |
| Change the side gap of the page | `--gutter` at the top of `frontend/app/globals.css` |
| Change the brand color | `--primary` in `frontend/app/globals.css` |
| Use another Claude model | `ANTHROPIC_MODEL` in `backend/.env` |

## Docs
- `docs/PROJECT_EXPLAINED.md`: architecture and every file explained
- `docs/INTERVIEW_PREP.md`: demo script and interview questions with answers