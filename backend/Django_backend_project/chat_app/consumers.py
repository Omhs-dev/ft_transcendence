import json
import logging

from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import async_to_sync
from django.contrib.auth.models import User
from .models import *
from channels.db import database_sync_to_async
from channels.layers import get_channel_layer
import redis

logger = logging.getLogger(__name__)

class ChatConsumer(AsyncWebsocketConsumer):

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.channel_layer = get_channel_layer()
        self.redis = redis.StrictRedis(host='redis_container', port=6379, db=0) # use the same host as CHANNEL_LAYERS

    async def connect(self):
        self.user = self.scope['user']
        if self.user.is_authenticated:
            await self.accept()

            # store the user channel in Redis
            self.redis.set(f"user_{self.user.id}_channel", self.channel_name) # or await self.redis.set(...) if you use redis>=3.2.0
            await self.channel_layer.group_add("online_users", self.channel_name) # add user to online users group

            await self.send_online_status(True)
            
            # fill online_users variable with the online users according to the redis
            online_users = {}  # Initialize an empty dictionary
            for key in self.redis.scan_iter("user_*_channel"): # iterate all the user channels
                user_id = key.decode("utf-8").split("_")[1] # extract user id from the key
                username = await database_sync_to_async(lambda: User.objects.get(id = int(user_id)).username)()
                online_users[user_id] = {'username': username, 'user_id':user_id, 'isOnline': True} # add user to online users list
            
            # Send the initial online user list to the *newly connected* user
            await self.send(text_data=json.dumps({
                'type': 'user.status',
                'online_users': online_users
            }))

            logger.info(f"\n\n\nHIII NAVIDDDDD User {self.user.username} with the id {self.user.id} connected\n")
        else:
            await self.close()

    async def disconnect(self, close_code):
        if self.user.is_authenticated:
            # Remove user from Redis since Redis keep the online users list:
            self.redis.delete(f"user_{self.user.id}_channel") # or await self.redis.delete(...) if you use redis>=3.2.0

            logger.info(f"\n\n\nUser {self.user.username} with the id {self.user.id} disconnected with this close code {close_code}\n")
            # Send offline status to all online users:
            await self.send_online_status(False)

            # Remove from online users group:
            await self.channel_layer.group_discard("online_users", self.channel_name)

            await self.send(text_data=json.dumps({
                'type': 'disconnect',
                'reason': f"Disconnect with the code {close_code}"
                }))
            
            logger.info(f"\n\n\nHIII NAVIDDDDD User {self.user.username} with the id {self.user.id} disconnected\n")
        await self.close()

    async def receive(self, text_data):
        data = json.loads(text_data)

        #####
        receiver_channel = self.redis.get(f"user_{'receiver_id'}_channel") # or await self.redis.get(...) if you use redis>=3.2.0
        if receiver_channel:
            await self.channel_layer.group_add(self.room_group_name, receiver_channel.decode("utf-8"))
        #####

        if data.get('type') == 'get_chat_history':
            chat_room_id = data['chat_room_id']
            chat_messages = await database_sync_to_async(list)(ChatMessage.objects.filter(chat_room_id=chat_room_id).order_by('timestamp'))
            # Convert messages to a format suitable for JSON serialization
            messages_data = [{'sender': msg.sender.username, 'message': msg.message, 'timestamp': str(msg.timestamp)} for msg in chat_messages]

            await self.send(text_data=json.dumps({
                'type': 'chat_history',
                'messages': messages_data
            }))

        elif data.get('type') == 'chat_request':
            target_id = data['target_id']
            message = data.get('message')

            target_user = await database_sync_to_async(User.objects.get)(id=target_id)

            # Get or create the ChatRoom:
            chat_room, created = await database_sync_to_async(ChatRoom.objects.get_or_create)(
            user1=self.user, user2=target_user
            )

            await self.channel_layer.group_add(f'chat_{chat_room.id}', self.channel_name)
            target_channel_name = self.redis.get(f"user_{target_id}_channel") # or await self.redis.get(...) if you use redis>=3.2.0

            logger.debug(f"\n\n\nSending chat request to {target_user.username} as {target_channel_name}\n")
            if target_channel_name:
                await self.channel_layer.group_add(f'chat_{chat_room.id}', target_channel_name.decode())
            
            chat_message = await database_sync_to_async(ChatMessage.objects.create)(
                chat_room=chat_room, sender=self.user, message=message
            )

                # 4. Send chat request (including the initial message):
            await self.channel_layer.group_send(  # Send to the group!
                f'chat_{chat_room.id}',
                {
                    'type': 'chat_request',
                    'creator_id': self.user.id,
                    'creator_username': self.user.username,
                    'target_id': target_id,
                    'target_username': target_user.username,
                    'message': chat_message.message,  # Include the message
                    'message_id': chat_message.id,  # Include the message ID
                    'chat_room_id': chat_room.id
                }
            )
            logger.info(f"\n\n\nChat request sent from {self.user.username} to {target_user.username} \
                    with message:{chat_message.message} and chat_room_id:{chat_room.id}\n")

        elif data.get('type') == 'chat_message':
            message = data.get('message')
            receiver_id = data.get('receiver_id')
            chat_room_id = data.get('chat_room_id')

            if message and receiver_id and chat_room_id:
                receiver = await database_sync_to_async(User.objects.get)(id=receiver_id)

                is_blocked = await database_sync_to_async(
                    lambda: BlockedUser.objects.filter(blocker=receiver, blocked=self.user).exists()
                )()

                if is_blocked:
                    await self.send(json.dumps({'error': 'You are blocked by this user.'}))
                    return
                
                chat_room = await database_sync_to_async(ChatRoom.objects.get)(id=chat_room_id)

                chat_message = await database_sync_to_async(ChatMessage.objects.create)(
                    chat_room=chat_room, sender=self.user, message=message
                )

                logger.info(f"\n\n\n 1111111 in chat_message user with id {self.user.id} send this message <{message}> to receiver id {receiver_id} whit chat_room_id: {chat_room_id}\n")

                await self.channel_layer.group_send(
                    f'chat_{chat_room.id}',
                    {
                        'type': 'chat_message',
                        'message': chat_message.message,
                        'sender_id': chat_message.sender.id,
                        'sender': chat_message.sender.username,
                        'receiver_id': receiver_id,
                        'receiver_name': receiver.username,
                        'message_id': chat_message.id,
                        'chat_room_id': chat_room_id
                        # 'is_read': chat_message.is_read
                    }
                )

    async def chat_message(self, event):
        message_id = event.get('message_id')
        message = event.get('message')
        sender = event.get('sender')
        receiver_id = event.get('receiver_id')
        receiver_name = event.get('receiver_name')
        chat_room_id = event.get('chat_room_id')

        if message_id:
            await database_sync_to_async(ChatMessage.objects.filter(id=message_id).update)(is_read=True)

        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message': message,
            'sender': sender,
            'sender_id': self.scope['user'].id,
            'receiver_id': receiver_id,
            'receiver_name': receiver_name,
            'chat_room_id': chat_room_id
        }))

    async def chat_request(self, event):
        creator_id = event['creator_id']
        creator_username = event['creator_username']
        target_id = event['target_id']
        target_username = event['target_username']
        message = event['message']
        chat_room_id = event['chat_room_id']

        await self.send(text_data=json.dumps({
            'type': 'chat_request',
            'creator_id': creator_id,
            'creator_username': creator_username,
            'target_id': target_id,
            'target_username': target_username,
            'message': message,
            'chat_room_id': chat_room_id
        }))

    async def send_online_status(self, is_online):
        await self.channel_layer.group_send(
            "online_users",
            {
                'type': 'online_status',
                'user_id': self.user.id,
                'username': self.user.username,
                'is_online': is_online
            }
        )

    async def online_status(self, event):
        await self.send(text_data=json.dumps({
            'type': 'online_status',
            'user_id': event['user_id'],
            'username': event['username'],
            'is_online': event['is_online']
        }))
