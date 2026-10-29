
from channels.testing import WebsocketCommunicator
from django.contrib.auth import get_user_model
from django.test import TransactionTestCase
from rest_framework_simplejwt.tokens import RefreshToken

from config.asgi import application
from chat.models import Conversation


User = get_user_model()


class ChatWebSocketSecurityTests(TransactionTestCase):
    def setUp(self):
        self.member = User.objects.create_user(
            phone_number="09123456781",
        )
        self.non_member = User.objects.create_user(
            phone_number="09123456782",
        )
        self.conversation = Conversation.objects.create(
            type=Conversation.ConversationType.PRIVATE,
        )
        self.conversation.participants.add(self.member)

    def get_access_token(self, user):
        return str(RefreshToken.for_user(user).access_token)

    async def test_connection_without_token_is_rejected(self):
        communicator = WebsocketCommunicator(
            application,
            f"/ws/chat/{self.conversation.pk}/",
        )
        connected, _ = await communicator.connect()
        self.assertFalse(connected)

    async def test_connection_with_invalid_token_is_rejected(self):
        communicator = WebsocketCommunicator(
            application,
            f"/ws/chat/{self.conversation.pk}/?token=invalid",
        )
        connected, _ = await communicator.connect()
        self.assertFalse(connected)

    async def test_non_member_is_rejected(self):
        token = self.get_access_token(self.non_member)
        communicator = WebsocketCommunicator(
            application,
            f"/ws/chat/{self.conversation.pk}/?token={token}",
        )
        connected, _ = await communicator.connect()
        self.assertFalse(connected)

    async def test_member_can_connect(self):
        token = self.get_access_token(self.member)
        communicator = WebsocketCommunicator(
            application,
            f"/ws/chat/{self.conversation.pk}/?token={token}",
        )
        connected, _ = await communicator.connect()

        try:
            self.assertTrue(connected)
        finally:
            await communicator.disconnect()


class ChatWebSocketMessagingTests(TransactionTestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(
            phone_number="09123456783",
        )
        self.user2 = User.objects.create_user(
            phone_number="09123456784",
        )
        self.conversation = Conversation.objects.create(
            type=Conversation.ConversationType.PRIVATE,
        )
        self.conversation.participants.add(
            self.user1,
            self.user2,
        )

    def get_access_token(self, user):
        return str(RefreshToken.for_user(user).access_token)

    async def test_message_is_broadcast_to_conversation_members(self):
        token1 = self.get_access_token(self.user1)
        token2 = self.get_access_token(self.user2)
        url = f"/ws/chat/{self.conversation.pk}/"

        communicator1 = WebsocketCommunicator(
            application,
            f"{url}?token={token1}",
        )
        communicator2 = WebsocketCommunicator(
            application,
            f"{url}?token={token2}",
        )

        connected1, _ = await communicator1.connect()
        connected2, _ = await communicator2.connect()

        try:
            self.assertTrue(connected1)
            self.assertTrue(connected2)

            message = '{"message": "hello"}'
            await communicator1.send_to(text_data=message)

            response1 = await communicator1.receive_from(timeout=2)
            response2 = await communicator2.receive_from(timeout=2)

            self.assertEqual(response1, message)
            self.assertEqual(response2, message)
        finally:
            await communicator1.disconnect()
            await communicator2.disconnect()
