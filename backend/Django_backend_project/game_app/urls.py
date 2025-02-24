from django.urls import path
from . import views

urlpatterns = [
    path('', views.game_ui, name='game_ui'),
	path('api/match-history/', views.MatchHistoryView.as_view(), name='match-history'),
	path('api/match-history/create/', views.MatchHistoryCreateView.as_view(), name='match-history-create'),
]
