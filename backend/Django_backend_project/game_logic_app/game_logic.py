import json, asyncio, random, string, logging
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from .models import Game, Player

logger = logging.getLogger("game")

class GameConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # We'll use a single room for this example.
        self.room_group_name = "pong_game_room"
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()
        logger.info("WebSocket connected: %s", self.channel_name)

        # Start the game loop (ball movement updates)
        self.game_loop_task = asyncio.create_task(self.game_loop())

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
        logger.info("WebSocket disconnected: %s", self.channel_name)
        if hasattr(self, 'game_loop_task'):
            self.game_loop_task.cancel()

    async def receive(self, text_data):
        data = json.loads(text_data)
        logger.info("Received data: %s", data)
        action = data.get("action")
        logger.info("Received action: %s", action)
        if action == "start_game":
            # Player1 (host) initiates; data should include a user2_id.
            user1_id = data.get("user1_id")
            user2_id = data.get("user2_id")
            if not user2_id or not user1_id:
                await self.send(text_data=json.dumps({"error": "Missing user ID"}))
                return
            game_id = await self.generate_unique_game_id()
            await self.start_game(game_id, user1_id, user2_id)
        elif action == "move_paddle":
            await self.update_paddle(data)
        # Additional actions (pause, resume, etc.) can be handled here.
        # For this authoritative model, we ignore client ball updates.
        # After processing, broadcast the updated state:
        await self.broadcast_game_state()

    async def broadcast_game_state(self):
        # For simplicity, we'll retrieve game state from a global in-memory variable.
        # In production, you'd update the Game model in the database.
        state = getattr(self, 'game_state', {
            "ball": {"x": 400, "y": 200, "dx": 4, "dy": 4},
            "paddle1": {"y": 150},
            "paddle2": {"y": 150},
            "score1": 0,
            "score2": 0,
        })
        await self.channel_layer.group_send(
            self.room_group_name,
            {"type": "game_state", "state": state}
        )

    async def game_state(self, event):
        # Send the updated state to the client
        await self.send(text_data=json.dumps(event["state"]))

    async def game_loop(self):
        # Initialize game state
        self.game_state = {
            "ball": {"x": 400, "y": 200, "dx": 10, "dy": 10},
            "paddle1": {"y": 150},
            "paddle2": {"y": 150},
            "score1": 0,
            "score2": 0,
        }
        while True
            await asyncio.sleep(0.05)  # 20 FPS update rate
            # Update ball position on the backend (authoritative)
            self.game_state["ball"]["x"] += self.game_state["ball"]["dx"]
            self.game_state["ball"]["y"] += self.game_state["ball"]["dy"]
            # Check collisions with top and bottom of the canvas (height=400)
            if self.game_state["ball"]["y"] <= ballSize || self.game_state["ball"]["y"] >= 400 - ballSize:
                self.game_state["ball"]["dy"] *= -1

            # Check collisions with paddles (simple bounds check)
            if (self.game_state["ball"]["x"] <= paddleWidth && 
                self.game_state["ball"]["y"] >= self.game_state["paddle1"]["y"] && 
                self.game_state["ball"]["y"] <= self.game_state["paddle1"]["y"] + paddleHeight):
                self.game_state["ball"]["dx"] = abs(self.game_state["ball"]["dx"])
            elif (self.game_state["ball"]["x"] >= 800 - paddleWidth &&
                  self.game_state["ball"]["y"] >= self.game_state["paddle2"]["y"] &&
                  self.game_state["ball"]["y"] <= self.game_state["paddle2"]["y"] + paddleHeight):
                self.game_state["ball"]["dx"] = -abs(self.game_state["ball"]["dx"])
            # (Optional) Check for scoring conditions and update score.

            await self.broadcast_game_state()

    async def update_paddle(self, data):
        # data contains "player" ("paddle1" or "paddle2") and "position"
        player = data.get("player")
        position = data.get("position")
        if player in ["paddle1", "paddle2"]:
            self.game_state[player]["y"] = position

    @sync_to_async
    def generate_unique_game_id(self):
        # Generate a random 6-digit string
        return ''.join(random.choices(string.digits, k=6))

    async def start_game(self, game_id,user1_id, user2_id):
        # For simplicity, we set the game state here.
        self.game_state["game_id"] = game_id
        self.game_state["state"] = "in_progress"
        await self.broadcast_game_state()
        logger.info(f"Game started with ID: {game_id}")
