from django.shortcuts import redirect
from django.conf import settings
import urllib.parse
import logging
from django.contrib.auth.signals import user_logged_in
from django.http import JsonResponse
import requests
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from django.middleware import csrf
from django.middleware.csrf import get_token
import logging

logger = logging.getLogger(__name__)


def initiate_42_oauth(request):
    # Build the URL for 42's authorization endpoint
    params = {
        'client_id': settings.OAUTH_42_CLIENT_ID,
        'redirect_uri': settings.OAUTH_42_REDIRECT_URI,
        'response_type': 'code',  # We want an authorization code
        'scope': 'public'  # Request access to the user's public profile
    }
    auth_url = f"{settings.OAUTH_42_AUTHORIZE_URL}?{urllib.parse.urlencode(params)}"
    logger.debug("\n\nauth_url created for the 42: \n %s\n", auth_url)
    return redirect(auth_url)


def callback_42_auth(request):
    code = request.GET.get('code')
    logger.debug("Received OAuth code from 42: %s", code)

    if not code:
        return redirect(f"{settings.FRONTEND_URL}/auth/register?error=AuthorizationFailed")

    # Exchange the code for an access token
    token_data = exchange_code_for_token(code)
    if not token_data:
        return redirect(f"{settings.FRONTEND_URL}/auth/register?error=TokenExchangeFailed")

    access_token = token_data.get('access_token')

    # Fetch user information from 42 API
    user_info = fetch_42_user_info(access_token)
    if not user_info:
        return redirect(f"{settings.FRONTEND_URL}/auth/register?error=UserFetchFailed")

    # Authenticate or create the user
    user = get_or_create_user(user_info)
    if not user.is_active:
        return Response({"error": "This account is not active"}, status=403)

    # Set JWT tokens as HTTP-only cookies
    response = set_jwt_cookies(user)

    # Trigger user_logged_in signal
    request.user = user
    user_logged_in.send(sender=user.__class__, request=request, user=user)

    # Set CSRF token in response
    csrf.get_token(request)

    # logger.debug("\n\nresponse.data: \n%s", response.data)
    
    """
    ✅ Instead of returning JSON, redirect the user to the frontend with setting `location` header
    and `status code 302` to handle the redirection on the frontend automatically with the browser.
    """
    response['Location'] = f"{settings.FRONTEND_URL}/auth/register"
    response.status_code = 302  # 302 Found (Temporary Redirect)
    
    logger.debug("Login successful, response sent with JWT cookies.")
    return response


# ---------------- HELPER FUNCTIONS ---------------- #

def exchange_code_for_token(code):
    """ Exchanges the authorization code for an access token from 42. """
    token_url = settings.OAUTH_42_TOKEN_URL
    data = {
        'grant_type': 'authorization_code',
        'client_id': settings.OAUTH_42_CLIENT_ID,
        'client_secret': settings.OAUTH_42_CLIENT_SECRET,
        'redirect_uri': settings.OAUTH_42_REDIRECT_URI,
        'code': code,
    }
    
    try:
        response = requests.post(token_url, data=data)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        logger.error("Failed to exchange code for token: %s", e)
        return None


def fetch_42_user_info(access_token):
    """ Fetches the user's profile from 42 using the access token. """
    headers = {'Authorization': f'Bearer {access_token}'}
    
    try:
        response = requests.get(settings.OAUTH_42_USER_INFO_URL, headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        logger.error("Failed to fetch user info from 42: %s", e)
        return None


def get_or_create_user(user_info):
    """ Gets or creates a user based on 42's user data. """
    email = user_info.get('email')
    username = user_info.get('login')

    user, created = User.objects.get_or_create(
        username=username,
        # defaults={'email': email, 'password': User.objects.make_random_password()}
        defaults={'email': email, 'password': 12345678}
    )
    return user


def set_jwt_cookies(user):
    """ Sets JWT access and refresh tokens as HTTP-only cookies. """
    tokens = RefreshToken.for_user(user)
    access_token = str(tokens.access_token)
    refresh_token = str(tokens)
    logger.info("Access token: %s", access_token)

    response = JsonResponse({  # ✅ Use JsonResponse instead of Response
        "success": "User logged in successfully via 42",
        "data": {"access": access_token, "refresh": refresh_token},
    })

    response.set_cookie(
        key=settings.SIMPLE_JWT['AUTH_COOKIE'],
        value=access_token,
        expires=settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'],
        secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
        httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
        samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE']
    )
    response.set_cookie(
        key='refresh_token',
        value=refresh_token,
        expires=settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'],
        secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
        httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
        samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE']
    )
    
    return response

