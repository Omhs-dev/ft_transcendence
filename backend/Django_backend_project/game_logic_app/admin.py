from django.contrib import admin
from .models import Player, Tournament, Game, MatchHistory

class GameAdmin(admin.ModelAdmin):
    list_display = ('id', 'get_player1', 'get_player2', 'get_winner', 'state')

    def get_player1(self, obj):
        return obj.player1_score.user.username if obj.player1_score else "N/A"
    get_player1.short_description = 'Player 1'

    def get_player2(self, obj):
        return obj.player2_score.user.username if obj.player2_score else "N/A"
    get_player2.short_description = 'Player 2'

    def get_winner(self, obj):
        if obj.state == 'finished':
            return obj.player1_score.user.username if obj.player1_score.score > obj.player2_score.score else obj.player2_score.user.username
        return "Ongoing"
    get_winner.short_description = 'Winner'


# Register your models here.
admin.site.register(Player)
admin.site.register(Tournament)
admin.site.register(Game , GameAdmin) 
admin.site.register(MatchHistory)