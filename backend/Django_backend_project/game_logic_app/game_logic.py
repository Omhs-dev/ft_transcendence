import json, asyncio, random, string, logging, time
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from channels.db import database_sync_to_async
from .models import Game, Player, MatchHistory
import time
from channels.layers import get_channel_layer
from django.db import transaction

logger = logging.getLogger("game_logic_app")

class GameManager:
    ball_size = 10
    paddle_width = 10
    paddle_height = 100
    canvas_width = 800
    canvas_height = 400
    
    rooms = {}
    channel_layer = get_channel_layer()

    @classmethod
    async def add_player(cls, game_id, players):
        logger.info("Player add")
        if not cls.rooms.get(game_id):
            cls.rooms[game_id] = {
                "players": {players: "paddle1"},
                # "pong": None,
                "winner": None,
                "game_state": None,
                "game_loop_task": None,
                "ready": set(),
            }
        else:
            cls.rooms[game_id]["players"][players] = "paddle2"


    @classmethod
    async def request_start_game(cls, game_id, player_id):
        cls.rooms[game_id]["ready"].add(player_id)
        logger.info("Request start")
        count = len(cls.rooms[game_id]["ready"])
        logger.info(f"# players {count}")
        if len(cls.rooms[game_id]["ready"]) == 2:
        # cls.rooms[game_id]["pong"] = PongGame()
            cls.rooms[game_id]["game_loop_task"] = asyncio.create_task(cls.game_start(game_id)) # The game loop 

    @classmethod
    async def game_start(cls, game_id):
        """Runs the game loop to update ball movement."""
        logger.info(f"Game started with ID: {game_id}")
        
        try:
            logger.info(f"Starting game {game_id}")
            if cls.rooms[game_id]["game_state"] is None:
                cls.initialize_game_state(game_id)
                logger.info(f"Initializing game {game_id}")
            while cls.rooms[game_id]["winner"] is None:
                await asyncio.gather(cls.game_loop(game_id), asyncio.sleep(1/60))  # 20 FPS update rate
        except asyncio.CancelledError:
            logger.info(f"Cancelled process")

    @classmethod
    async def pause_game(cls, game_id):
        cls.rooms[game_id]["game_loop_task"].cancel()
        await asyncio.wait([cls.rooms[game_id]["game_loop_task"]])
        logger.info(f"Pausing game {game_id}")
        await cls.broadcast_game_state(game_id)

    @classmethod
    async def resume_game(cls, game_id):
        cls.rooms[game_id]["game_loop_task"] = asyncio.create_task(cls.game_start(game_id))
        cls.rooms[game_id]["last_timestamp"] = time.time_ns()
        logger.info(f"Resuming game {game_id}")
        await cls.broadcast_game_state(game_id)

    @classmethod
    async def restart_game(cls, game_id):
        cls.rooms[game_id]["game_state"] = None
        cls.rooms[game_id]["game_loop_task"].cancel()
        await asyncio.wait([cls.rooms[game_id]["game_loop_task"]])
        cls.rooms[game_id]["game_loop_task"] = asyncio.create_task(cls.game_start(game_id))
    
    @classmethod
    async def game_winner(cls, game_id):
        # logger.info(cls.rooms[game_id]["game_state"]["score1"])
        # logger.info(cls.rooms[game_id]["game_state"]["score2"])
        if cls.rooms[game_id]["game_state"]["score1"] == 3:
            return "player1"
        elif cls.rooms[game_id]["game_state"]["score2"] == 3:
            return "player2"
        else:
            return None    

    @classmethod
    async def game_score(cls, game_id):
        score1 = cls.rooms[game_id]["game_state"]["score1"]
        score2 = cls.rooms[game_id]["game_state"]["score2"]
        return score1, score2

    @classmethod
    async def save_game(cls, game_id):
        logger.info(f"Saving game with ID: {game_id}")

        # Ensure the game exists
        game_exists = await database_sync_to_async(Game.objects.filter(id=game_id).exists)()
        if not game_exists:
            logger.error(f"Game with ID {game_id} does not exist!")
            return

        # Fetch game instance inside a transaction to prevent race conditions
        @database_sync_to_async
        def get_game_instance():
            with transaction.atomic():
                return Game.objects.select_related('player1', 'player2').get(id=game_id)

        game = await get_game_instance()

        # # Determine winner and loser
        # winner_string = await cls.game_winner(game_id)
        winner_string = cls.rooms[game_id]["winner"]
        if winner_string == "player1":
            winner, loser = game.player1, game.player2
        elif winner_string == "player2":
            winner, loser = game.player2, game.player1
        else:
            logger.info("No winner yet, game not saving.")
            return

        # Get scores
        score1, score2 = await cls.game_score(game_id)

        # Update game state, match history, and player stats
        @database_sync_to_async
        def update_game_match_history_and_stats():
            with transaction.atomic():
                # Update game instance
                game.winner = winner
                game.loser = loser
                game.player1_score = score1
                game.player2_score = score2
                game.state = "finished"
                game.save()

                # Save match history
                match_result = f"{score1}-{score2}"
                MatchHistory.objects.create(
                    game=game,
                    player1=game.player1,
                    player2=game.player2,
                    winner=winner,
                    loser=loser,
                    result=match_result
                )

                # Update player stats
                if winner:
                    winner.total_wins += 1
                    winner.total_games_played += 1
                    winner.total_points_scored += score1 if winner == game.player1 else score2
                    winner.save()

                if loser:
                    loser.total_losses += 1
                    loser.total_games_played += 1
                    loser.total_points_scored += score2 if loser == game.player2 else score1
                    loser.save()

        await update_game_match_history_and_stats()
        logger.info(f"Game {game_id}, match history, and player stats updated successfully.")


    @classmethod
    def initialize_game_state(cls, game_id):
        """Initializes the game state."""
        cls.rooms[game_id]["game_state"] = {
            "ball": {"x": 400, "y": 200, "dx": 180, "dy": 180},
            "paddle1": {"x": 10, "y": 150},
            "paddle2": {"x": cls.canvas_width - 20, "y": 150},
            "score1": 0,
            "score2": 0,
        }
        cls.rooms[game_id]["winner"] = None
        cls.rooms[game_id]["last_timestamp"] = time.time_ns()

    @classmethod
    async def game_loop(cls, game_id):
        timestamp = time.time_ns()
        delta = timestamp - cls.rooms[game_id]["last_timestamp"]
        cls.rooms[game_id]["last_timestamp"] = timestamp

        # Move ball
        cls.rooms[game_id]["game_state"]["ball"]["x"] += cls.rooms[game_id]["game_state"]["ball"]["dx"] * delta / 1e9
        cls.rooms[game_id]["game_state"]["ball"]["y"] += cls.rooms[game_id]["game_state"]["ball"]["dy"] * delta / 1e9

        # Ball collision with top and bottom
        if cls.rooms[game_id]["game_state"]["ball"]["y"] <= cls.ball_size or \
            cls.rooms[game_id]["game_state"]["ball"]["y"] >= cls.canvas_height - cls.ball_size:
            cls.rooms[game_id]["game_state"]["ball"]["dy"] *= -1

        # Ball collision with paddles
        if (cls.rooms[game_id]["game_state"]["paddle1"]["x"] <= cls.rooms[game_id]["game_state"]["ball"]["x"] <= cls.rooms[game_id]["game_state"]["paddle1"]["x"] + cls.paddle_width and 
            cls.rooms[game_id]["game_state"]["paddle1"]["y"] <= cls.rooms[game_id]["game_state"]["ball"]["y"] <= cls.rooms[game_id]["game_state"]["paddle1"]["y"] + cls.paddle_height):
            cls.rooms[game_id]["game_state"]["ball"]["dx"] = abs(cls.rooms[game_id]["game_state"]["ball"]["dx"])

        elif (cls.rooms[game_id]["game_state"]["paddle2"]["x"] <= cls.rooms[game_id]["game_state"]["ball"]["x"] <= cls.rooms[game_id]["game_state"]["paddle2"]["x"] + cls.paddle_width and
              cls.rooms[game_id]["game_state"]["paddle2"]["y"] <= cls.rooms[game_id]["game_state"]["ball"]["y"] <= cls.rooms[game_id]["game_state"]["paddle2"]["y"] + cls.paddle_height):
            cls.rooms[game_id]["game_state"]["ball"]["dx"] = -abs(cls.rooms[game_id]["game_state"]["ball"]["dx"])

        # Ball out of bounds (reset and update score)
        if cls.rooms[game_id]["game_state"]["ball"]["x"] < 0:
            cls.rooms[game_id]["game_state"]["score2"] += 1
            cls.reset_ball(game_id)
        elif cls.rooms[game_id]["game_state"]["ball"]["x"] > cls.canvas_width:
            cls.rooms[game_id]["game_state"]["score1"] += 1
            cls.reset_ball(game_id)

        cls.rooms[game_id]["winner"] = await cls.game_winner(game_id)
        if cls.rooms[game_id]["winner"]:    await cls.save_game(game_id)
        await cls.broadcast_game_state(game_id)

    @classmethod
    def reset_ball(cls, game_id):
        """Resets the ball to the center with a random direction."""
        cls.rooms[game_id]["game_state"]["ball"]["x"] = cls.canvas_width // 2
        cls.rooms[game_id]["game_state"]["ball"]["y"] = cls.canvas_height // 2
        cls.rooms[game_id]["game_state"]["ball"]["dx"] = 180 * (1 if random.random() > 0.5 else -1)
        cls.rooms[game_id]["game_state"]["ball"]["dy"] = 180 * (1 if random.random() > 0.5 else -1)

    @classmethod
    async def update_paddle(cls, game_id, data):
        """Updates paddle positions based on client input."""
        player = data.get("player")
        position = data.get("position")
        logger.info("Player: %s, Position: %s", player, position)

        # if player in ["paddle1", "paddle2"]:
        if player in cls.rooms[game_id]["players"]:
            if 0 <= position <= cls.canvas_height - cls.paddle_height:  # Prevent paddles from moving out of bounds
                paddle = cls.rooms[game_id]["game_state"][cls.rooms[game_id]["players"][player]]
                if abs(paddle["y"] - position) <= 20: # Check validity of input
                    paddle["y"] = position
                else:
                    logger.warning(f"Invalid input from {player}")
        await cls.broadcast_game_state(game_id)
    
    @classmethod
    async def broadcast_game_state(cls, game_id):
        """Sends game state to all clients."""
        # if not hasattr(self, "game_state"):
        #     self.initialize_game_state()
        state = {
            "type": "send_game_state",
            "state": cls.rooms[game_id]["game_state"],
        }
        state["state"]["winner"] = cls.rooms[game_id]["winner"]
        await cls.channel_layer.group_send(f"pong_{game_id}", state)

    @classmethod
    def get_player_count(cls, game_id):
        room = cls.rooms.get(game_id, None)
        return len(room["players"])

    @classmethod
    async def remove_player(cls, game_id, player_id):
        if cls.rooms[game_id]:
            cls.rooms[game_id]["players"].pop(player_id, None)
            cls.rooms[game_id]["ready"].discard(player_id)

            if len(cls.rooms[game_id]["players"]) == 0:
                if cls.rooms[game_id]["game_loop_task"]:
                    cls.rooms[game_id]["game_loop_task"].cancel()
                    await asyncio.wait([cls.rooms[game_id]["game_loop_task"]])
                cls.rooms.pop(game_id, None)
 

