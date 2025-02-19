from django.contrib import admin
from django.utils.html import format_html
from .models import (
    BlockedUser, ChatRoom, ChatMessage, MessageReadStatus, 
    PongInvitation, FriendRequest
)

### 🚫 Blocked Users Admin ###
@admin.register(BlockedUser)
class BlockedUserAdmin(admin.ModelAdmin):
    list_display = ('blocker', 'blocked', 'blocked_at')
    search_fields = ('blocker__username', 'blocked__username')
    list_filter = ('blocked_at',)

### 💬 Chat Room Admin ###

class ChatRoomAdmin(admin.ModelAdmin):
    list_display = ('id', 'user1', 'user2', 'created_at')
    search_fields = ('user1__username', 'user2__username')
    list_filter = ('created_at',)
    readonly_fields = ('message_history',)  # Make message history read-only

    def message_history(self, obj):
        """Display all messages between the users in a chat room."""
        messages = ChatMessage.objects.filter(chat_room=obj).order_by('timestamp')
        if not messages.exists():
            return "No messages yet."

        formatted_messages = "<div style='max-height: 300px; overflow-y: scroll; border: 1px solid #ccc; padding: 5px;'>"
        for msg in messages:
            formatted_messages += f"<p><b>{msg.sender.username}</b> ({msg.timestamp.strftime('%Y-%m-%d %H:%M:%S')}): {msg.message}</p>"
        formatted_messages += "</div>"
        return format_html(formatted_messages)

    message_history.short_description = "Chat History"  # Label in admin panel

admin.site.register(ChatRoom, ChatRoomAdmin)


### 📩 Chat Messages Admin ###
class MessageReadStatusInline(admin.TabularInline):  # Inline for read status
    model = MessageReadStatus
    extra = 1
    readonly_fields = ('user', 'is_read', 'read_at')

@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'chat_room', 'sender', 'message_preview', 'timestamp', 'is_read')
    search_fields = ('sender__username', 'chat_room__user1__username', 'chat_room__user2__username', 'message')
    list_filter = ('timestamp', 'is_read')
    inlines = [MessageReadStatusInline]

    def message_preview(self, obj):
        return obj.message[:50] + "..." if len(obj.message) > 50 else obj.message
    message_preview.short_description = "Message Preview"

### ✅ Message Read Status Admin ###
@admin.register(MessageReadStatus)
class MessageReadStatusAdmin(admin.ModelAdmin):
    list_display = ('message', 'user', 'is_read', 'read_at')
    search_fields = ('message__message', 'user__username')
    list_filter = ('is_read', 'read_at')

### 🏓 Pong Invitations Admin ###
@admin.register(PongInvitation)
class PongInvitationAdmin(admin.ModelAdmin):
    list_display = ('inviter', 'invitee', 'timestamp', 'status')
    search_fields = ('inviter__username', 'invitee__username')
    list_filter = ('status', 'timestamp')

### 🤝 Friend Requests Admin ###
@admin.register(FriendRequest)
class FriendRequestAdmin(admin.ModelAdmin):
    list_display = ('from_user', 'to_user', 'is_accepted')
    search_fields = ('from_user__username', 'to_user__username')
    list_filter = ('is_accepted',)
