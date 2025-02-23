from django.shortcuts import render, redirect, get_object_or_404
# from django.contrib.auth.decorators import login_required
from .models import Tournament
from django.http import JsonResponse
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import MatchHistory, Game
from .serializers import MatchHistorySerializer
import logging

loggers = logging.getLogger('game_logic_app')


# @login_required
def game_ui(request):
    return render(request, 'game_logic_app/game_ui.htm')


class MatchHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Retrieve match history for the authenticated user or a specific game"""
        game_id = request.query_params.get('game_id')  # Get game_id from query parameters
        player = request.user.player  # Assuming every user has a related Player object

        if game_id:
            # Retrieve match history for a specific game
            game = get_object_or_404(Game, id=game_id)
            matches = MatchHistory.objects.filter(game=game)
        else:
            # Retrieve all match history for the authenticated user
            matches = MatchHistory.objects.filter(player1=player) | MatchHistory.objects.filter(player2=player)

        serializer = MatchHistorySerializer(matches, many=True)
        return Response(serializer.data, status=200)