class PongGameConsumer(AsyncWebsocketConsumer):
    last_broadcast_time = 0
    ball_size = 10
    paddle_width = 10
    paddle_height = 100
    canvas_width = 800
    canvas_height = 400
    game_id = None

    async def connect(self):
        """Handles new WebSocket connections."""
        # self.user = self.scope['user']
        # self.id = self.scope['user'].username if self.scope['user'] else self.channel_name
        await self.accept()
        await self.send(json.dumps({"type": "id"})) #send the id to the client (replace with user_id)
        logger.info("WebSocket connected: %s", self.channel_name) #username instead of channel_name

    async def disconnect(self, close_code):
        """Handles WebSocket disconnections."""
        await self.channel_layer.group_discard(f"pong_{self.game_id}", self.channel_name)
        if self.game_id and self.id:
            await GameManager.remove_player(self.game_id, self.id)
        logger.info("WebSocket disconnected: %s", self.channel_name)
        if hasattr(self, "game_loop_task"):
            self.game_loop_task.cancel()

    async def receive(self, text_data):
        """Handles messages received from clients."""
        data = json.loads(text_data)
        action = data.get("action") 
        logger.info(f"Data: {data}")
        logger.info("Received action: %s", action)

        if action == "start_game":
            # game_id = await self.generate_unique_game_id()
            # await self.send(json.dumps({"type": "game_id", "game_id": game_id}))
            game_id = data.get("game_id")
            self.game_id = game_id
            self.id = data.get("player_id")
            logger.info(f"ID: {self.id}")
            await self.channel_layer.group_add(f"pong_{game_id}", self.channel_name)
            await GameManager.add_player(game_id, self.id)
            await GameManager.request_start_game(game_id, self.id)
        if action == "move_paddle":
            game_id = data.get("game_id") 
            logger.info(game_id) 
            await GameManager.update_paddle(game_id, data)
        if action == "pause_game":
            game_id = data.get("game_id")
            await GameManager.pause_game(game_id)
        if action == "resume_game":
            game_id = data.get("game_id")
            await GameManager.resume_game(game_id)
        if action == "restart_game":
            game_id = data.get("game_id")
            await GameManager.restart_game(game_id)
        if action == "save_game":
            game_id = data.get("game_id")
            logger.info("Saving game....JFKSDNFKDSNSFN.")
            await GameManager.save_game(game_id)
        else:
            logger.warning("Invalid action")

    async def send_game_state(self, event):
        """Sends game state update to the client."""
        await self.send(text_data=json.dumps(event["state"]))

    @sync_to_async
    def generate_unique_game_id(self):
        """Generates a unique 6-digit game ID."""
        return ''.join(random.choices(string.digits, k=6))
