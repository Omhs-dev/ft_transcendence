from django.urls import path
from . import views

urlpatterns = [
    path('', views.game_ui, name='game_ui'),
	path('api/tournaments/create/', views.TournamentCreateView.as_view(), name='tournament-create'),
	path('api/tournaments/update/', views.TournamentUpdateView.as_view(), name='tournament-update'),
	]
