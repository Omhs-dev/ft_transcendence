from rest_framework_simplejwt.tokens import RefreshToken
from django.middleware import csrf
from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from .serializers import RegisterSerializer
from django.db.utils import IntegrityError
from django.contrib.auth.signals import user_logged_in, user_logged_out
from django.dispatch import receiver
from django.db.models.signals import post_save
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.middleware.csrf import get_token
from rest_framework.permissions import AllowAny 
from rest_framework.authentication import SessionAuthentication, BasicAuthentication
from rest_framework_simplejwt.views import TokenRefreshView
from django.conf import settings
from rest_framework.decorators import authentication_classes, permission_classes
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from .authenticate import AllowRefreshToken
from django.utils.timezone import now
import logging



def index(request):
    return render(request,"auth_app/index.htm")

def registration_page(request):
    return render(request, 'auth_app/register.htm')


logger = logging.getLogger('auth_app')

@authentication_classes([])
@permission_classes([AllowAny])
class RegisterView(APIView):
    """
    API endpoint for user registration.
    """
    # permission_classes = [AllowAny]  # Allow unauthenticated users to register
    
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        logger.debug("Request data: %s", request.data)
        if serializer.is_valid():
            try:
                # Save the user using the serializer
                serializer.save()
                return Response({'message': 'User registered successfully!'}, status=status.HTTP_201_CREATED)
            except IntegrityError:
                return Response({'error': 'A user with this username or email already exists.'}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request):
        # Provide a message or metadata for GET requests
        return Response({'message': 'Send a POST request to register a new user.'}, status=status.HTTP_200_OK)


@authentication_classes([])
@permission_classes([AllowAny])
class LoginView(APIView):
    # permission_classes = [AllowAny]  # Allow unauthenticated users to register
    
    logger.debug("Login function request received")
    def post(self, request, format=None):
        data = request.data
        response = Response()
        username = data.get('username', None)
        password = data.get('password', None)
        user = authenticate(username=username, password=password)

        if user is not None:
            if user.is_active:
                tokens = RefreshToken.for_user(user)
                access_token = str(tokens.access_token)
                refresh_token = str(tokens)

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
                #  Trigger user_logged_in signal
                request.user = user
                user_logged_in.send(sender=user.__class__, request=request, user=user)

                csrf.get_token(request)
                response.data = {"Success": "Login successful", "data": {"access": access_token, "refresh": refresh_token}}
                logger.debug("response.data: %s", response.data)
                return response
            else:
                return Response({"error": "This account is not active"}, status=status.HTTP_403_FORBIDDEN)
        else:
            return Response({"error": "Invalid username or password"}, status=status.HTTP_401_UNAUTHORIZED)


@authentication_classes([])
@permission_classes([AllowAny])
class LogoutView(APIView):
    # permission_classes = [AllowAny] // this is used when the user supposed to be not authenticated
    # permission_classes = [IsAuthenticated] // This is the default permission class and it is used when the user supposed to be authenticated
    
    def post(self, request):
        logger.debug("Logout request received for user: %s", request.user)
        response = Response()

        response.delete_cookie(settings.SIMPLE_JWT['AUTH_COOKIE'])
        response.delete_cookie('refresh_token')


        refresh_token = request.COOKIES.get('refresh_token', None)
        # import pdb; pdb.set_trace()
        logger.debug("Refresh token found in cookies: %s", refresh_token)
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                if not request.user.username: # Check if the user is NOT authenticated
                    user_id = token['user_id']
                    user = User.objects.get(id=user_id)
                    logger.debug("User found in refresh token in logout: %s", user.username)        
                token.blacklist()  # Invalidate the token if blacklisting is enabled
            except Exception as e:
                logger.error("Error blacklisting token: %s", e)
                # pass  # Handle the case where the token might already be invalidated

        response.data = {"Success": "Logout successful"}
        response.status_code = status.HTTP_200_OK

        # Check if the user is authenticated before sending the signal 
        if request.user.username:
            user_logged_out.send(sender=request.user.__class__, request=request, user=request.user)
            logger.info("User %s is_authenticated and logged out successfully", request.user.username)
        elif user.username:
            logger.info("User '%s' (is not authenticated and retrieved from refresh_token) logged out successfully", request.user.username)
            user_logged_out.send(sender=request.user.__class__, request=request, user=user)
        else:
            logger.debug("Signal: Anonymous user, no logout signal sent")

        return response


def handle_expired_refresh_token(user_id):
    user = User.objects.get(id=user_id)
    user.is_online = False
    user.last_logout_time = now()
    user.save()
    logger.debug("User %s is now offline with handle_expired_refresh_token function", user.username)


# @authentication_classes([])
# @permission_classes([AllowAny])
class CustomTokenRefreshView(TokenRefreshView):
    permission_classes = [AllowRefreshToken]
    logger.debug("CustomTokenRefreshView request received")
    def post(self, request, *args, **kwargs):
    # def post(self, request):
        refresh_token = request.COOKIES.get('refresh_token', None)
        logger.debug("Refresh token in CustomTokenRefreshView: %s", refresh_token)
        # import pdb; pdb.set_trace()
        serializer = self.get_serializer(data={"refresh": refresh_token})

        try:
            serializer.is_valid(raise_exception=True)
        except TokenError as e:
            handle_expired_refresh_token()
            raise InvalidToken(e.args[0])

        response = Response(serializer.validated_data, status=status.HTTP_200_OK)
        
        # Set the new access token as an HTTP-only cookie
        access_token = serializer.validated_data.get('access')
        response.set_cookie(
            key=settings.SIMPLE_JWT['AUTH_COOKIE'], 
            value=access_token,
            expires=settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'],
            secure=settings.SIMPLE_JWT['AUTH_COOKIE_SECURE'],
            httponly=settings.SIMPLE_JWT['AUTH_COOKIE_HTTP_ONLY'],
            samesite=settings.SIMPLE_JWT['AUTH_COOKIE_SAMESITE']
        )
        logger.debug("Response for Access token in CustomTokenRefreshView: %s", response.data)
        return response

