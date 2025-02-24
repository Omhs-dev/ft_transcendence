#!/bin/sh
set -e

# Load environment variables from .env file
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs) # improved way to load .env file
  echo "Environment variables loaded from .env"
fi
# export PYTHONPATH="${PYTHONPATH}:/app/Django_backend_project"

# Wait for the database to be ready
echo "Waiting for the database to be ready..."
while ! nc -z postgres_container 5432; do
  sleep 1
done
echo "Database is ready!"

# Wait for Redis to be available
echo "Waiting for Redis to be available..."
until redis-cli -h redis_container -p 6379 ping; do
    echo "Redis is unavailable - waiting..."
    sleep 3
done
echo "Redis is ready!"
# Apply database migrations
echo "Applying database migrations..."
python Django_backend_project/manage.py makemigrations
python Django_backend_project/manage.py migrate

# tail -f /dev/null
# Create a superuser if it doesn't exist
echo "Creating superuser if it doesn't exist..."
python Django_backend_project/manage.py shell <<EOF
from django.contrib.auth import get_user_model
import os

User = get_user_model()
admin_user = os.getenv("ADMIN_USER")
admin_email = os.getenv("ADMIN_EMAIL")
admin_pwd = os.getenv("ADMIN_PWD")
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser(admin_user, admin_email, admin_pwd)
EOF

# Start the Django server
echo "Starting the Django server..."

mkdir -p /app/staticfiles
cp -r Django_backend_project/static/* /app/staticfiles/

# exec tail -f /dev/null
# Start server (development or production)
if [ "$DJANGO_DEBUG" = "true" ]; then
    echo "Starting Django development server..."
    exec python Django_backend_project/manage.py runserver 0.0.0.0:8000
else
    echo "Starting Gunicorn..."
    gunicorn --workers 3 --bind 0.0.0.0:8000 Django_backend_project.settings.wsgi:application &
	echo "Starting Daphne for WebSockets..."
    daphne -b 0.0.0.0 -p 8001 Django_backend_project.settings.asgi:application
fi
