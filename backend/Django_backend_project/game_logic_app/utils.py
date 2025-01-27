from .models import Tournament, Player, Game
from django.utils import timezone
import itertools
import random

def create_tournament(name, description, max_players=8):
    tournament = Tournament.objects.create(
        name=name,
        description=description,
        status='pending',
        max_players=max_players,
        start_time=timezone.now()
    )
    return tournament

def register_player_to_tournament(tournament, player):
    if tournament.players.count() < tournament.max_players:
        tournament.players.add(player)
        return True
    return False

def organize_tournament(tournament):
    players = list(tournament.players.all())
    if len(players) < 2:
        raise ValueError("Not enough players to start a tournament.")

    # Example: Round-robin pairing
    matches = list(itertools.combinations(players, 2))
    random.shuffle(matches)  # Shuffle matches to randomize order

    for match in matches:
        create_game(match[0], match[1], tournament=tournament)

    tournament.status = 'ongoing'
    tournament.save()

def create_game(player1, player2, tournament):
    game = Game.objects.create(
        state='in_progress',
        start_time=timezone.now(),
        tournament=tournament
    )
    game.players.set([player1, player2])
    game.save()
    return game

def update_game_state(game, data):
    # Update game state based on incoming data (paddle positions, ball position)
    # Implement game logic such as collision detection, scoring, etc.
    pass

def finalize_game(game, winner, loser, result):
    # Update game and player stats
    game.state = 'finished'
    game.end_time = timezone.now()
    game.score = result
    game.save()

    winner.total_wins += 1
    winner.save()

    loser.total_losses += 1
    loser.save()

    MatchHistory.objects.create(
        game=game,
        player1=game.players.all()[0],
        player2=game.players.all()[1],
        winner=winner,
        loser=loser,
        result=result
    )

    # Check if tournament needs to be updated
    tournament = game.tournament
    if all(g.state == 'finished' for g in tournament.games.all()):
        tournament.status = 'finished'
        tournament.end_time = timezone.now()
        tournament.save()
