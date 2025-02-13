from django.db import models
from django.contrib.auth.models import User
from django.db import models
from auth_app.models import Profile


class BlockedUser(models.Model):
    blocker = models.ForeignKey(User, on_delete=models.CASCADE, related_name='blocked_by')
    blocked = models.ForeignKey(User, on_delete=models.CASCADE, related_name='blocked_users')
    blocked_at = models.DateTimeField(auto_now_add=True)

class ChatRoom(models.Model):  # New: Represents a chat room
    user1 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_rooms1')
    user2 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_rooms2')
    created_at = models.DateTimeField(auto_now_add=True)  # Add creation timestamp

    class Meta:
        unique_together = ('user1', 'user2')  # Ensure only one chat room per user pair

    def __str__(self):
        return f"Chat between {self.user1.username} and {self.user2.username}"

class ChatMessage(models.Model):
    chat_room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='messages', db_index=True)  # Add index
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

class MessageReadStatus(models.Model):
    message = models.ForeignKey(ChatMessage, on_delete=models.CASCADE, related_name='read_statuses')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)



class PongInvitation(models.Model):
    inviter = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_invitations')
    invitee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_invitations')
    timestamp = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=      [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected')
    ], default='pending')

class FriendRequest(models.Model):
    from_user = models.ForeignKey(User, related_name='sent_requests', on_delete=models.CASCADE)
    to_user = models.ForeignKey(User, related_name='received_requests', on_delete=models.CASCADE)
    is_accepted = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.from_user.username} -> {self.to_user.username}"
