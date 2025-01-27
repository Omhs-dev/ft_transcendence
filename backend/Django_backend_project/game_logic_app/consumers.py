import json
from channels.generic.websocket import AsyncWebsocketConsumer
from .models import Game, Player
from .utils import finalize_game
from django.utils import timezone
from asgiref.sync import sync_to_async

import logging

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

    async def disconnect(self, close_code):
        # Leave game group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )


    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            action = data.get("action")
            game_id = data.get("game_id")
            loggers.info(f"\n\n Received action in receive function: {action} for game: {game_id}")
            if not game_id:
                raise ValueError("Missing game_id")

            if  action== "start_game" and game_id != "":
                await self.start_game(game_id)


            elif action == "update_score":
                loggers.info(f"\n\nReceived update_score action for game: {game_id} ")
                player1_score = data.get('player1_score')
                player2_score = data.get('player2_score')
                game_id = data.get('game_id')
                # score = data.get("score")
                # await self.update_score(game_id, data)
                await self.update_score(game_id, player1_score, player2_score)



            elif action == "move_paddle":
                player = data.get("player")
                position = data.get("position")
                loggers.info(f"Received move_paddle action for player: {player} at position: {position}")
                await self.update_paddle(game_id, player, position)
                loggers.info(f"Updated paddle for player: {player} at position: {position}")    
            elif action == "update_ball":
                ball = data.get("ball")
                await self.update_ball(game_id, ball)
                # loggers.info(f"Updated ball for game: {game_id} at position: {ball['x']}, {ball['y']} with speed: {ball['dx']}, {ball['dy']}")
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
                loggers.info(f"\n\n  Game Going on: {game_id}")
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
        return Game.objects.get(id=game_id)

    @sync_to_async
    def save_game(self, game):
        game.save()
        loggers.info(f"This is saved game: {game}")


    # async def start_game(self, game_id):
    #     loggers.info(f"Starting game inside ... {game_id}")
    #     game.id = game_id
    #     game.state = 'in_progress'
    #     await self.save_game(game)
    #     game = await self.get_game(game_id)
    #     loggers.info(f" \n\n state of game:  {game.state}") 
    #     await self.channel_layer.group_send(
    #         self.room_group_name,
    #         {"type": "game_update", "data": {"type": "game_started", "game_id": game_id}},
    #     )



        # @sync_to_async
        # def update_score(self, game_id, player1_score, player2_score):
        #     try:
        #         # Retrieve the game instance from the database
        #         game = Game.objects.get(id=game_id)
                
        #         # Update the scores
        #         game.player1_score = player1_score
        #         game.player2_score = player2_score
                
        #         # Save the updated instance back to the database
        #         game.save()
        #         loggers.info(f"Updated score for game {game_id}: Player1={player1_score}, Player2={player2_score}")
        #     except Game.DoesNotExist:
        #         loggers.error(f"Game with ID {game_id} does not exist")




    async def start_game(self, game_id):
        loggers.info(f"Starting game inside ... {game_id}")

        # Using get_or_create to fetch or create the game asynchronously
        game, created = await sync_to_async(Game.objects.get_or_create)(
            id=game_id, state="in_progress"
        )

        if not created:
            loggers.info(f"Game {game_id} already exists, updating state to 'in_progress'")
            game.state = 'in_progress'
            await self.save_game(game)
        else:
            loggers.info(f"Game {game_id} created with state 'in_progress'")

        # Fetch the game after potential update to ensure consistency
        game = await self.get_game(game_id)
        loggers.info(f"Game state after creation/updation: {game.state}")
        # Notify WebSocket group about the game start
        await self.channel_layer.group_send(
            self.room_group_name,
            {"type": "game_update", "data": {"type": "game_started", "game_id": game_id}},
        )


    async def pause_game(self, game_id):
        game = await self.get_game(game_id)
        game.state = 'paused'
        await self.save_game(game)
        await self.channel_layer.group_send(
            self.room_group_name,
            {"type": "game_update", "data": {"type": "game_paused", "game_id": game_id}},
        )

    async def resume_game(self, game_id):
        game = await self.get_game(game_id)
        game.state = 'in_progress'
        await self.save_game(game)
        await self.channel_layer.group_send(
            self.room_group_name,
            {"type": "game_update", "data": {"type": "game_resumed", "game_id": game_id}},
        )

    async def restart_game(self, game_id):
        game = await self.get_game(game_id)
        game.reset()  # Assume `reset` is a model method to reset game state
        await self.save_game(game)
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

            loggers.info(f"Updated score for game {game_id}: Player1={player1_score}, Player2={player2_score}")

        except Game.DoesNotExist:
            loggers.error(f"Game with ID {game_id} does not exist.")
        except Exception as e:
            loggers.error(f"Error updating game {game_id} scores: {e}")

    # def update_score(self, game_id, player1_score, player2_score):
    #     loggers.info(f"\n\nUpdating score for game:\n {game_id}\n with player1: {player1_score}\n and player2: {player2_score}")
    #     try:
    #         game = Game.objects.get(id=game_id)
    #         game.player1_score.score = player1_score
    #         game.player2_score.score = player2_score
    #         game.save()
    #         loggers.info(f"Updated score for game {game_id}: Player1={game.player1_score.score}, Player2={game.player2_score.score}")
    #     except Game.DoesNotExist:
    #         loggers.error(f"Game with ID {game_id} does not exist")


    # async def update_score(self, game_id, data):
    #     game = await self.get_game(game_id) 
    #     player1_score = data.get("player1_score")
    #     player2_score = data.get("player2_score")
    #     loggers.info(f"\n\n Updated score for game: {game_id} with player1: {player1_score} and player2: {player2_score}")
    #     game.player1_score =  player1_score
    #     game.player2_score =  player2_score
    #     await self.save_game(game)


    async def end_game(self, game_id, winner_id, loser_id, result):
        game = await self.get_game(game_id)
        winner = await sync_to_async(Player.objects.get)(id=winner_id)
        loser = await sync_to_async(Player.objects.get)(id=loser_id)
        await sync_to_async(finalize_game)(game, winner, loser, result)
        await self.channel_layer.group_send(
            self.room_group_name,
            {"type": "game_update", "data": {"type": "game_ended", "winner": winner_id, "game_id": game_id}},
        )
