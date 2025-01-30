from .models import Tournament, Player, Game, MatchHistory
from asgiref.sync import sync_to_async
from django.utils import timezone
import itertools
import random
import logging

logger = logging.getLogger(__name__)

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


@sync_to_async
def finalize_game_sync(game):
    winner, loser = None, None

    try:
        if game.state != 'finished':  # Ensure the game is actually being finalized
            game.state = 'finished'
            game.end_time = timezone.now()

            # Determine winner and loser based on scores
            if game.player1_score > game.player2_score:
                winner, loser = game.player1, game.player2
            elif game.player2_score > game.player1_score:
                winner, loser = game.player2, game.player1

            # Update player stats if there is a winner
            if winner and loser:
                winner.total_wins += 1
                loser.total_losses += 1
                winner.save(update_fields=['total_wins'])
                loser.save(update_fields=['total_losses'])

            game.save()
            # Save match history
            MatchHistory.objects.create(
                game=game,
                player1=game.player1,
                player2=game.player2,
                winner=winner,
                loser=loser,
                result=f"{game.player1_score} - {game.player2_score}"
            )

    except Exception as e:
        logger.error(f"Error finalizing game {game.id}: {str(e)}")

    return winner, loser  # Return both winner and loser, or None if something went wrong

