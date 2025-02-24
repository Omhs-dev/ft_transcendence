from django.urls import path, re_path
from django.urls import path, re_path
from .consumers import ChatConsumer
import os

DEBUG = os.environ.get("DJANGO_DEBUG", False)

if (DEBUG.lower() == "true"):
	websocket_urlpatterns = [
		re_path(r'ws/chat/$', ChatConsumer.as_asgi()),
	]
elif (DEBUG.lower() == "false"):
	websocket_urlpatterns = [
		re_path(r'wss/chat/$', ChatConsumer.as_asgi()),
	]

