
from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import (
    AuthenticationFailed,
    InvalidToken,
    TokenError,
)

from .models import Conversation


@database_sync_to_async
def get_user_from_token(token):
    authentication = JWTAuthentication()
    validated_token = authentication.get_validated_token(token.encode())
    return authentication.get_user(validated_token)


@database_sync_to_async
def is_conversation_member(conversation_id, user_id):
    return Conversation.objects.filter(
        pk=conversation_id,
        participants__id=user_id,
    ).exists()

# reza : for talking with real time environment
class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.group_name = None

        query_params = parse_qs(
            self.scope["query_string"].decode()
        )
        tokens = query_params.get("token", [])

        if not tokens or not tokens[0]:
            await self.close(code=4401)
            return

        try:
            user = await get_user_from_token(tokens[0])
        except (InvalidToken, TokenError, AuthenticationFailed):
            await self.close(code=4401)
            return

        if not user.is_active:
            await self.close(code=4401)
            return

        self.conversation_id = self.scope["url_route"]["kwargs"][
            "conversation_id"
        ]

        if not await is_conversation_member(
            self.conversation_id,
            user.pk,
        ):
            await self.close(code=4403)
            return

        self.user = user
        self.group_name = f"conversation_{self.conversation_id}"

        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name,
        )

        await self.accept()

    async def disconnect(self, close_code):
        if self.group_name:
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name,
            )

    async def receive(self, text_data=None, bytes_data=None):
        if not self.group_name or text_data is None:
            return

        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "chat.message",
                "message": text_data,
            },
        )

    async def chat_message(self, event):
        await self.send(text_data=event["message"])
