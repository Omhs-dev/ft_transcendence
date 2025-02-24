from django.db import models
from django.utils import timezone
from game_app.models import Player
from django.contrib.auth.models import User

# Create your models here.
#Tournament model
#a tournament can have many players, and a player can be in many tournaments (many to many relationship)
#status can be pending, ongoing or finished, default is pending
class Tournament(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('ongoing', 'Ongoing'),
        ('finished', 'Finished'),
    ]

    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=150, unique=True)
    description = models.TextField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    start_time = models.DateTimeField(default=timezone.now)
    end_time = models.DateTimeField(null=True, blank=True)  # Allow custom end times
    max_players = models.PositiveIntegerField(default=8)
    players = models.ManyToManyField(Player, related_name='tournaments')
    games = models.ManyToManyField('game_app.Game' , related_name='tournaments', default=None, blank=True)
    def __str__(self):
        return f"{self.name} - {self.status}"

#TournamentPlayer model to store the players with their aliases in a tournament
class TournamentPlayer(models.Model):
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE, related_name="tournament_players")
    player = models.ForeignKey(Player, on_delete=models.CASCADE, related_name="tournaments_played")
    alias = models.CharField(max_length=150, blank=True)  # Store alias per tournament

    class Meta:
        unique_together = ('tournament', 'player')  # Prevent duplicates

    def __str__(self):
        return f"{self.player.user.username} in {self.tournament.name} as {self.alias or self.player.user.username}"
