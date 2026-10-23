import os

from django.core.exceptions import ImproperlyConfigured
from kavenegar import KavenegarAPI


def send_sms(phone_number, code):
    api_key = os.getenv("KAVENEGAR_API_KEY")
    template = os.getenv("KAVENEGAR_OTP_TEMPLATE")

    if not api_key or not template:
        raise ImproperlyConfigured(
            "Kavenegar API key or OTP template is missing."
        )

    api = KavenegarAPI(api_key, timeout=10)

    return api.verify_lookup({
        "receptor": phone_number,
        "token": str(code),
        "template": template,
        "type": "sms",
    })