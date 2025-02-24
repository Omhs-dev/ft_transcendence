from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User
    

#Player model
# win rate function is made to calculate the win rate of the player
#player has a one to one relationship with the user model, profile of the player is linked to the user, 
#if a user is deleted, the player will be deleted
class Player(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='player')
    total_wins = models.PositiveIntegerField(default=0)
    total_losses = models.PositiveIntegerField(default=0)
    total_points_scored = models.PositiveIntegerField(default=0)  # ✅ NEW
    total_games_played = models.PositiveIntegerField(default=0)  # ✅ NEW

    @property
    def win_rate(self):
        return round(self.total_wins / self.total_games_played * 100, 2) if self.total_games_played > 0 else 0
        # total_matches = self.total_wins + self.total_losses
        # return round(self.total_wins / total_matches * 100, 2) if total_matches > 0 else 0

    def __str__(self):
        return self.user.username


#Game model
#A game can have many players, and a player can be in many games (many to many relationship)
#A tournament can have many games, and a game can be in many tournaments (many to many relationship)
class Game(models.Model):
    STATE_CHOICES = [
        ('not_started', 'Not Started'),
        ('in_progress', 'In Progress'),
        ('paused', 'Paused'),
        ('finished', 'Finished'),
        ('cancelled', 'Cancelled'),
    ]

    id = models.AutoField(primary_key=True)
    player1 = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='games_as_player1', null=True, blank=True)
    player2 = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='games_as_player2', null=True, blank=True)
    ball_x = models.FloatField(default=400)  # Assuming canvas width=800
    ball_y = models.FloatField(default=200)  # Assuming canvas height=400
    ball_dx = models.FloatField(default=4)
    ball_dy = models.FloatField(default=4)
    player1_score = models.PositiveIntegerField(default=0)  # ✅ NEW
    player2_score = models.PositiveIntegerField(default=0)  # ✅ NEW
    player1_y = models.FloatField(default=150)
    player2_y = models.FloatField(default=150)
    start_time = models.DateTimeField(default=timezone.now)
    end_time = models.DateTimeField(null=True, blank=True, default=timezone.now)  # Allow null for ongoing games
    state = models.CharField(max_length=20, choices=STATE_CHOICES, default='not_started')


    def reset(self):
        self.state = 'not_started'
        self.start_time = timezone.now()
        self.end_time = None
        self.player1.score = 0
        self.player2.score = 0
        self.save()
    
    def reset_ball(self):
        self.ball_x = 400
        self.ball_y = 200
        self.ball_dx = 4 * (1 if random.random() > 0.5 else -1)
        self.ball_dy = 4 * (1 if random.random() > 0.5 else -1)
        self.save()


    def __str__(self):
        return f"Game {self.id} - {self.state}"

#Match history model
#game is a foreign key to the game model, on delete is cascade, if a game is deleted, all the matches related to that game will be deleted
#player1 and player2 are foreign keys to the player model, on delete is cascade, if a player is deleted, all the matches related to that player will be deleted
#winner and loser are foreign keys to the player model, on delete is cascade, if a player is deleted, all the matches related to that player will be deleted
#result is a string that contains the result of the match, eg. "11-9, 11-5, 11-7"

#player-->game

class MatchHistory(models.Model):
    id = models.AutoField(primary_key=True)
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name='matches')
    player1 = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='matches_as_player1')
    player2 = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='matches_as_player2')
    winner = models.ForeignKey(Player, on_delete=models.SET_NULL, related_name='matches_won', null=True, blank=True)
    loser = models.ForeignKey(Player, on_delete=models.SET_NULL, related_name='matches_lost', null=True, blank=True)
    result = models.CharField(max_length=50, blank=True)  # Adjusted for more detailed results

    def __str__(self):
        return f"{self.player1.user.username} vs {self.player2.user.username} - {self.winner.user.username if self.winner else 'No winner yet'}"