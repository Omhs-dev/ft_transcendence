from django.urls import path
from . import views

urlpatterns = [
    path('home/', views.index, name='index'),
    path('api/chat/<int:receiver_id>/', views.ChatHistoryView.as_view(), name='chat_history'),
    path('api/pong-invite/<int:invitee_id>/', views.PongInviteView.as_view(), name='pong_invite'),
	path('api/online-users/', views.OnlineUsersView.as_view(), name='online_users'),
	path('api/block-user/<int:user_id>/', views.BlockUserView.as_view(), name='block_user'),
    path('api/send-friend-request/<int:user_id>/', views.SendFriendRequestView.as_view(), name='send_friend_request'),
    path('api/accept-friend-request/<int:request_id>/', views.AcceptFriendRequestView.as_view(), name='accept_friend_request'),
    path('api/friend-requests/', views.FriendRequestsView.as_view(), name='friend_requests'),
    path('api/friends/', views.FriendsListView.as_view(), name='friends'),
]
