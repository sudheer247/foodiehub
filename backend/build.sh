#!/usr/bin/env bash
# Runs on every deploy on Render (Build Command: bash build.sh)
set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py makemigrations --no-input
python manage.py migrate --no-input
python manage.py seed_foods