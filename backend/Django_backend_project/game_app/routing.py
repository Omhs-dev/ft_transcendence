from django.urls import re_path
from . import local_game
from . import game_logic
import os

# websocket_urlpatterns = [
# ]

DEBUG = os.environ.get("DJANGO_DEBUG", False)

if (DEBUG.lower() == "true"):
    websocket_urlpatterns = [
        re_path(r"ws/remoteGame/$", game_logic.PongGameConsumer.as_asgi()),
        re_path(r"ws/localGame/$", local_game.LocalGameConsumer.as_asgi()),
    ]
elif (DEBUG.lower() == "false"):
    websocket_urlpatterns = [
        re_path(r"wss/remoteGame/$", game_logic.PongGameConsumer.as_asgi()),
        re_path(r"wss/localGame/$", local_game.LocalGameConsumer.as_asgi()),
    ]

