import json
from channels.generic.websocket import AsyncWebsocketConsumer

class GameConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = "game_room"
        self.room_group_name = f"game_{self.room_name}"

        # Join game group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        # Accept WebSocket connection
        await self.accept()

    async def disconnect(self, close_code):
        # Leave game group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        # Send data to all players in game
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "game_update",
                "data": data,
            }
        )

    async def game_update(self, event):
        data = event["data"]
        # Send message to WebSocket
        await self.send(text_data=json.dumps(data))
