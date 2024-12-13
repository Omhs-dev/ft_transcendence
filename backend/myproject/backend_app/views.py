# from django.shortcuts import render
# from rest_framework.views import APIView
# from rest_framework.response import Response
# from rest_framework import status
# from django.contrib.auth.models import User
# from .serializers import RegisterSerializer
# from django.db.utils import IntegrityError

# def index(request):
#     return render(request,"backend_app/index.htm")

# def registration_page(request):
#     return render(request, 'backend_app/register.htm')

# class RegisterView(APIView):
#     """
#     API endpoint for user registration.
#     """
#     def post(self, request):
#         serializer = RegisterSerializer(data=request.data)
#         if serializer.is_valid():
#             try:
#                 # Save the user using the serializer
#                 serializer.save()
#                 return Response({'message': 'User registered successfully!'}, status=status.HTTP_201_CREATED)
#             except IntegrityError:
#                 return Response({'error': 'A user with this username or email already exists.'}, status=status.HTTP_400_BAD_REQUEST)
#         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

#     def get(self, request):
#         # Provide a message or metadata for GET requests
#         return Response({'message': 'Send a POST request to register a new user.'}, status=status.HTTP_200_OK)


from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.models import User
import json


def index(request):
    return render(request,"backend_app/index.htm")

# Serve the registration page
def registration_page(request):
    return render(request, "backend_app/register.htm")

# Handle user registration API request
@csrf_exempt  # Disable CSRF for simplicity (use proper CSRF tokens in production)
def register_user(request):
    if request.method == 'POST':
        try:
            # Parse JSON request body
            data = json.loads(request.body)
            username = data.get('username')
            password = data.get('password')
            email = data.get('email')

            # Validate input
            if not username or not password or not email:
                return JsonResponse({'error': 'Username, email, and password are required'}, status=400)

            # Create user
            user = User.objects.create_user(username=username, password=password, email=email)
            return JsonResponse({'message': 'User registered successfully'}, status=201)

        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'Invalid HTTP method'}, status=405)
