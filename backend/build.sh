#!/usr/bin/env bash
# Runs on every deploy on Render (Build Command: bash build.sh)
set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py makemigrations --no-input    # safety net if migration files were not committed
python manage.py migrate --no-input
python manage.py seed_foods                   # reloads the base menu (ids 1-30)

# Optional: create an admin login for /admin (set the DJANGO_SUPERUSER_* variables on Render)
if [ -n "$DJANGO_SUPERUSER_USERNAME" ]; then
  python manage.py createsuperuser --no-input || true
fi