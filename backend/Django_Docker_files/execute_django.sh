#!/bin/sh
set -e
apt-get install -y netcat-traditional redis-tools iputils-ping net-tools

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
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'adminpassword')
EOF

# Start the Django server
echo "Starting the Django server..."
exec python Django_backend_project/manage.py runserver 0.0.0.0:8000
