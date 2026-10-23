import secrets
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password, check_password
from django.db import IntegrityError, transaction
from django.utils import timezone

from rest_framework_simplejwt.tokens import RefreshToken

from .models import OTPCode
from .sms import send_sms


User = get_user_model()

OTP_TTL = timedelta(minutes=5)
OTP_RESEND_INTERVAL = timedelta(seconds=60)
OTP_MAX_ATTEMPTS = 5


# Custom exceptions
class OTPServiceError(Exception):
    pass


class OTPResendTooSoon(OTPServiceError):
    pass


class OTPDeliveryFailed(OTPServiceError):
    pass


class OTPInvalid(OTPServiceError):
    pass


class OTPExpired(OTPServiceError):
    pass


class OTPTooManyAttempts(OTPServiceError):
    pass


class PhoneAlreadyRegistered(OTPServiceError):
    pass


def request_registration_otp(phone_number):
    """
    Generate, hash and send an OTP.
    """

    now = timezone.now()

    # Check resend cooldown
    active_otp = (
        OTPCode.objects
        .filter(
            phone_number=phone_number,
            is_used=False,
        )
        .order_by("-created_at")
        .first()
    )

    if (
        active_otp
        and active_otp.created_at + OTP_RESEND_INTERVAL > now
    ):
        raise OTPResendTooSoon

    # Generate a 6-digit code as a string
    code = f"{secrets.randbelow(1_000_000):06d}"

    # Invalidate previous OTPs and save the new one
    with transaction.atomic():
        OTPCode.objects.filter(
            phone_number=phone_number,
            is_used=False,
        ).update(is_used=True)

        otp = OTPCode.objects.create(
            phone_number=phone_number,
            code_hash=make_password(code),
            expires_at=now + OTP_TTL,
        )

    # Send SMS outside the database transaction
    try:
        send_sms(
            phone_number,
            f"کد تأیید شما: {code}",
        )
    except Exception as exc:
        OTPCode.objects.filter(pk=otp.pk).update(
            is_used=True
        )
        raise OTPDeliveryFailed from exc


def verify_registration_otp(phone_number, code):
    """
    Verify the OTP, create the user, and issue JWT tokens.
    """

    user = None
    error = None

    with transaction.atomic():
        otp = (
            OTPCode.objects
            .select_for_update()
            .filter(
                phone_number=phone_number,
                is_used=False,
            )
            .order_by("-created_at")
            .first()
        )

        if otp is None:
            error = OTPInvalid()

        elif otp.expires_at <= timezone.now():
            otp.is_used = True
            otp.save(update_fields=["is_used"])
            error = OTPExpired()

        elif otp.attempts >= OTP_MAX_ATTEMPTS:
            otp.is_used = True
            otp.save(update_fields=["is_used"])
            error = OTPTooManyAttempts()

        elif not check_password(code, otp.code_hash):
            otp.attempts += 1

            if otp.attempts >= OTP_MAX_ATTEMPTS:
                otp.is_used = True
                error = OTPTooManyAttempts()
            else:
                error = OTPInvalid()

            otp.save(update_fields=["attempts", "is_used"])

        else:
            # This endpoint is for registration, not login.
            if User.objects.filter(
                phone_number=phone_number
            ).exists():
                otp.is_used = True
                otp.save(update_fields=["is_used"])
                error = PhoneAlreadyRegistered()

            else:
                # Nested transaction handles a possible race
                # on the unique phone_number field.
                try:
                    with transaction.atomic():
                        user = User.objects.create_user(
                            phone_number=phone_number
                        )
                except IntegrityError:
                    error = PhoneAlreadyRegistered()

                otp.is_used = True
                update_fields = ["is_used"]

                if user is not None:
                    otp.user = user
                    update_fields.append("user")

                otp.save(update_fields=update_fields)

    # Raise errors only after the transaction commits,
    # so failed-attempt counters are persisted.
    if error is not None:
        raise error

    # Issue JWT tokens after successful registration.
    refresh = RefreshToken.for_user(user)

    return {
        "user": user,
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    }