from django.urls import path
from . import views

urlpatterns = [
    path('', views.game_ui, name='game_ui'),
    # path('game/<str:room_id>/', views.game, name='game'),
    # path('game/create/', views.create_game, name='create_game'),
    # path('game/join/', views.join_game, name='join_game'),
    # path('game/leave/', views.leave_game, name='leave_game'),
    # path('game/start/', views.start_game, name='start_game'),
    # path('game/end/', views.end_game, name='end_game'),
    # path('game/move/', views.move, name='move'),
    # path('game/players/', views.get_players, name='get_players'),
    # path('game/players/<str:room_id>/', views.get_players, name='get_players'),
    
]