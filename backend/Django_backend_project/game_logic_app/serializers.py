from rest_framework import serializers
from .models import MatchHistory

class MatchHistorySerializer(serializers.ModelSerializer):
    player1_username = serializers.CharField(source='player1.user.username', read_only=True)
    player2_username = serializers.CharField(source='player2.user.username', read_only=True)
    winner_username = serializers.CharField(source='winner.user.username', read_only=True, default=None)
    loser_username = serializers.CharField(source='loser.user.username', read_only=True, default=None)
    game_id = serializers.IntegerField(source='game.id', read_only=True)

    class Meta:
        model = MatchHistory
        fields = ['id', 'game_id', 'player1_username', 'player2_username', 'winner_username', 'loser_username', 'result']
