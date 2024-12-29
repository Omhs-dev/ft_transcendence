from rest_framework_simplejwt.tokens import RefreshToken
from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from .serializers import RegisterSerializer
from django.db.utils import IntegrityError
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer

def index(request):
    return render(request,"backend_app/index.htm")

def registration_page(request):
    return render(request, 'backend_app/register.htm')

class RegisterView(APIView):
    """
    API endpoint for user registration.
    """
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
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

# create custom token to be able to add the desired claim as is_admin
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


# class LoginView(APIView):
#     def post(self, request):
#         username = request.data.get('username')
#         password = request.data.get('password')

#         user = User.objects.filter(username=username).first()

#         if user and user.check_password(password):
#             # Generate JWT tokens for the user
#             refresh = RefreshToken.for_user(user)
#             access_token = refresh.access_token

#             # Add custom claim to indicate if the user is an admin
#             access_token['is_admin'] = user.is_superuser

#             return Response({
#                 'access_token': str(access_token),
#                 'refresh_token': str(refresh)
#             }, status=status.HTTP_200_OK)
#         else:
#             return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)


from django.contrib.auth.signals import user_logged_in, user_logged_out
from django.dispatch import receiver
from django.db.models.signals import post_save
from rest_framework.permissions import IsAuthenticated
import logging

class LoginView(APIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        user = User.objects.filter(username=username).first()

        if user and user.check_password(password):
            # Generate JWT tokens for the user
            refresh = RefreshToken.for_user(user)
            access_token = refresh.access_token

            # Add custom claim to indicate if the user is an admin
            access_token['is_admin'] = user.is_superuser

            # Manually trigger the user_logged_in signal
            request.user = user
            user_logged_in.send(sender=user.__class__, request=request, user=user)

            return Response({
                'access_token': str(access_token),
                'refresh_token': str(refresh)
            }, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh_token")
            token = RefreshToken(refresh_token)
            token.blacklist()

            # Manually trigger the user_logged_out signal
            user_logged_out.send(sender=request.user.__class__, request=request, user=request.user)

            return Response({'message': 'User logged out successfully!'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)
