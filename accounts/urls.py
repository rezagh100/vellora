
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import OTPRequestView, OTPVerifyView

urlpatterns = [
    path("auth/otp/request/", OTPRequestView.as_view(), name="otp-request"),
    path("auth/otp/verify/", OTPVerifyView.as_view(), name="otp-verify"),
    path("refresh/", TokenRefreshView.as_view(), name="token-refresh"),
]
