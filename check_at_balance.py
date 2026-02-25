import os
import django
from django.conf import settings

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vinny_kj.settings')
django.setup()

import africastalking

def check_balance():
    username = settings.AT_USERNAME
    api_key = settings.AT_API_KEY
    africastalking.initialize(username, api_key)
    
    application = africastalking.Application
    
    try:
        response = application.fetch_user_data()
        print("User Data from Africa's Talking:")
        print(f"Username: {username}")
        print(f"Balance: {response['UserData']['balance']}")
    except Exception as e:
        print(f"Error fetching user data: {e}")

if __name__ == "__main__":
    check_balance()
Line: 1
