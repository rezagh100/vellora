
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    model = User

    list_display = (
        "phone_number",
        "username",
        "email",
        "is_staff",
        "is_active",
    )

    search_fields = ("phone_number", "username", "email")
    ordering = ("phone_number",)

    fieldsets = (
        (None, {
            "fields": ("phone_number", "password"),
        }),
        ("Personal info", {
            "fields": ("username", "first_name", "last_name", "email"),
        }),
        ("Permissions", {
            "fields": (
                "is_active",
                "is_staff",
                "is_superuser",
                "groups",
                "user_permissions",
            ),
        }),
        ("Important dates", {
            "fields": ("last_login", "date_joined"),
        }),
    )

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": (
                "phone_number",
                "username",
                "password1",
                "password2",
            ),
        }),
    )
