from django.contrib import admin
from django.contrib.auth.models import User
from .models import Profile
from chat_app.models import BlockedUser
# Register your models here.

# admin.site.register(User)


class ProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'nickname', 'id', 'phone_number', 'email', 'is_online', 'is_2fa_enabled', 'selected_2fa_method']
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
        if obj.two_fa_method:
            return obj.two_fa_method
        return "None"

    def id(self, obj):
        return obj.user.id

    def email(self, obj):
        return obj.user.email

    selected_2fa_method.short_description = "2FA Method"  # Admin display column title

    fieldsets = (
        (None, {
            'fields': ('user', 'nickname', 'phone_number', 'is_online', 'bio', 'profile_picture', 'friends')
        }),
        ('2FA Status', {
            'fields': ('is_2fa_enabled', 'selected_2fa_method'),
        }),
        ('Additional Info', {
            'fields': ('accepted_friends', 'blocked_users'),
        }),
    )
    readonly_fields = ('id', 'accepted_friends', 'blocked_users', 'selected_2fa_method')

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        form.base_fields['friends'].label = 'Registered Users'  # Change the label
        return form


admin.site.register(Profile, ProfileAdmin)
