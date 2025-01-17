from rest_framework_simplejwt.tokens import RefreshToken
from django.middleware import csrf
from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from .models import Profile
from django.contrib.auth import authenticate
from .serializers import RegisterSerializer, ProfileSerializer
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
        # response = Response()
        username = data.get('username', None)
        password = data.get('password', None)
        user = authenticate(username=username, password=password)

        if user is not None:

            # Check if 2FA is enabled for the user
            if user.profile.is_2fa_enabled:
                response = check_login_2fa(request, user)
                if response:
                    return response
            
            logger.debug("User %s is authenticated in the login class:", user.username)

            # Check if the user is active and login
            if user.is_active:
                tokens = RefreshToken.for_user(user)
                access_token = str(tokens.access_token)
                refresh_token = str(tokens)
                logger.debug("Access token: %s", access_token)

                response = Response({
                    "Success": "Login successful",
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

                #  Trigger user_logged_in signal
                request.user = user
                user_logged_in.send(sender=user.__class__, request=request, user=user)

                # Set the CSRF token in the response
                csrf.get_token(request)

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


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Retrieve the authenticated user's profile."""
        profile = request.user.profile
        serializer = ProfileSerializer(profile)
        return Response(serializer.data, status=200)

    def post(self, request):
        """Update or fill in the profile details."""
        profile = request.user.profile
        serializer = ProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=200)
        return Response(serializer.errors, status=400)


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


# class Select2FAMethodView(APIView):
#     permission_classes = [IsAuthenticated]

#     def post(self, request):
#         """Allow the user to select a 2FA method."""
#         method = request.data.get('method')
#         if method not in ['authenticator', 'sms', 'email']:
#             return Response({"error": "Invalid 2FA method selected."}, status=400)

#         profile = request.user.profile
#         profile.is_2fa_enabled = False  # Disable existing 2FA during setup
#         profile.otp_secret = None  # Clear the OTP secret if switching methods
#         profile.save()

#         if method == 'authenticator':
#             profile.generate_otp_secret()
#             totp_uri = profile.get_totp_uri()
#             return Response({
#                 "message": "Authenticator app 2FA selected.",
#                 "totp_uri": totp_uri
#             })

#         elif method == 'sms':
#             # Generate and send an SMS verification code
#             code = generate_otp_code()  # Implement a function to generate OTP
#             send_sms(request.user.phone_number, code)  # Use an SMS API
#             return Response({"message": "SMS 2FA selected. Verification code sent."})

#         elif method == 'email':
#             # Generate and send an email verification code
#             code = generate_otp_code()  # Implement a function to generate OTP
#             send_email(request.user.email, code)  # Use an email API
#             return Response({"message": "Email 2FA selected. Verification code sent."})




# class Enable2FAView(APIView):
#     permission_classes = [IsAuthenticated]

#     def get(self, request):
#         """Generate and return a QR code for TOTP setup."""
#         profile = request.user.profile
#         profile.generate_otp_secret()
#         totp_uri = profile.get_totp_uri()

#         # Generate QR code
#         qr = qrcode.QRCode()
#         qr.add_data(totp_uri)
#         qr.make(fit=True)
#         img = qr.make_image(fill="black", back_color="white")
        
#         buffer = BytesIO()
#         img.save(buffer)
#         buffer.seek(0)

#         return Response({
#             "qr_code": buffer.getvalue().hex(),  # Send as hex or base64 for the frontend
#             "totp_uri": totp_uri
#         })



def check_login_2fa(request, user):
        method = request.data.get("method")  # authenticator, sms, or email
        code = request.data.get("otp_code")
        
        logger.debug("2FA method: %s and the otp_code in the check_login_2fa: %s", method, code)
        if not method or not code:
            return Response({"error": "2FA verification required."}, headers={'X-2FA-Required': 'true'}, status=401)

        if method == 'authenticator' and not user.profile.verify_otp(code):
            return Response({"error": "Invalid OTP code for Authenticator."}, status=401)
        elif method in ['sms', 'email'] and not verify_otp_code(user.id, code):
        # elif method in ['sms', 'email'] and not user.profile.verify_otp(code):
            return Response({"error": "Invalid OTP code."}, status=401)


import qrcode
from io import BytesIO
from django.utils.timezone import now
from .IIFA_utils import generate_otp_code, verify_otp_code, save_otp_code, send_sms, send_email  # Ensure these utilities are implemented

class Select2FAMethodView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Allow the user to select a preferred 2FA method."""
        method = request.data.get('method')
        logger.debug("2FA method selected: %s", method)
        if method not in ['authenticator', 'sms', 'email']:
            return Response({"error": "Invalid 2FA method selected."}, status=400)

        profile = request.user.profile

        # Reset previous 2FA settings
        profile.is_2fa_enabled = False
        profile.otp_secret = None
        profile.two_fa_method = None
        profile.last_otp_sent_at = None
        profile.save()

        if method == 'authenticator':
            # Setup for authenticator app
            profile.generate_otp_secret()
            totp_uri = profile.get_totp_uri()

            # Generate QR code for the TOTP URI
            qr = qrcode.QRCode()
            qr.add_data(totp_uri)
            qr.make(fit=True)
            img = qr.make_image(fill="black", back_color="white")

            buffer = BytesIO()
            img.save(buffer)
            buffer.seek(0)

            profile.two_fa_method = 'authenticator'
            profile.save()

            return Response({
                "qr_code": buffer.getvalue().hex(),  # Send as hex or base64 for the frontend
                "totp_uri": totp_uri,
                "message": "Authenticator 2FA selected. Scan the QR code with your app."
            }, status=200)

        elif method == 'sms':
            # Generate and send an SMS verification code
            if not hasattr(request.user, 'phone_number') or not request.user.phone_number:
                return Response({"error": "Phone number is not set for the user."}, status=400)

            if not profile.can_send_otp():
                return Response({"error": "Please wait before requesting another OTP."}, status=429)

            code = generate_otp_code()  # Implement a secure OTP generator
            save_otp_code(request.user.id, code)  # Save the OTP for later verification
            send_sms(request.user.phone_number, code)  # Implement SMS sending logic

            profile.two_fa_method = 'sms'
            profile.last_otp_sent_at = now()
            profile.save()

            return Response({
                "message": "SMS 2FA selected. Verification code sent to your phone."
            }, status=200)

        elif method == 'email':
            # Generate and send an email verification code
            if not request.user.email:
                return Response({"error": "Email address is not set for the user."}, status=400)

            if not profile.can_send_otp():
                return Response({"error": "Please wait before requesting another OTP."}, status=429)

            code = generate_otp_code()  # Implement a secure OTP generator
            save_otp_code(request.user.id, code)  # Save the OTP for later verification
            send_email(request.user.email, code)  # Implement email sending logic

            profile.two_fa_method = 'email'
            profile.last_otp_sent_at = now()
            profile.save()

            return Response({
                "message": "Email 2FA selected. Verification code sent to your email."
            }, status=200)



class Verify2FASetupView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Verify the user's selected 2FA setup."""
        method = request.data.get('method')
        code = request.data.get('code')

        profile = request.user.profile
        if method == 'authenticator':
            if not profile.verify_otp(code):
                return Response({"error": "Invalid OTP code for Authenticator."}, status=400)
            profile.is_2fa_enabled = True

        elif method == 'sms' or method == 'email':
            # Verify the OTP code sent via SMS or email
            if not verify_otp_code(request.user.id, code):  # Implement OTP storage/verification
                return Response({"error": "Invalid OTP code."}, status=400)
            profile.is_2fa_enabled = True

        profile.save()
        return Response({"message": "2FA setup complete."})
