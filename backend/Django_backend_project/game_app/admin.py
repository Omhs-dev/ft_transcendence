from django.contrib import admin
from .models import Player, Game, MatchHistory
from tournament_app.models import Tournament

from django.contrib import admin
from django.db.models import Q

class GameAdmin(admin.ModelAdmin):
    list_display = ('id', 'get_player1', 'player1_score', 'get_player2', 'player2_score', 'get_winner', 'state')
    search_fields = ('player1__user__username', 'player2__user__username')  
    list_filter = ('state',)  
    ordering = ('-id',)  

    def get_player1(self, obj):
        return obj.player1.user.username if obj.player1 else "N/A"
    get_player1.short_description = 'Player 1'

    def get_player2(self, obj):
        return obj.player2.user.username if obj.player2 else "N/A"
    get_player2.short_description = 'Player 2'

    def get_winner(self, obj):
        """Retrieve the winner based on stored scores in Game."""
        if obj.state == 'finished':
            if obj.player1_score > obj.player2_score:
                return obj.player1.user.username if obj.player1 else "N/A"
            elif obj.player2_score > obj.player1_score:
                return obj.player2.user.username if obj.player2 else "N/A"
        return "Ongoing"
    get_winner.short_description = 'Winner'


class MatchHistoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'game_id', 'player1', 'player2', 'winner', 'loser', 'result')  
    search_fields = ('player1__user__username', 'player2__user__username', 'winner__user__username', 'loser__user__username')  
    list_filter = ('winner', 'loser')  
    ordering = ('-id',)  

    def game_id(self, obj):
        return obj.game.id  

    game_id.admin_order_field = 'game'  
    game_id.short_description = 'Game ID'  


class PlayerAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'total_wins', 'total_losses', 'win_rate_display', 'get_games_played')  
    search_fields = ('user__username',)  
    list_filter = ('total_wins', 'total_losses')  
    ordering = ('-total_wins',)  
    readonly_fields = ('win_rate_display',)  

    def win_rate_display(self, obj):
        """Calculate and display win rate."""
        if obj.total_wins + obj.total_losses == 0:
            return "0%"
        return f"{round((obj.total_wins / (obj.total_wins + obj.total_losses)) * 100, 2)}%"
    win_rate_display.short_description = 'Win Rate'  

    def get_games_played(self, obj):
        """Fetch game IDs efficiently using Q objects."""
        games = Game.objects.filter(Q(player1=obj) | Q(player2=obj)).values_list('id', flat=True)
        return ", ".join(map(str, games)) if games else "No Games"
    get_games_played.short_description = 'Games Played'
    

# Register models
admin.site.register(Player, PlayerAdmin)
admin.site.register(Game, GameAdmin) 
admin.site.register(MatchHistory, MatchHistoryAdmin)