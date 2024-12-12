from django.shortcuts import render

# Create your views here.

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import RegisterSerializer


from django.contrib.auth.models import User
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db import connection

@csrf_exempt
def register_user(request):
    if request.method == 'POST':
        # Assume you are getting the username and password in the request body
        username = request.POST.get('username')
        password = request.POST.get('password')

        if not username or not password:
            return JsonResponse({'error': 'Username and password are required'}, status=400)

        try:
            # Create the Django user
            user = User.objects.create_user(username=username, password=password)

            # Create PostgreSQL role for the user
            with connection.cursor() as cursor:
                cursor.execute(f"CREATE ROLE {username} WITH LOGIN PASSWORD '{password}'")

            return JsonResponse({'message': 'User registered successfully!'}, status=201)

        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    else:
        return JsonResponse({'error': 'Only POST requests are allowed'}, status=405)
