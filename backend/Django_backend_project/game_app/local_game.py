import json
from channels.generic.websocket import AsyncWebsocketConsumer
from .models import Game, Player, MatchHistory
from django.contrib.auth.models import User
# from .local_game_utils import MatchHistory
from django.utils import timezone
from asgiref.sync import sync_to_async, async_to_sync
from channels.db import database_sync_to_async
import logging
import asyncio
import random
import string

loggers = logging.getLogger('game_app')

class LocalGameConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = "game_room"
        self.room_group_name = f"game_{self.room_name}"

        # Join game group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()
        loggers.info(f"WebSocket connected: {self.channel_name}")

    async def disconnect(self, close_code):
        # Leave game group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        loggers.info(f"WebSocket disconnected: {self.channel_name}")

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            action = data.get("action")
            # loggers.info(f"\n\n Received data in receive function: {data}")

            if action == 'start_game':
                user2_id = data.get("user2_id")
                user1_id = data.get("user1_id")
                if user1_id == '':
                    user1_id = 1
                if not user2_id:
                    raise ValueError("Missing user2_id")
                game_id = await self.generate_unique_game_id()
                await self.start_game(game_id, user2_id, user1_id)

            elif action == "update_score":
                game_id = data.get('game_id')
                player1_score = data.get('player1_score')
                player2_score = data.get('player2_score')
                await self.update_score(game_id, player1_score, player2_score)

            elif action == "move_paddle":
                game_id = data.get('game_id')
                player = data.get("player")
                position = data.get("position")
                await self.update_paddle(game_id, player, position)
           
            elif action == "update_ball":
                game_id = data.get('game_id')
                ball = data.get("ball")
                await self.update_ball(game_id, ball)
           
            elif action == "pause_game":
                game_id = data.get('game_id')
                await self.pause_game(game_id)
            
            elif action == "resume_game":
                game_id = data.get('game_id')
                await self.resume_game(game_id)
            
            elif action == "restart_game":
                game_id = data.get('game_id')
                await self.restart_game(game_id)
            
            elif action == "end_game":
                recData = {
                    'game_id' : data.get('game_id'),
                    'winner_id' : data.get("winner_id"),
                    'winner_name' : data.get("winner_name"),
                    'loser_id' : data.get("loser_id"),
                    'loser_name' : data.get("loser_name"),
                    'result' : data.get("result"),
                    'player1_score' : data.get("player1_score"),
                    'player2_score' : data.get("player2_score"),

                }
                loggers.info(f"\n the data in end_game: {data}")
                loggers.info(f"\n the recData in end_game: {recData}")
                await self.end_game(recData)
            
            else:
                raise ValueError("Invalid action")
                
            # Broadcast updates
            await self.channel_layer.group_send(
                self.room_group_name,
                {"type": "game_update", "data": data},
            )
        except Exception as e:                                            
            await self.send(json.dumps({"error": str(e)}))

    async def game_update(self, event):
        data = event["data"]
        await self.send(text_data=json.dumps(data))

    @sync_to_async
    def get_game(self, game_id):
        try:
            return Game.objects.get(id=game_id)
        except Game.DoesNotExist:
            loggers.error(f"Game {game_id} not found.")
        return None

    @sync_to_async
    def save_game(self, game):
        game.save()
        # loggers.info(f"This is saved game: {game}")

    @sync_to_async
    def generate_unique_game_id(self):
        # Generate a random 6-digit number
        game_id = ''.join(random.choices(string.digits, k=6))
        
        # Check if the game_id already exists in the Game model
        if Game.objects.filter(id=game_id).exists():
            # If it exists, recursively generate a new ID
            return self.generate_unique_game_id()
        
        # Return the unique game_id
        return game_id     

    async def start_game(self, game_id, user2_id, user1_id):
    # async def start_game(self, game_id):
        # loggers.info(f"Starting game inside ... gID: {game_id} and the user2ID:{user2_id} ")
        user1 = await sync_to_async(User.objects.filter(id=user1_id).first)()
        user2 = await sync_to_async(User.objects.filter(id=user2_id).first)()
        # loggers.info(f"User 1: {user1}, User 2: {user2}")
    
        player1 = await sync_to_async(Player.objects.get)(user=user1)
        player2 = await sync_to_async(Player.objects.get)(user=user2)


        game = await sync_to_async(Game.objects.filter(id=game_id).first)()
        if not game:
            game = await sync_to_async(Game.objects.create)(
                id=game_id, player1=player1, player2=player2, state="in_progress"
            )
            loggers.info(f"Game {game_id} created with state 'in_progress'")
        else:
            game.state = "in_progress"
            await sync_to_async(game.save)()
            loggers.info(f"Game {game_id} already existed, updated state to 'in_progress'")

        # Fetch the game after potential update to ensure consistency
        game = await self.get_game(game_id)
        loggers.info(f"Game state after creation/update: {game.state}")

        # Notify WebSocket group about the game start
        await self.channel_layer.group_send(
            self.room_group_name,
            {"type": "game_update", "data": {
                "type": "game_started",
                "game_id": game_id,
                "user1_id": user1.id,
                "user2_id": user2.id,
                "player1":  user1.username,
                "player2": user2.username,
                }},
        )

    async def pause_game(self, game_id):
        game = await self.get_game(game_id)
        game.state = 'paused'
        await self.save_game(game)
        loggers.info(f"Game state after pressing pause: {game.state}")
        await self.channel_layer.group_send(
            self.room_group_name,
            {"type": "game_update", "data": {"type": "game_paused", "game_id": game_id}},
        )

    async def resume_game(self, game_id):
        game = await self.get_game(game_id)
        game.state = 'in_progress'
        await self.save_game(game)
        loggers.info(f"Game state after pressing resume: {game.state}")
        await self.channel_layer.group_send(
            self.room_group_name,
            {"type": "game_update", "data": {"type": "game_resumed", "game_id": game_id}},
        )

    async def restart_game(self, game_id):
        loggers.debug(f"\n\n\nRestarting game {game_id}")
        game = await self.get_game(game_id)
        # await game.reset()  # Assume `reset` is a model method to reset game state
        await sync_to_async(game.reset)()
        await self.save_game(game)
        loggers.info(f"Game state after pressing restart: {game.state}")
        await self.channel_layer.group_send(
            self.room_group_name,
            {"type": "game_update", "data": {"type": "game_restarted", "game_id": game_id}},
        )

    async def update_paddle(self, game_id, player, position):
        game = await self.get_game(game_id)
        if player == "player1":
            game.player1_y = position
        elif player == "player2":
            game.player2_y = position
        await self.save_game(game)

    async def update_ball(self, game_id, ball_data):
        game = await self.get_game(game_id)
        game.ball_x = ball_data['x']
        game.ball_y = ball_data['y']
        game.ball_dx = ball_data['dx']
        game.ball_dy = ball_data['dy']
        await self.save_game(game)
        
    # @sync_to_async
    @database_sync_to_async
    def finalize_game(self, game, recData):
        winner, loser = None, None
        try:
            if game.state != 'finished':
                game.state = 'finished'
                game.end_time = timezone.now()

                if game.player1_score > game.player2_score:
                    winner, loser = game.player1, game.player2
                elif game.player2_score > game.player1_score:
                    winner, loser = game.player2, game.player1

                if winner and loser:
                    winner.total_wins += 1
                    loser.total_losses += 1
                    winner.save(update_fields=['total_wins'])
                    loser.save(update_fields=['total_losses'])

                game.save()
                MatchHistory.objects.create(
                    game=game,
                    player1=game.player1,
                    player2=game.player2,
                    winner=winner,
                    loser=loser,
                    result=f"{game.player1_score} - {game.player2_score}"
                )
                loggers.info(f"Game {game.id} fiiiiinnnnnnalized. Winner: {winner}, Loser: {loser}")

        except Exception as e:
            loggers.error(f"Error finalizing game {game.id}: {str(e)}")

        return winner, loser    # @sync_to_async
    

    async def end_game(self, recData):
        loggers.debug(f"\n\n\nGame {recData['game_id']} ended. Winner: {recData['winner_id']}, Loser: {recData['loser_id']}")
        try:
            game = await database_sync_to_async(Game.objects.get)(id=recData['game_id'])
            
            game.player1_score = recData['player1_score']
            game.player2_score = recData['player2_score']
            await database_sync_to_async(game.save)(update_fields=['player1_score', 'player2_score'])

            game_id = recData['game_id']
            winner_id = recData['winner_id']
            winner_name = recData['winner_name']
            loser_id = recData['loser_id']
            loser_name = recData['loser_name']
            result = recData['result']

            loggers.debug(f"\n\nGame111 {game_id} ended. Winner: {winner_id}, Loser: {loser_id}")

            winner, loser = await self.finalize_game(game, recData)  # Await the coroutine

            if winner and loser:
                loggers.info(f"Game222 {game_id} ended. Winner: {winner}, Loser: {loser}")
                await self.channel_layer.group_send(  # Await the async call
                    self.room_group_name,
                    {
                        "type": "game_update",
                        "data": {
                            "type": "game_ended",
                            "winner": winner_id,
                            "winner_name": winner_name,
                            "loser": loser_id,
                            "loser_name": loser_name,
                            "result": result,
                            "game_id": game_id,
                        },
                    },
                )
            else:
                loggers.error(f"Game {game_id} has no winner or loser. Skipping game update.")
        except Game.DoesNotExist:
            loggers.error(f"Game with ID {recData['game_id']} does not exist.")
        except Exception as e:
            loggers.error(f"Error ending game {recData['game_id']}: {str(e)}")

    # @sync_to_async
    @database_sync_to_async
    def update_score(self, game_id, player1_score, player2_score):
        try:
            game = Game.objects.get(id=game_id)

            # Store scores in the Game model
            game.player1_score = player1_score
            game.player2_score = player2_score
            game.save(update_fields=['player1_score', 'player2_score'])

            loggers.info(f"Updated score for game {game_id}: Player1={player1_score}, Player2={player2_score}")

        except Game.DoesNotExist:
            loggers.error(f"Game with ID {game_id} does not exist.")
        except Exception as e:
            loggers.error(f"Error updating game {game_id} scores: {e}")

