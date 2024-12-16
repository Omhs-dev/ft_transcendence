import os
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.conf import settings

# Set up Django settings environment
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "settings.settings")  # Replace with your actual settings module

def test_redis():
    channel_layer = get_channel_layer()
    try:
        async_to_sync(channel_layer.send)("test_channel", {"type": "test_message"})
        print("Redis connection test successful.")
    except Exception as e:
        print("Redis connection test failed:", e)

test_redis()

