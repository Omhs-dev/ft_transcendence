import json
from channels.generic.websocket import AsyncWebsocketConsumer
from .models import Game, Player
from .utils import *
from django.utils import timezone
from asgiref.sync import sync_to_async, async_to_sync
import logging
import asyncio


loggers = logging.getLogger('game_logic_app')

class GameConsumer(AsyncWebsocketConsumer):
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
            game_id = data.get("game_id")
            # loggers.info(f"\n\n Received action in receive function: {action} for game: {game_id}")

            if not game_id:
                raise ValueError("Missing game_id")

            if  action== "start_game":
                await self.start_game(game_id)

            elif action == "update_score":
                # loggers.info(f"\n\nReceived update_score action for game: {game_id} ")
                player1_score = data.get('player1_score')
                player2_score = data.get('player2_score')
                await self.update_score(game_id, player1_score, player2_score)

            elif action == "move_paddle":
                player = data.get("player")
                position = data.get("position")
                await self.update_paddle(game_id, player, position)
           
            elif action == "update_ball":
                ball = data.get("ball")
                await self.update_ball(game_id, ball)
           
            elif action == "pause_game":
                await self.pause_game(game_id)
            
            elif action == "resume_game":
                await self.resume_game(game_id)
            
            elif action == "restart_game":
                await self.restart_game(game_id)
            
            elif action == "end_game":
                winner_id = data.get("winner_id")
                loser_id = data.get("loser_id")
                result = data.get("result")
                await self.end_game(game_id, winner_id, loser_id, result)
            
            else:
                # loggers.info(f"\n\n  Game Going on: {game_id}")
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
        loggers.info(f"This is saved game: {game}")


    async def start_game(self, game_id):
        loggers.info(f"Starting game inside ... {game_id}")

        # Using get_or_create to fetch or create the game asynchronously
        game, created = await sync_to_async(Game.objects.get_or_create)(
            # id=game_id, state="in_progress"
            id=game_id, defaults={"state": "in_progress"}
        )

        if not created:
            loggers.info(f"Game {game_id} already exists, updating state to 'in_progress'")
            game.state = 'in_progress'
            await self.save_game(game)
        else:
            loggers.info(f"Game {game_id} created with state 'in_progress'")

        # Fetch the game after potential update to ensure consistency
        game = await self.get_game(game_id)
        loggers.info(f"Game state after creation/update: {game.state}")
        # Notify WebSocket group about the game start
        await self.channel_layer.group_send(
            self.room_group_name,
            {"type": "game_update", "data": {"type": "game_started", "game_id": game_id}},
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
    
    
    async def end_game(self, game_id, winner_id, loser_id, result):
        game = await self.get_game(game_id)
        winner = await sync_to_async(Player.objects.get)(id=winner_id)
        loser = await sync_to_async(Player.objects.get)(id=loser_id)
        await finalize_game_sync(game, winner, loser, result)
        await self.channel_layer.group_send(
            self.room_group_name,
            {"type": "game_update", "data": {"type": "game_ended", "winner": winner_id, "game_id": game_id}},
        )


    @sync_to_async
    def update_score(self, game_id, player1_score, player2_score):
        loggers.info(f"\n\nUpdating score for game: {game_id}\nPlayer1 Score: {player1_score}\nPlayer2 Score: {player2_score}")
        
        try:
            game = Game.objects.get(id=game_id)

            # Update scores if players exist
            if game.player1_score:
                game.player1_score.score = player1_score
                game.player1_score.save(update_fields=['score'])
            else:
                loggers.warning(f"Game {game_id}: Player 1 is not assigned.")

            if game.player2_score:
                game.player2_score.score = player2_score
                game.player2_score.save(update_fields=['score'])
            else:
                loggers.warning(f"Game {game_id}: Player 2 is not assigned.")

            if player1_score >= 3 or player2_score >= 3:
                winner_id = game.player1_score.user.id if player1_score >= 3 else game.player2_score.user.id
                loser_id = game.player2_score.user.id if player1_score >= 3 else game.player1_score.user.id
                result = f"{player1_score}-{player2_score}"
                # Corrected call to end_game
                async_to_sync(self.end_game)(game_id, winner_id, loser_id, result)
            
            loggers.info(f"Updated score for game {game_id}: Player1={player1_score}, Player2={player2_score}")

        except Game.DoesNotExist:
            loggers.error(f"Game with ID {game_id} does not exist.")
        except Exception as e:
            loggers.error(f"Error updating game {game_id} scores: {e}")


