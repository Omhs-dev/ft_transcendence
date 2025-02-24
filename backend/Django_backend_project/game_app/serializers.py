from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Player, MatchHistory, Game
from django.utils import timezone
from django.shortcuts import get_object_or_404

# -------------------------------- MATCH HISTORY QUERY SERIALIZERS --------------------------------
class MatchHistorySerializer(serializers.ModelSerializer):
    player1_username = serializers.CharField(source='player1.user.username', read_only=True)
    player2_username = serializers.CharField(source='player2.user.username', read_only=True)
    winner_username = serializers.CharField(source='winner.user.username', read_only=True, default=None)
    loser_username = serializers.CharField(source='loser.user.username', read_only=True, default=None)
    game_id = serializers.IntegerField(source='game.id', read_only=True)

    class Meta:
        model = MatchHistory
        fields = ['id', 'game_id', 'player1_username', 'player2_username', 'winner_username', 'loser_username', 'result']

# -------------------------------- MATCH HISTORY CREATING SERIALIZERS --------------------------------
class MatchHistoryCreateSerializer(serializers.ModelSerializer):
    game_id = serializers.IntegerField()
    player1_id = serializers.IntegerField()
    player2_id = serializers.IntegerField()
    winner_id = serializers.IntegerField()
    loser_id = serializers.IntegerField()
    result = serializers.CharField()

    class Meta:
        model = MatchHistory
        fields = ['game_id', 'player1_id', 'player2_id', 'winner_id', 'loser_id', 'result']

    def validate(self, data):
        """Ensure all players and game exist."""
        data['game'] = get_object_or_404(Game, id=data['game_id'])
        data['player1'] = get_object_or_404(Player, id=data['player1_id'])
        data['player2'] = get_object_or_404(Player, id=data['player2_id'])
        data['winner'] = get_object_or_404(Player, id=data['winner_id'])
        data['loser'] = get_object_or_404(Player, id=data['loser_id'])

        if data['winner'] not in [data['player1'], data['player2']]:
            raise serializers.ValidationError("Winner must be one of the players in the game.")

        if data['loser'] not in [data['player1'], data['player2']]:
            raise serializers.ValidationError("Loser must be one of the players in the game.")

        return data

    def create(self, validated_data):
        """Create the match history record."""
        return MatchHistory.objects.create(
            game=validated_data['game'],
            player1=validated_data['player1'],
            player2=validated_data['player2'],
            winner=validated_data['winner'],
            loser=validated_data['loser'],
            result=validated_data['result']
        )
