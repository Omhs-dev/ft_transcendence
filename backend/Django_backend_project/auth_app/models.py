from django.core.validators import RegexValidator
from django.contrib.auth.models import User, AbstractUser
from django.db import models
from PIL import Image
import pyotp
from django.utils import timezone

# Create your models here.


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    nickname = models.CharField(max_length=50, blank=True, null=True)
    is_online = models.BooleanField(default=False)
    bio = models.TextField(blank=True, null=True)
    profile_picture = models.ImageField(upload_to='profile_pics/', blank=True, null=True)
    friends = models.ManyToManyField("self", symmetrical=True, blank=True)
    phone_number = models.CharField(
        max_length=15,
        blank=True,
        null=True,
        validators=[
            RegexValidator(
                regex=r'^\+?1?\d{9,15}$',
                message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed."
            )
        ]
    )
    
	# 2FA Fields
    otp_secret = models.CharField(max_length=32, blank=True, null=True)  # Stores the user's OTP secret
    is_2fa_enabled = models.BooleanField(default=False)
    two_fa_method = models.CharField(
        max_length=20, 
        choices=[('totp', 'Totp'), ('sms', 'SMS'), ('email', 'Email')], 
        blank=True, 
        null=True
    )  # Store the user's chosen 2FA method
    last_otp_sent_at = models.DateTimeField(blank=True, null=True)  # For rate-limiting SMS/Email OTPs

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if self.profile_picture:
            img = Image.open(self.profile_picture.path)

            # Resize the image to a maximum of 300x300 pixels
            if img.height > 300 or img.width > 300:
                output_size = (300, 300)
                img.thumbnail(output_size)
                img.save(self.profile_picture.path)
    

    def generate_otp_secret(self):
        """Generate a new OTP secret for the user."""
        if not self.otp_secret:
            self.otp_secret = pyotp.random_base32()
            self.save()

    def get_totp_uri(self):
        """Generate the TOTP URI for QR code scanning."""
        if not self.otp_secret:
            self.generate_otp_secret()
        return pyotp.totp.TOTP(self.otp_secret).provisioning_uri(
            self.user.email,
            issuer_name="YourAppName"
        )

    def verify_totp(self, token):
        """Verify the provided OTP token for the authenticator app (totp)."""
        if not self.otp_secret:
            return False
        totp = pyotp.TOTP(self.otp_secret)
        return totp.verify(token)

    def can_send_otp(self):
        """Check if enough time has passed to send another SMS/email OTP."""
        if not self.last_otp_sent_at:
            return True
        time_since_last_sent = timezone.now() - self.last_otp_sent_at
        return time_since_last_sent.total_seconds() > 60  # At least 1 minute between sends

    def __str__(self):
        return f"{self.user.username} | Online: {self.is_online} | 2FA: {self.is_2fa_enabled}"
    

