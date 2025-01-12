from rest_framework_simplejwt.authentication import JWTAuthentication
from django.conf import settings

from rest_framework.authentication import CSRFCheck
from rest_framework import exceptions
import logging
from rest_framework.response import Response
from rest_framework.permissions import BasePermission


logger = logging.getLogger('auth_app')

def dummy_get_response(request):  # pragma: no cover
    return None

def enforce_csrf(request):
    
    check = CSRFCheck(dummy_get_response)
    # check = CSRFCheck()
    logger.info(f"CSRF check: {check}")
    check.process_request(request)
    reason = check.process_view(request, None, (), {})
    logger.info(f"CSRF reason in enforce_CSRF: {reason}")
    if reason:
        logger.debug(f"CSRF Failed in enforce_CSRF: {reason}")
        raise exceptions.PermissionDenied('CSRF Failed: %s' % reason)

class CustomAuthentication(JWTAuthentication):
    def authenticate(self, request):
        logger.debug(f"received Request in authentication: {request}")
        
        header = self.get_header(request)

        logger.debug(f"Header in authenticate: {header}")
        
        if header is None:
            raw_token = request.COOKIES.get(settings.SIMPLE_JWT['AUTH_COOKIE']) or None
            logger.debug(f"Raw token from cookie in authenticate: {raw_token}")
            refresh_token = request.COOKIES.get(settings.SIMPLE_JWT['AUTH_COOKIE_REFRESH']) or None
            logger.debug(f"Refresh token from cookie in authenticate: {refresh_token}")
        else:
            raw_token = self.get_raw_token(header)
            logger.debug(f"Raw token from header in authenticate: {raw_token}")
        if raw_token is None:
            return None

        validated_token = self.get_validated_token(raw_token)
        logger.debug(f"Validated token in authenticate: {validated_token}")
        enforce_csrf(request)

        return self.get_user(validated_token), validated_token
    


class AllowRefreshToken(BasePermission):
    def has_permission(self, request, view):
        # Allow access only to CustomTokenRefreshView
        if view.__class__.__name__ == 'CustomTokenRefreshView':
            logger.debug(f"Allowing refresh token request in allowRefreshToken")
            return True
        logger.debug(f"Allowing refresh token request in allowRefreshToken is failed")
        return request.user and request.user.is_authenticated



