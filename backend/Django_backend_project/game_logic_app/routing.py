from django.urls import re_path
from . import consumers
from . import game_logic

websocket_urlpatterns = [
    re_path(r"ws/game/$", game_logic.PongGameConsumer.as_asgi()),
]

