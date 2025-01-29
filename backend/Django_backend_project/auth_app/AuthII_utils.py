from django.shortcuts import redirect
from django.conf import settings
import urllib.parse
import logging
from django.contrib.auth.signals import user_logged_in


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


from django.http import JsonResponse
import requests
from rest_framework.response import Response
from rest_framework import status
from auth_app.models import Profile
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from django.middleware import csrf
from django.middleware.csrf import get_token
import logging

logger = logging.getLogger(__name__)

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

    logger.debug("Login successful, response sent with JWT cookies.")
    # logger.debug("\n\nresponse.data: \n%s", response.data)
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


from django.http import JsonResponse

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


# def set_jwt_cookies(user):
#     """ Sets JWT access and refresh tokens as HTTP-only cookies. """
#     tokens = RefreshToken.for_user(user)
#     access_token = str(tokens.access_token)
#     refresh_token = str(tokens)
#     logger.info("Access token: %s", access_token)

#     response = Response({
#         "Success": "User logged in successfully via 42",
#         "data": {"access": access_token, "refresh": refresh_token},
#     })
#     response.set_cookie(
#         key=settings.SIMPLE_JWT['AUTH_COOKIE'],
#         value=access_token,
#         expires=settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'],
#         secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
#         httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
#         samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE']
#     )
#     response.set_cookie(
#         key='refresh_token',
#         value=refresh_token,
#         expires=settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'],
#         secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
#         httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
#         samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE']
#     )
    
#     return response



# def callback_42_auth(request):
#     code = request.GET.get('code')
#     logger.debug("\n\nCode received from 42: %s\n", code)
#     if not code:
#         # return JsonResponse({'error': 'Authorization code not provided'}, status=status.HTTP_400_BAD_REQUEST)
#         return redirect(f"{settings.FRONTEND_URL}/auth/register?error=AuthorizationFailed")

#     # Exchange the code for an access token
#     token_url = settings.OAUTH_42_TOKEN_URL
#     data = {
#         'grant_type': 'authorization_code',
#         'client_id': settings.OAUTH_42_CLIENT_ID,
#         'client_secret': settings.OAUTH_42_CLIENT_SECRET,
#         'redirect_uri': settings.OAUTH_42_REDIRECT_URI,
#         'code': code,
#     }

#     token_response = requests.post(token_url, data=data)
#     if token_response.status_code != 200:
#         # return JsonResponse({'error': 'Failed to obtain access token'}, status=token_response.status_code)
#         return redirect(f"{settings.FRONTEND_URL}/auth/register?error=TokenExchangeFailed")


#     token_data = token_response.json()
#     access_token = token_data.get('access_token')

#     # Use the access token to fetch the user's profile
#     user_info_response = requests.get(settings.OAUTH_42_USER_INFO_URL, headers={
#         'Authorization': f'Bearer {access_token}'
#     })

#     if user_info_response.status_code != 200:
#         # return JsonResponse({'error': 'Failed to fetch user information'}, status=user_info_response.status_code)
#         return redirect(f"{settings.FRONTEND_URL}/auth/register?error=UserFetchFailed")


#     user_info = user_info_response.json()
#     email = user_info.get('email')
#     username = user_info.get('login')

#     # Ensure the user exists or create them
#     user, created = User.objects.get_or_create(username=username, defaults={
#         'email': email,
#         'password': User.objects.make_random_password(),
#     })

#     if created and user.is_active:
#         # Profile.objects.create(user=user)  # Create a Profile for the new user if necessary

#     # Authenticate the user
#         tokens = RefreshToken.for_user(user)
#         response = Response({
#             "access": str(tokens.access_token),
#             "refresh": str(tokens),
#             "message": "User logged in successfully via 42",
#         })

#         # Set cookies for JWT
#         response.set_cookie(
#             key=settings.SIMPLE_JWT['AUTH_COOKIE'],
#             value=str(tokens.access_token),
#             expires=settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'],
#             secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
#             httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
#             samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE']
#         )
#         response.set_cookie(
#             key='refresh_token',
#             value=str(tokens),
#             expires=settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'],
#             secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
#             httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
#             samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE']
#         )

#             #  Trigger user_logged_in signal
#         request.user = user
#         user_logged_in.send(sender=user.__class__, request=request, user=user)

#         # Set the CSRF token in the response
#         csrf.get_token(request)

#         logger.debug("response.data: %s", response.data)

#         return response
#     else:
#         return Response({"error": "This account is not active"}, status=status.HTTP_403_FORBIDDEN)

# import requests
# from django.shortcuts import redirect
# from django.conf import settings
# from django.contrib.auth import login
# from django.contrib.auth.models import User
# from rest_framework.response import Response
# from rest_framework.decorators import api_view
# from auth_app.models import Profile  # Import your Profile model

# # Step 1: Redirect user to 42 OAuth authorization
# @api_view(['GET'])
# def initiate_42_oauth(request):
#     auth_url = f"https://api.intra.42.fr/oauth/authorize?client_id={settings.SOCIALACCOUNT_PROVIDERS['oauth2']['APP']['client_id']}&redirect_uri={settings.LOGIN_REDIRECT_URL}&response_type=code"
#     return redirect(auth_url)

# # Step 2: Handle 42 OAuth callback
# @api_view(['GET'])
# def oauth_callback(request):
#     code = request.GET.get('code')
    
#     if not code:
#         return Response({"error": "Authorization failed"}, status=400)

#     # Step 3: Exchange authorization code for access token
#     token_url = "https://api.intra.42.fr/oauth/token"
#     data = {
#         "grant_type": "authorization_code",
#         "client_id": settings.SOCIALACCOUNT_PROVIDERS['oauth2']['APP']['client_id'],
#         "client_secret": settings.SOCIALACCOUNT_PROVIDERS['oauth2']['APP']['secret'],
#         "code": code,
#         "redirect_uri": settings.LOGIN_REDIRECT_URL
#     }

#     response = requests.post(token_url, data=data)
#     token_data = response.json()
    
#     if 'access_token' not in token_data:
#         return Response({"error": "Failed to get access token"}, status=400)

#     access_token = token_data["access_token"]

#     # Step 4: Fetch user data from 42 API
#     user_info_url = "https://api.intra.42.fr/v2/me"
#     headers = {"Authorization": f"Bearer {access_token}"}
#     user_response = requests.get(user_info_url, headers=headers)
#     user_data = user_response.json()

#     if 'id' not in user_data:
#         return Response({"error": "Failed to fetch user data"}, status=400)

#     # Step 5: Authenticate or create user
#     username = user_data["login"]
#     email = user_data["email"]
#     first_name = user_data["first_name"]
#     last_name = user_data["last_name"]

#     user, created = User.objects.get_or_create(username=username, defaults={"email": email, "first_name": first_name, "last_name": last_name})

#     if created:
#         user.set_unusable_password()
#         user.save()
#         Profile.objects.create(user=user)  # Create profile for the new user

#     login(request, user)

#     return Response({"message": "Login successful", "user": {"username": username, "email": email}})
