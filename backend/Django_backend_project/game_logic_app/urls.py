from django.urls import path
from . import views

urlpatterns = [
    path('', views.game_ui, name='game_ui'),
    path('tournament/create/', views.create_tournament_view, name='create_tournament'),
    path('tournament/<int:tournament_id>/', views.tournament_detail_view, name='tournament_detail'),
    path('tournament/<int:tournament_id>/register/', views.register_player_view, name='register_player'),
    path('tournament/<int:tournament_id>/start/', views.start_tournament_view, name='start_tournament'),
]
