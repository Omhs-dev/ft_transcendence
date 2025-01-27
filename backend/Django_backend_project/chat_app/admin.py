from django.contrib import admin
from .models import BlockedUser, ChatMessage, PongInvitation

# admin.site.register(Profile)
admin.site.register(BlockedUser)
admin.site.register(ChatMessage)
admin.site.register(PongInvitation)
