from django.test import TestCase

from accounts.services import generate_otp, generate_otp_code, verify_otp_code


class OTPServiceTests(TestCase):
    def test_generate_otp_returns_six_digit_code_and_hash(self):
        code, code_hash = generate_otp()

        self.assertRegex(code, r"^\d{6}$")
        self.assertNotEqual(code, code_hash)
        self.assertTrue(verify_otp_code(code, code_hash))

    def test_verify_otp_rejects_a_different_code(self):
        code, code_hash = generate_otp()
        different_code = f"{(int(code) + 1) % 10**6:06d}"

        self.assertFalse(verify_otp_code(different_code, code_hash))

    def test_generate_otp_code_preserves_leading_zeroes(self):
        from unittest.mock import patch

        with patch("accounts.services.secrets.randbelow", return_value=7):
            self.assertEqual(generate_otp_code(), "000007")
