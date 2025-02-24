from django.urls import re_path
from . import local_game
from . import game_logic

websocket_urlpatterns = [
    re_path(r"ws/remoteGame/$", game_logic.PongGameConsumer.as_asgi()),
    re_path(r"ws/localGame/$", local_game.LocalGameConsumer.as_asgi()),
]

