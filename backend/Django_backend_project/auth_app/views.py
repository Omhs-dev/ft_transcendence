from rest_framework_simplejwt.tokens import RefreshToken
from django.middleware import csrf
from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from .serializers import RegisterSerializer, ProfileSerializer
from django.db.utils import IntegrityError
from django.contrib.auth.signals import user_logged_in, user_logged_out
from rest_framework.permissions import IsAuthenticated
from rest_framework.permissions import AllowAny 
from rest_framework_simplejwt.views import TokenRefreshView
from django.conf import settings
from rest_framework.decorators import authentication_classes, permission_classes, api_view
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from .authenticate import AllowRefreshToken
from django.utils.timezone import now
from django.http import JsonResponse
import qrcode
from io import BytesIO
from .IIFA_utils import *  # Ensure these utilities are implemented
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
                logger.info("2FA is enabled for the user: %s", user.username)
                response = check_login_2fa(request, user)
                if response:
                    return response
            
            logger.info("User %s is authenticated in the login class:", user.username)

            # Check if the user is active and login
            if user.is_active:
                tokens = RefreshToken.for_user(user)
                access_token = str(tokens.access_token)
                refresh_token = str(tokens)
                logger.info("Access token: %s", access_token)

                response = Response({
                    "user_id": user.id,
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


def check_login_2fa(request, user):
    method = request.data.get("method")  # 'totp', 'sms', or 'email'
    code = request.data.get("otp_code")
    
    logger.debug("2FA method: %s and the otp_code in the check_login_2fa: %s", method, code)
    
    # If no code provided, generate a new code for email or SMS and send it
    if not method or not code:
        user_method = user.profile.two_fa_method
        if user_method in ['sms', 'email', 'totp']:
            generate_and_send_Email_SMS_otp(user, user_method)
            return Response(
                {
                	"method": "{}".format(user_method),
                	"message": "2FA verification required. A new code has been sent.",
					"detail": "Please enter the verification code sent to your {}".format(user_method)
				},
                headers={'X-2FA-Required': 'true'},
                status=401
            )
        # return Response({"error": "2FA verification required."}, headers={'X-2FA-Required': 'true'}, status=401)

    # if method in ['sms', 'email'] and not code:

    # Validate the provided OTP code
    if method == 'totp' and not user.profile.verify_totp(code):
        return Response({"error": "Invalid OTP code for Authenticator."}, status=401)
    elif method in ['sms', 'email'] and not verify_otp_code(user.id, code):
        return Response({"error": "Invalid OTP code."}, status=401)



class Select2FAMethodView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Allow the user to select a preferred 2FA method."""
        method = request.data.get('method')
        logger.debug("2FA method selected: %s", method)
        if method not in ['totp', 'sms', 'email']:
            return Response({"error": "Invalid 2FA method selected."}, status=400)

        profile = request.user.profile
        logger.debug("\n\n2FA method selected for the user: %s", profile)
        # Reset previous 2FA settings
        # profile.is_2fa_enabled = False
        # profile.otp_secret = None # later I should remove this attribute of profile model
        # profile.two_fa_method = None
        # profile.last_otp_sent_at = None
        # profile.save()

        if method == 'totp':
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

            profile.two_fa_method = 'totp'
            profile.save()

            return Response({
                "qr_code": buffer.getvalue().hex(),  # Send as hex or base64 for the frontend
                "totp_uri": totp_uri,
                "message": "Authenticator(totp) 2FA selected. Scan the QR code with your app."
            }, status=200)



        elif method == 'sms':
            # Generate and send an SMS verification code
            if not hasattr(request.user.profile, 'phone_number') or not request.user.profile.phone_number:
                return Response({"error": "Phone number is not set for the user."}, status=400)

            if not profile.can_send_otp():
                return Response({"error": "Please wait before requesting another OTP."}, status=429)

            generate_and_send_Email_SMS_otp(request.user, 'sms')
            profile.two_fa_method = 'sms'
            profile.save()

            return Response({
                "message": "SMS 2FA selected. Verification code sent to your phone."
            }, status=200)



        elif method == 'email':
            if not profile.can_send_otp():
                return Response({"error": "Please wait before requesting another OTP."}, status=429)

            generate_and_send_Email_SMS_otp(request.user, 'email')
            profile.two_fa_method = 'email'
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

        logger.debug("2FA method: %s and the otp_code in the Verify2FASetupView: %s", method, code)

        profile = request.user.profile
        if method == 'totp':
            if not profile.verify_totp(code):
                return Response({"error": "Invalid OTP code for Authenticator(totp)."}, status=400)
            profile.is_2fa_enabled = True

        elif method == 'sms' or method == 'email':
            # Verify the OTP code sent via SMS or email
            if not verify_otp_code(request.user.id, code):  # Implement OTP storage/verification
                return Response({"error": "Invalid OTP code."}, status=400)
            profile.is_2fa_enabled = True
        elif profile.two_fa_method & method != profile.two_fa_method:
            return Response({"error": "Invalid 2FA method selected."}, status=400)
        profile.save()
        return Response({"message": "2FA setup complete."})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_2fa_method(request):
    user = request.user
    data = json.loads(request.body)
    new_method = data.get('method')

    if new_method not in ['totp', 'sms', 'email']:
        return JsonResponse({'error': 'Invalid 2FA method.'}, status=400)

    if new_method == 'sms' and not user.profile.phone_number:
        return JsonResponse({'error': 'Phone number is required for SMS 2FA.'}, status=400)

    user.profile.two_factor_method = new_method
    user.profile.save()
    return JsonResponse({'message': '2FA method changed successfully.', 'new_method': new_method})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def disable_2fa(request):
    user = request.user

    logger.debug("2FA method disabled for the user: %s", user.username)
    
    user.profile.is_2fa_enabled = False
    user.profile.otp_secret = None
    user.profile.two_fa_method = None
    user.profile.last_otp_sent_at = None
    user.profile.save()

    return JsonResponse({'message': '2FA disabled successfully.'})
