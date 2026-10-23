from rest_framework import serializers

PHONE_REGEX = r"\+[1-9]\d{7,14}$"


class OTPRequestSerializer(serializers.Serializer):
    phone_number = serializers.RegexField(regex=PHONE_REGEX)
    error_messages = {'detail':'شماره موبایل نادرست است'}
    
    
    
class OTPVerifySerializer(serializers.Serializer):
    phone_number = serializers.RegexField(regex=PHONE_REGEX)
    code = serializers.RegexField(regex=r"\d{6}$")
    