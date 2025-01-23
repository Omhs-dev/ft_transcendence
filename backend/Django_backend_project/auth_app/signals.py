from django.contrib.auth.signals import user_logged_in, user_logged_out
from django.dispatch import receiver
from auth_app.models import Profile
import logging

logger = logging.getLogger('auth_app')


@receiver(user_logged_in)
def user_logged_in_handler(sender, request, user, **kwargs):
    logger.debug(f'Signal: User {user.username} logged in')
    profile = Profile.objects.get(user=user)
    profile.is_online = True
    profile.save()

@receiver(user_logged_out)
def user_logged_out_handler(sender, request, user, **kwargs):
    logger.debug(f'Signal: User {user.username} logged out')
    profile = Profile.objects.get(user=user)
    profile.is_online = False
    profile.save()
