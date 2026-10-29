
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.throttling import ScopedRateThrottle

from .serializers import OTPRequestSerializer, OTPVerifySerializer
from .services import (
    request_registration_otp,
    verify_registration_otp,
    OTPResendTooSoon,
    OTPDeliveryFailed,
    OTPInvalid,
    OTPExpired,
    OTPTooManyAttempts,
    PhoneAlreadyRegistered,
)


class OTPRequestView(APIView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "otp_request"

    def post(self, request):
        serializer = OTPRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        phone_number = serializer.validated_data["phone_number"]

        try:
            request_registration_otp(phone_number)
        except OTPResendTooSoon:
            return Response(
                {"detail": "برای دریافت کد جدید کمی صبر کنید."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )
        except OTPDeliveryFailed:
            return Response(
                {"detail": "ارسال پیامک ناموفق بود."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response(
            {"detail": "کد تأیید ارسال شد."},
            status=status.HTTP_200_OK,
        )


class OTPVerifyView(APIView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "otp_verify"

    def post(self, request):
        serializer = OTPVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        phone_number = serializer.validated_data["phone_number"]
        code = serializer.validated_data["code"]

        try:
            result = verify_registration_otp(phone_number, code)
        except OTPExpired:
            return Response(
                {"detail": "کد تأیید منقضی شده است."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except OTPTooManyAttempts:
            return Response(
                {"detail": "تعداد تلاش‌های ناموفق بیش از حد مجاز است."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )
        except OTPInvalid:
            return Response(
                {"detail": "کد تأیید نادرست است."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except PhoneAlreadyRegistered:
            return Response(
                {"detail": "این شماره قبلاً ثبت‌نام کرده است."},
                status=status.HTTP_409_CONFLICT,
            )

        user = result["user"]

        return Response(
            {
                "user": {
                    "id": user.pk,
                    "phone_number": user.phone_number,
                },
                "access": result["access"],
                "refresh": result["refresh"],
            },
            status=status.HTTP_201_CREATED,
        )
