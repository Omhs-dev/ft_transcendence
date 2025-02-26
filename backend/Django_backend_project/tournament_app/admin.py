from django.contrib import admin
from .models import Tournament
# from game_app.models import Player, Game, MatchHistory

# Customize Admin Panel Appearance
admin.site.site_header = "Ft_transcendence Management Admin"
admin.site.site_title = "Ft_transcendence Admin"
admin.site.index_title = "Welcome to the Ft_transcendence Admin Panel"

# Inline for managing Tournament Players directly in Tournament Admin
class TournamentPlayerInline(admin.TabularInline):  
    model = Tournament.players.through
    extra = 1
    verbose_name = "Player"
    verbose_name_plural = "Tournament Players"

@admin.register(Tournament)
class TournamentAdmin(admin.ModelAdmin):
    inlines = [TournamentPlayerInline]  # Add inline directly here
    list_display = ('name', 'status', 'start_time', 'end_time', 'max_players', 'players_count', 'games_count')
    list_filter = ('status', 'start_time', 'end_time')
    search_fields = ('name',)
    ordering = ('-start_time',)
    filter_horizontal = ('players', 'games')  # Enables multi-select for players & games

    def players_count(self, obj):
        return obj.players.count()
    players_count.short_description = "Players"

    def games_count(self, obj):
        return obj.games.count()
    games_count.short_description = "Games"

# @admin.register(Player)
# class PlayerAdmin(admin.ModelAdmin):
#     list_display = ('user', 'total_wins', 'total_losses', 'total_games_played', 'win_rate')
#     search_fields = ('user__username',)
#     ordering = ('-total_wins',)

# @admin.register(Game)
# class GameAdmin(admin.ModelAdmin):
#     list_display = ('id', 'state', 'player1', 'player2', 'player1_score', 'player2_score', 'start_time', 'end_time')
#     list_filter = ('state', 'start_time', 'end_time')
#     search_fields = ('player1__user__username', 'player2__user__username')

#     def get_queryset(self, request):
#         return super().get_queryset(request).select_related('player1', 'player2')

# @admin.register(MatchHistory)
# class MatchHistoryAdmin(admin.ModelAdmin):
#     list_display = ('game', 'player1', 'player2', 'winner', 'loser', 'result')
#     list_filter = ('winner', 'loser', 'game')
#     search_fields = ('player1__user__username', 'player2__user__username', 'winner__user__username', 'loser__user__username')
#     ordering = ('-game',)
