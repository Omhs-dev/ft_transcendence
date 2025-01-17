from django.contrib import admin
from .models import *
from chat_app.models import *
# Register your models here.

# admin.site.register(User)


# class ProfileAdmin(admin.ModelAdmin):
#     list_display = ['user', 'nickname', 'is_online', 'bio']

#     def accepted_friends(self, obj):
#         """Display friends who accepted friend requests."""
#         return ", ".join([friend.user.username for friend in obj.friends.all()])

#     def blocked_users(self, obj):
#         """Display users blocked by this profile's user."""
#         blocked_users = BlockedUser.objects.filter(blocker=obj.user)
#         return ", ".join([blocked.blocked.username for blocked in blocked_users])

#     fieldsets = (
#         (None, {
#             'fields': ('user', 'nickname', 'is_online', 'bio', 'profile_picture', 'friends')
#         }),
#         ('Additional Info', {
#             'fields': ('accepted_friends', 'blocked_users'),
#         }),
#     )
#     readonly_fields = ('accepted_friends', 'blocked_users')

# admin.site.register(Profile, ProfileAdmin)


class ProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'nickname', 'is_online', 'bio', 'is_2fa_enabled', 'selected_2fa_method']
    list_filter = ['is_2fa_enabled']  # Add a filter for 2FA status

    def accepted_friends(self, obj):
        """Display friends who accepted friend requests."""
        return ", ".join([friend.user.username for friend in obj.friends.all()])

    def blocked_users(self, obj):
        """Display users blocked by this profile's user."""
        blocked_users = BlockedUser.objects.filter(blocker=obj.user)
        return ", ".join([blocked.blocked.username for blocked in blocked_users])

    def selected_2fa_method(self, obj):
        """Display the selected 2FA method."""
        # Logic to determine the 2FA method based on your implementation
        if obj.otp_secret:
            return "Authenticator App"
        elif hasattr(obj.user, 'phone_number') and obj.user.phone_number:  # Assuming phone_number exists
            return "SMS"
        elif obj.user.email:
            return "Email"
        return "None"

    selected_2fa_method.short_description = "2FA Method"  # Admin display column title

    fieldsets = (
        (None, {
            'fields': ('user', 'nickname', 'is_online', 'bio', 'profile_picture', 'friends')
        }),
        ('2FA Status', {
            'fields': ('is_2fa_enabled', 'selected_2fa_method'),
        }),
        ('Additional Info', {
            'fields': ('accepted_friends', 'blocked_users'),
        }),
    )
    readonly_fields = ('accepted_friends', 'blocked_users', 'selected_2fa_method')

admin.site.register(Profile, ProfileAdmin)
