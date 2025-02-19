from django.contrib.auth.signals import user_logged_in, user_logged_out
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from auth_app.models import Profile
import logging

logger = logging.getLogger('chat_app')

@receiver(post_save, sender=User)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    logger.debug('Signal: create_or_update_user_profile triggered')
    if created:
        Profile.objects.create(user=instance)
    else:
        instance.profile.save()
