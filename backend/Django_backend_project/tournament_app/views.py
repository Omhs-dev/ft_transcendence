from django.shortcuts import render, redirect, get_object_or_404
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .serializers import TournamentCreateSerializer, TournamentUpdateSerializer
import logging

loggers = logging.getLogger('__name__')


# @login_required
def game_ui(request):
    return render(request, 'tournament_app/tournament_ui.htm')


from rest_framework import generics
from rest_framework import status
from django.db import transaction

# --------------------------------- TOURNAMENT CREATING VIEWS ---------------------------------
class TournamentCreateView(generics.CreateAPIView):
    serializer_class = TournamentCreateSerializer

    def create(self, request, *args, **kwargs):
        with transaction.atomic():  # Ensure all or nothing
            serializer = self.get_serializer(data=request.data)
            if serializer.is_valid():
                tournament = serializer.save()
                return Response(
                    {
                        "id": tournament.id,
                        "name": tournament.name,
                        "description": tournament.description,
                        "status": tournament.status,
                        "start_time": tournament.start_time,
                        "max_players": tournament.max_players,
                        "players": [
                            {"id": player.user.id, "username": player.user.username, "alias": player.nickname}
                            for player in tournament.players.all()
                        ],
                    },
                    status=status.HTTP_201_CREATED,
                )
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# --------------------------------- TOURNAMENT UPDATING VIEWS ---------------------------------
class TournamentUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = TournamentUpdateSerializer(data=request.data)
        if serializer.is_valid():
            tournament = serializer.update_tournament()
            return Response({
                "message": "Tournament updated successfully.",
                "tournament_id": tournament.id,
                "status": tournament.status,
                "end_time": tournament.end_time,
                "games_added": list(tournament.games.values_list('id', flat=True))
            }, status=200)
        return Response(serializer.errors, status=400)
