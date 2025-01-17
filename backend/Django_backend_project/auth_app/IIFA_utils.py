import secrets

def generate_otp_code():
    """Generate a random 6-digit OTP code."""
    return str(secrets.randbelow(10**6)).zfill(6)


from twilio.rest import Client

def send_sms(phone_number, code):
    """Send an SMS verification code to the user's phone."""
    client = Client("TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN")
    message = client.messages.create(
        body=f"Your verification code is: {code}",
        from_="+1234567890",  # Your Twilio phone number
        to=phone_number
    )
    return message.sid


from django.core.mail import send_mail

def send_email(email, code):
    """Send an email verification code to the user."""
    subject = "Your Verification Code"
    message = f"Your verification code is: {code}"
    send_mail(subject, message, "no-reply@yourapp.com", [email])


from django.core.cache import cache

def save_otp_code(user_id, code):
    """Save OTP code to the cache with a 5-minute expiration."""
    cache.set(f"otp_{user_id}", code, timeout=300)


def verify_otp_code(user_id, code):
    """Verify OTP code from the cache."""
    saved_code = cache.get(f"otp_{user_id}")
    return saved_code == code


