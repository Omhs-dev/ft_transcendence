from rest_framework import serializers
from .models import User  # Replace with your actual model name



class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User  # Specify your model here
        fields = ['username', 'email', 'password']  # Adjust fields as necessary
