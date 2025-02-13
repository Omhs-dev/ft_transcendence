from urllib.parse import parse_qs
from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import UntypedToken
from django.contrib.auth import get_user_model
from jwt import decode as jwt_decode, InvalidTokenError
from django.conf import settings
from channels.db import database_sync_to_async
import logging

logger = logging.getLogger('chat_app')

User = get_user_model()

class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        # Get the cookies from the headers
        headers = dict(scope['headers'])
        cookies = self.parse_cookies(headers)

        # Try to get the JWT token from the cookies
        jwt_token = cookies.get(settings.SIMPLE_JWT['AUTH_COOKIE'])
        
        if jwt_token:
            try:
                # Decode the token
                decoded_data = jwt_decode(jwt_token, settings.SECRET_KEY, algorithms=["HS256"])
                user = await self.get_user(decoded_data["user_id"])
                logger.debug(f"\ndecoded data in JWTAuthMiddleware: {decoded_data}\n")
                scope['user'] = user
            except InvalidTokenError:
                scope['user'] = AnonymousUser()
        else:
            scope['user'] = AnonymousUser()

        return await super().__call__(scope, receive, send)

    def parse_cookies(self, headers):
        cookies = {}
        if b'cookie' in headers:
            cookie_header = headers[b'cookie'].decode()
            for chunk in cookie_header.split(';'):
                if '=' in chunk:
                    key, value = chunk.strip().split('=', 1)
                    cookies[key] = value
        return cookies

    @database_sync_to_async
    def get_user(self, user_id):
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return AnonymousUser()
