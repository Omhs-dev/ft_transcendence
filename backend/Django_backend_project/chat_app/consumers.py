# from channels.generic.websocket import AsyncWebsocketConsumer
# import json

# class ChatConsumer(AsyncWebsocketConsumer):
#     async def connect(self):
#         self.room_name = self.scope['url_route']['kwargs']['room_name']
#         self.room_group_name = f'chat_{self.room_name}'
#         print(f"WebSocket connected to room: {self.room_name}")

#         # Join room group
#         await self.channel_layer.group_add(
#             self.room_group_name,
#             self.channel_name
#         )
#         await self.accept()

#     async def disconnect(self, close_code):
#         print(f"WebSocket disconnected from room: {self.room_name}")
#         # Leave room group
#         await self.channel_layer.group_discard(
#             self.room_group_name,
#             self.channel_name
#         )

#     async def receive(self, text_data):
#         print(f"Message received: {text_data}")
#         data = json.loads(text_data)
#         message = data['message']
#         sender = data.get('sender', 'Anonymous')

#         # Send message to room group
#         await self.channel_layer.group_send(
#             self.room_group_name,
#             {
#                 'type': 'chat_message',
#                 'message': message,
#                 'sender': sender,
#             }
#         )

#     async def chat_message(self, event):
#         message = event['message']
#         sender = event.get('sender', 'Anonymous')
#         print(f"Broadcasting message: {message} from {sender}")

#         # Send message to WebSocket
#         await self.send(text_data=json.dumps({
#             'message': message,
#             'sender': sender,
#         }))

    # async def receive(self, text_data):
    #     data = json.loads(text_data)
    #     message = data.get('message')
    #     receiver_id = data.get('receiver_id')

    #     if message and receiver_id:
    #         receiver = User.objects.get(id=receiver_id)
    #         ChatMessage.objects.create(sender=self.user, receiver=receiver, message=message)
    #         await self.send(json.dumps({'message': message, 'sender': self.user.username}))

from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth.models import User
from .models import BlockedUser, ChatMessage
import json
from channels.db import database_sync_to_async
from asgiref.sync import sync_to_async









# from channels.generic.websocket import AsyncWebsocketConsumer
# from django.contrib.auth.models import User
# from .models import BlockedUser
# import json

# class ChatConsumer(AsyncWebsocketConsumer):
#     async def connect(self):
#         self.user = self.scope['user']
#         if self.user.is_authenticated:
#             profile = self.user.profile
#             profile.is_online = True
#             profile.save()
#         await self.accept()

#     async def disconnect(self, close_code):
#         if self.user.is_authenticated:
#             profile = self.user.profile
#             profile.is_online = False
#             profile.save()
#         await self.close()
        
#     async def receive(self, text_data):
#         data = json.loads(text_data)
#         message = data.get('message')
#         receiver_id = data.get('receiver_id')

#         if message and receiver_id:
#             receiver = await sync_to_async(User.objects.get)(id=receiver_id)
#             is_blocked = await sync_to_async(BlockedUser.objects.filter)(
#                 user=receiver, blocked_user=self.user
#             ).exists()

#             if is_blocked:
#                 await self.send(json.dumps({'error': 'You are blocked by this user.'}))
#                 return

#             # Save message and send it
#             await sync_to_async(ChatMessage.objects.create)(
#                 sender=self.user, receiver=receiver, message=message
#             )
#             await self.send(json.dumps({'message': message, 'sender': self.user.username}))

#     async def chat_message(self, event):
#         message = event['message']
#         sender = event.get('sender', 'Anonymous')
#         print(f"Broadcasting message: {message} from {sender}")

#         # Send message to WebSocket
#         await self.send(text_data=json.dumps({
#             'message': message,
#             'sender': sender,
#         }))

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope['user']
        if self.user.is_authenticated:
            profile = await database_sync_to_async(lambda: self.user.profile)()
            profile.is_online = True
            await database_sync_to_async(profile.save)()
            await self.accept()
        else:
            await self.close()


    async def disconnect(self, close_code):
        if self.user.is_authenticated:
            profile = await database_sync_to_async(lambda: self.user.profile)()
            profile.is_online = False
            await database_sync_to_async(profile.save)()
        await self.close()


    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data.get('message')
        receiver_id = data.get('receiver_id')

        if message and receiver_id:
            receiver = await database_sync_to_async(User.objects.get)(id=receiver_id)
            is_blocked = await database_sync_to_async(BlockedUser.objects.filter)(
                user=receiver, blocked_user=self.user
            ).exists()

            if is_blocked:
                await self.send(json.dumps({'error': 'You are blocked by this user.'}))
                return

            # Save message and send it
            chat_message = await database_sync_to_async(ChatMessage.objects.create)(
                sender=self.user, receiver=receiver, message=message
            )
            await self.channel_layer.group_send(
                f'chat_{receiver_id}',
                {
                    'type': 'chat_message',
                    'message': chat_message.message,
                    'sender': chat_message.sender.username,
                }
            )
            await self.send(json.dumps({'message': message, 'sender': self.user.username}))

    async def chat_message(self, event):
        message = event['message']
        sender = event['sender']
        print(f"Broadcasting message: {message} from {sender}")

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'message': message,
            'sender': sender,
        }))
