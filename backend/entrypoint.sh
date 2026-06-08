#!/bin/sh
set -e

if [ "$DB_ENGINE" = "postgres" ] || [ "$DB_ENGINE" = "postgresql" ]; then
  echo "Waiting for PostgreSQL at ${POSTGRES_HOST}:${POSTGRES_PORT}..."
  while ! nc -z "$POSTGRES_HOST" "$POSTGRES_PORT"; do
    sleep 1
  done
fi

python manage.py migrate
python manage.py runserver 0.0.0.0:8000
