from django.contrib import admin
from .models import Conversation, Message


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ("id", "type", "created_at")
    list_filter = ("type",)
    search_fields = ("participants__phone_number",)


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ("id", "conversation", "sender", "created_at", "is_read")
    list_filter = ("is_read", "created_at")
    search_fields = ("content", "sender__phone_number")
