# from django.urls import path
# from .consumers import ChatConsumer

# websocket_urlpatterns = [
#     path('ws/chat/<str:room_name>/', ChatConsumer.as_asgi()),
# ]



# from django.urls import re_path
# from .consumers import ChatConsumer

# websocket_urlpatterns = [
#     re_path(r'^ws/chat/(?P<room_name>\w+)/$', ChatConsumer.as_asgi()),
# ]

from django.urls import path, re_path
from .consumers import ChatConsumer

websocket_urlpatterns = [
    # path('ws/chat/<int:user_id>/', ChatConsumer.as_asgi()),
    re_path(r'ws/chat/(?P<user_id>\d+)/$', ChatConsumer.as_asgi()),
]

