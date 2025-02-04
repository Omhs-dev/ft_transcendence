import secrets
from django.utils.timezone import now
from django.core.mail import send_mail
from django.conf import settings
from twilio.rest import Client
from django.core.cache import cache
from twilio.base.exceptions import TwilioRestException
import logging

logger = logging.getLogger("auth_app")


def generate_otp_code():
    """Generate a random 6-digit OTP code."""
    return str(secrets.randbelow(10**6)).zfill(6)


def send_2fa_sms(phone_number, code):
    """Send an SMS verification code to the user's phone."""
   
    # TWILIO_ACCOUNT_SID=""
    # TWILIO_AUTH_TOKEN=""
    # TWILIO_PHONE_NUMBER=""


    logger.info("Sending SMS to %s and the code is:", phone_number, code)
    return

    client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    try:
        message = client.messages.create(
            body=f"Your verification code is: {code}",
            from_= TWILIO_PHONE_NUMBER,  # My Twilio phone number
            to= phone_number
        )
        return message.sid
    except TwilioRestException as e:
        logger.error("Failed to send SMS: %s", e)
        raise


def send_2fa_email(email, otp_code):
    subject = "Your 2FA Verification Code"
    message = f"Your verification code is: {otp_code}. Please enter this code to complete your login."
    from_email = settings.DEFAULT_FROM_EMAIL
    recipient_list = [email]

    try:
        send_mail(subject, message, from_email, recipient_list)
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False


def save_otp_code(user_id, code):
    """Save OTP code to the cache with a 5-minute expiration."""
    cache.set(f"otp_{user_id}", code, timeout=300)


def verify_otp_code(user_id, code):
    """Verify OTP code from the cache."""
    saved_code = cache.get(f"otp_{user_id}")
    cache.delete(f"otp_{user_id}")  # Delete the code after verification
    return saved_code == code


def generate_and_send_Email_SMS_otp(user, method):
    """
    Generate a new OTP and send it via the specified method (email or SMS).
    """
    
    # Generate a 6-digit random OTP
    otp_code = generate_otp_code()
    logger.info("\n\n\n*****\n\tGenerating OTP and sending it via %s\n\n for user %s\n\n code:%s\n\n ", method, user.username, otp_code)

    # Save the OTP and its expiration in the database (assuming a model for this)
    save_otp_code(user.id, otp_code)

    # Send the OTP via the specified method
    if method == 'email':
        send_2fa_email(user.email, otp_code)
        user.profile.last_otp_sent_at = now()
    elif method == 'sms':
        send_2fa_sms(user.profile.phone_number, otp_code)
        user.profile.last_otp_sent_at = now()
