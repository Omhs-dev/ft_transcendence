# """
# ASGI config for myproject project.

# It exposes the ASGI callable as a module-level variable named ``application``.

# For more information on this file, see
# https://docs.djangoproject.com/en/5.1/howto/deployment/asgi/
# """

import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from chat_app.authenticateWebsocket import JWTAuthMiddleware

import logging
logger = logging.getLogger(__name__)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings.settings')


# Initialize Django ASGI application first
django_asgi_app = get_asgi_application()
from chat_app.routing import websocket_urlpatterns as chat_websocket_urlpatterns
from game_logic_app.routing import websocket_urlpatterns as game_websocket_urlpatterns

websocket_urlpatterns = chat_websocket_urlpatterns + game_websocket_urlpatterns


application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": JWTAuthMiddleware(
        URLRouter(
            websocket_urlpatterns
        )
    ),
})


