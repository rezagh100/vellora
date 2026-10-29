
from rest_framework import serializers

PHONE_REGEX = r"^09\d{9}$"


class OTPRequestSerializer(serializers.Serializer):
    phone_number = serializers.RegexField(
        regex=PHONE_REGEX,
        error_messages={
            "invalid": "شماره موبایل باید با فرمت 09123456789 باشد."
        },
    )


class OTPVerifySerializer(serializers.Serializer):
    phone_number = serializers.RegexField(
        regex=PHONE_REGEX,
        error_messages={
            "invalid": "شماره موبایل باید با فرمت 09123456789 باشد."
        },
    )
    code = serializers.RegexField(
        regex=r"^\d{6}$",
        error_messages={
            "invalid": "کد تأیید باید ۶ رقم باشد."
        },
    )
