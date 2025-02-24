from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Tournament, TournamentPlayer
from game_app.models import Game, Player, MatchHistory
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.db import transaction


# -------------------------------- TOURNAMENT CREATING SERIALIZERS --------------------------------
class TournamentCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150)
    description = serializers.CharField()
    users = serializers.ListField(
        child=serializers.DictField(child=serializers.CharField()),  # List of {"user_id": int, "alias": str}
        write_only=True
    )

    def validate_users(self, users):
        """Validate users exist and return Player objects."""
        user_ids = [int(user["user_id"]) for user in users]
        existing_users = User.objects.filter(id__in=user_ids)

        if len(existing_users) != len(user_ids):
            raise serializers.ValidationError("Some user IDs do not exist.")

        return users  # Return validated list

    def create(self, validated_data):
        users_data = validated_data.pop("users")
        tournament = Tournament.objects.create(
            name=validated_data["name"],
            description=validated_data["description"],
            status="ongoing",
            start_time=timezone.now(),
            max_players=len(users_data)  # Set dynamically
        )

        # Add players to the tournament
        for user_data in users_data:
            user = User.objects.get(id=int(user_data["user_id"]))
            player, _ = Player.objects.get_or_create(user=user)
            alias = user_data.get("alias", "")

            TournamentPlayer.objects.create(tournament=tournament, player=player, alias=alias)

        return tournament
    

# -------------------------------- TOURNAMENT UPDATING SERIALIZERS --------------------------------
class TournamentUpdateSerializer(serializers.Serializer):
    tournament_id = serializers.IntegerField()
    game_ids = serializers.ListField(child=serializers.IntegerField())

    def validate(self, data):
        """Check if tournament and games exist."""
        tournament = get_object_or_404(Tournament, id=data['tournament_id'])
        games = Game.objects.filter(id__in=data['game_ids'])

        if games.count() != len(data['game_ids']):
            raise serializers.ValidationError("One or more game IDs are invalid.")

        return data

    def update_tournament(self):
        """Update the tournament with games and mark as finished."""
        tournament = Tournament.objects.get(id=self.validated_data['tournament_id'])
        games = Game.objects.filter(id__in=self.validated_data['game_ids'])

        tournament.games.add(*games)
        tournament.status = 'finished'
        tournament.end_time = timezone.now()
        tournament.save()

        return tournament

