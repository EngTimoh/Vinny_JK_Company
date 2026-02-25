import os
import django
from django.conf import settings

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vinny_kj.settings')
django.setup()

from api.utils import send_notification_sms

def test_sms():
    phone = "0700000000" # Dummy number for testing connection/auth
    message = "Test message from Vinny KJ system."
    
    print(f"AT_USERNAME: {settings.AT_USERNAME}")
    print(f"AT_API_KEY: {'*' * 10}{settings.AT_API_KEY[-4:] if settings.AT_API_KEY else 'None'}")
    
    print(f"Testing SMS connection with dummy number {phone}...")
    response = send_notification_sms(phone, message)
    
    if response:
        print("Response received from Africa's Talking:")
        print(response)
    else:
        print("Failed to get response. Check terminal logs.")

if __name__ == "__main__":
    test_sms()
