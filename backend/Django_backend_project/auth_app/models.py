from django.contrib.auth.models import User
from django.db import models
from PIL import Image

# from chat_app.models import profile, BlockedUser, ChatMessage, PongInvitation

# Create your models here.

# class User(models.Model):
#     username = models.CharField(max_length=150, unique=True)
#     email = models.EmailField(unique=True)
#     password = models.CharField(max_length=128)
#     # Add other fields as needed

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    nickname = models.CharField(max_length=50, blank=True, null=True)
    is_online = models.BooleanField(default=False)
    bio = models.TextField(blank=True, null=True)
    profile_picture = models.ImageField(upload_to='profile_pics/', blank=True, null=True)
    friends = models.ManyToManyField("self", symmetrical=True, blank=True)
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if self.profile_picture:
            img = Image.open(self.profile_picture.path)

            # Resize the image to a maximum of 300x300 pixels
            if img.height > 300 or img.width > 300:
                output_size = (300, 300)
                img.thumbnail(output_size)
                img.save(self.profile_picture.path)
    
    def __str(self):
        return (self.user.username, self.is_online)
