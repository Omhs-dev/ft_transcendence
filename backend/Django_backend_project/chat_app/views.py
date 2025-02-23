from rest_framework.views import APIView
from django.shortcuts import render
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import ChatMessage, BlockedUser, PongInvitation, FriendRequest
from django.contrib.auth.models import User
from auth_app.models import Profile
from rest_framework import status

def index(request):
    return render(request, 'chat_app/index.htm')


class ChatHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, receiver_id):
        # Check if the user has blocked the receiver
        is_blocked = BlockedUser.objects.filter(user=request.user, blocked_user_id=receiver_id).exists()
        if is_blocked:
            return Response({'error': 'Cannot fetch chat history with a blocked user.'}, status=403)

        messages = ChatMessage.objects.filter(
            sender=request.user, receiver_id=receiver_id
        ) | ChatMessage.objects.filter(
            sender_id=receiver_id, receiver=request.user
        ).order_by('timestamp')
        return Response([
            {
                'message': msg.message,
                'sender': msg.sender.username,
                'timestamp': msg.timestamp
            } for msg in messages
        ])


class PongInviteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, invitee_id):
        PongInvitation.objects.create(inviter=request.user, invitee_id=invitee_id)
        return Response({'message': 'Invitation sent!'})


class BlockUserView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, user_id):
        blocked_user = User.objects.get(id=user_id)
        BlockedUser.objects.get_or_create(blocker=request.user, blocked=blocked_user)  # ✅ Fixed field names
        return Response({'message': 'User blocked successfully!'})

    def delete(self, request, user_id):
        blocked_user = User.objects.get(id=user_id)
        BlockedUser.objects.filter(blocker=request.user, blocked=blocked_user).delete()  # ✅ Fixed field names
        return Response({'message': 'User unblocked successfully!'})


class OnlineUsersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        online_users = Profile.objects.filter(is_online=True).exclude(user=request.user)
        data = [{'id': user.user.id, 'username': user.user.username} for user in online_users]
        return Response(data, status=200)

class SendFriendRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, user_id):
        to_user = User.objects.get(id=user_id)
        FriendRequest.objects.create(from_user=request.user, to_user=to_user)
        return Response({'message': 'Friend request sent.'}, status=201)

class AcceptFriendRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, request_id):
        friend_request = FriendRequest.objects.get(id=request_id)
        if friend_request.to_user == request.user:
            friend_request.is_accepted = True
            friend_request.save()
            profile_from = Profile.objects.get(user=friend_request.from_user)
            profile_to = Profile.objects.get(user=request.user)
            profile_from.friends.add(profile_to)
            profile_to.friends.add(profile_from)
            return Response({'message': 'Friend request accepted.'}, status=200)
        return Response({'error': 'You are not authorized to accept this request.'}, status=403)


class FriendRequestsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        friend_requests = FriendRequest.objects.filter(to_user=request.user, is_accepted=False)
        data = [
            {
                'id': request.id,
                'from_user': request.from_user.username,
                'from_user_id': request.from_user.id
            }
            for request in friend_requests
        ]
        return Response(data, status=200)

class FriendsListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = request.user.profile
        friends = profile.friends.all()
        data = [{'id': friend.user.id, 'username': friend.user.username} for friend in friends]
        return Response(data, status=200)
