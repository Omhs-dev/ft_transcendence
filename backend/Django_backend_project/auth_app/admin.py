from django.contrib import admin
from .models import *
from chat_app.models import *
# Register your models here.

# admin.site.register(User)


class ProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'nickname', 'is_online', 'bio']

    def accepted_friends(self, obj):
        """Display friends who accepted friend requests."""
        return ", ".join([friend.user.username for friend in obj.friends.all()])

    def blocked_users(self, obj):
        """Display users blocked by this profile's user."""
        blocked_users = BlockedUser.objects.filter(blocker=obj.user)
        return ", ".join([blocked.blocked.username for blocked in blocked_users])

    fieldsets = (
        (None, {
            'fields': ('user', 'nickname', 'is_online', 'bio', 'profile_picture', 'friends')
        }),
        ('Additional Info', {
            'fields': ('accepted_friends', 'blocked_users'),
        }),
    )
    readonly_fields = ('accepted_friends', 'blocked_users')

admin.site.register(Profile, ProfileAdmin)
