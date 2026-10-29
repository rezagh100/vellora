
from datetime import timedelta
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import check_password
from django.test import TestCase
from django.utils import timezone

from accounts.models import OTPCode
from accounts.services import (
    OTPDeliveryFailed,
    OTPExpired,
    OTPInvalid,
    OTPResendTooSoon,
    OTPTooManyAttempts,
    PhoneAlreadyRegistered,
    request_registration_otp,
    verify_registration_otp,
)

User = get_user_model()


class OTPServiceTests(TestCase):
    def setUp(self):
        self.phone_number = "09123456789"

    @patch("accounts.services.send_sms")
    def test_request_otp_creates_hashed_code(self, mock_send_sms):
        request_registration_otp(self.phone_number)

        otp = OTPCode.objects.get(phone_number=self.phone_number)

        self.assertFalse(otp.is_used)
        self.assertTrue(
            check_password(
                mock_send_sms.call_args.args[1].split(": ")[1],
                otp.code_hash,
            )
        )

    @patch("accounts.services.send_sms")
    def test_request_otp_respects_resend_interval(self, mock_send_sms):
        request_registration_otp(self.phone_number)

        with self.assertRaises(OTPResendTooSoon):
            request_registration_otp(self.phone_number)

    @patch("accounts.services.send_sms")
    def test_request_otp_invalidates_previous_code(self, mock_send_sms):
        request_registration_otp(self.phone_number)
        first_otp = OTPCode.objects.get(phone_number=self.phone_number)

        first_otp.created_at = timezone.now() - timedelta(seconds=61)
        first_otp.save(update_fields=["created_at"])

        request_registration_otp(self.phone_number)

        first_otp.refresh_from_db()
        self.assertTrue(first_otp.is_used)
        self.assertEqual(
            OTPCode.objects.filter(
                phone_number=self.phone_number,
                is_used=False,
            ).count(),
            1,
        )

    @patch("accounts.services.send_sms")
    def test_sms_failure_invalidates_otp(self, mock_send_sms):
        mock_send_sms.side_effect = Exception("SMS unavailable")

        with self.assertRaises(OTPDeliveryFailed):
            request_registration_otp(self.phone_number)

        self.assertFalse(
            OTPCode.objects.filter(
                phone_number=self.phone_number,
                is_used=False,
            ).exists()
        )

    @patch("accounts.services.send_sms")
    def test_valid_otp_registers_user_and_returns_tokens(self, mock_send_sms):
        request_registration_otp(self.phone_number)

        message = mock_send_sms.call_args.args[1]
        code = message.split(": ")[1]

        result = verify_registration_otp(self.phone_number, code)

        self.assertEqual(result["user"].phone_number, self.phone_number)
        self.assertTrue(result["access"])
        self.assertTrue(result["refresh"])
        self.assertTrue(
            OTPCode.objects.get(phone_number=self.phone_number).is_used
        )

    @patch("accounts.services.send_sms")
    def test_invalid_otp_increments_attempts(self, mock_send_sms):
        request_registration_otp(self.phone_number)

        with self.assertRaises(OTPInvalid):
            verify_registration_otp(self.phone_number, "000000")

        otp = OTPCode.objects.get(phone_number=self.phone_number)
        self.assertEqual(otp.attempts, 1)

    @patch("accounts.services.send_sms")
    def test_expired_otp_is_rejected(self, mock_send_sms):
        request_registration_otp(self.phone_number)
        otp = OTPCode.objects.get(phone_number=self.phone_number)

        otp.expires_at = timezone.now() - timedelta(seconds=1)
        otp.save(update_fields=["expires_at"])

        with self.assertRaises(OTPExpired):
            verify_registration_otp(self.phone_number, "123456")

        otp.refresh_from_db()
        self.assertTrue(otp.is_used)

    @patch("accounts.services.send_sms")
    def test_registered_phone_cannot_register_again(self, mock_send_sms):
        User.objects.create_user(phone_number=self.phone_number)
        request_registration_otp(self.phone_number)

        message = mock_send_sms.call_args.args[1]
        code = message.split(": ")[1]

        with self.assertRaises(PhoneAlreadyRegistered):
            verify_registration_otp(self.phone_number, code)

    @patch("accounts.services.send_sms")
    def test_maximum_failed_attempts_invalidates_otp(self, mock_send_sms):
        request_registration_otp(self.phone_number)

        for _ in range(4):
            with self.assertRaises(OTPInvalid):
                verify_registration_otp(self.phone_number, "000000")

        with self.assertRaises(OTPTooManyAttempts):
            verify_registration_otp(self.phone_number, "000000")

        otp = OTPCode.objects.get(phone_number=self.phone_number)
        self.assertEqual(otp.attempts, 5)
        self.assertTrue(otp.is_used)
