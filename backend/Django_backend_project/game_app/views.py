from django.shortcuts import render, redirect, get_object_or_404
# from django.contrib.auth.decorators import login_required
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import MatchHistory, Game
from .serializers import MatchHistorySerializer, MatchHistoryCreateSerializer
import logging
from rest_framework import generics
from rest_framework import status
from django.db import transaction

loggers = logging.getLogger('game_app')


# @login_required
def game_ui(request):
    return render(request, 'game_app/game_ui.htm')



# --------------------------------- MATCH HISTORY QUERY VIEW ---------------------------------
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



# --------------------------------- MATCH HISTORY CREATION VIEW ---------------------------------
class MatchHistoryCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = MatchHistoryCreateSerializer(data=request.data)
        if serializer.is_valid():
            match = serializer.save()
            return Response({
                "message": "Match history recorded successfully.",
                "match_id": match.id,
                "game_id": match.game.id,
                "player1": match.player1.user.username,
                "player2": match.player2.user.username,
                "winner": match.winner.user.username,
                "loser": match.loser.user.username,
                "result": match.result
            }, status=201)
        return Response(serializer.errors, status=400)
