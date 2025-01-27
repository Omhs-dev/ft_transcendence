from django.contrib import admin
from .models import Player, Tournament, Game, MatchHistory

class GameAdmin(admin.ModelAdmin):
    list_display = ('id', 'get_player1', 'get_player1_score', 'get_player2', 'get_player2_score', 'get_winner', 'state')

    def get_player1(self, obj):
        return obj.player1_score.user.username if obj.player1_score else "N/A"
    get_player1.short_description = 'Player 1'

    def get_player2(self, obj):
        return obj.player2_score.user.username if obj.player2_score else "N/A"
    get_player2.short_description = 'Player 2'

    def get_player1_score(self, obj):
        """Display Player 1's score."""
        return obj.player1_score.score if obj.player1_score else "N/A"
    get_player1_score.short_description = 'Player 1 Score'

    def get_player2_score(self, obj):
        """Display Player 2's score."""
        return obj.player2_score.score if obj.player2_score else "N/A"
    get_player2_score.short_description = 'Player 2 Score'

    def get_winner(self, obj):
        """Determine the winner based on score if game is finished."""
        if obj.state == 'finished':
            if obj.player1_score and obj.player2_score:
                return obj.player1_score.user.username if obj.player1_score.score > obj.player2_score.score else obj.player2_score.user.username
        return "Ongoing"
    get_winner.short_description = 'Winner'


class MatchHistoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'game_id', 'player1', 'player2', 'winner', 'loser', 'result')  # Fields to display
    search_fields = ('player1__user__username', 'player2__user__username', 'winner__user__username', 'loser__user__username')  # Searchable fields
    list_filter = ('winner', 'loser')  # Add filtering options
    ordering = ('-id',)  # Order by latest matches

    def game_id(self, obj):
        return obj.game.id  # Display the game ID instead of the game object

    game_id.admin_order_field = 'game'  # Enable sorting by game ID
    game_id.short_description = 'Game ID'  # Label in the admin panel


class PlayerAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'total_wins', 'total_losses', 'win_rate_display', 'score', 'get_games_played')  
    search_fields = ('user__username',)  
    list_filter = ('total_wins', 'total_losses', 'score')  
    ordering = ('-score', '-total_wins')  
    readonly_fields = ('win_rate_display',)  

    def win_rate_display(self, obj):
        return f"{obj.win_rate}%"  

    win_rate_display.short_description = 'Win Rate'  

    def get_games_played(self, obj):
        """Show the IDs of all games the player has participated in."""
        games = Game.objects.filter(player1_score=obj) | Game.objects.filter(player2_score=obj)
        return ", ".join(str(game.id) for game in games) if games else "No Games"
    
    get_games_played.short_description = 'Games Played'
    

# Register your models here.
admin.site.register(Player, PlayerAdmin)
admin.site.register(Tournament)
admin.site.register(Game , GameAdmin) 
admin.site.register(MatchHistory, MatchHistoryAdmin)