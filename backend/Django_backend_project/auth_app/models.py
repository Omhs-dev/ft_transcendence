from django.contrib.auth.models import User
from django.db import models
# from chat_app.models import profile, BlockedUser, ChatMessage, PongInvitation

# Create your models here.

class User(models.Model):
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128)
    # Add other fields as needed
