import os
import django
import sys

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vinny_kj.settings')
django.setup()

from api.utils import send_notification_sms

def run_test():
    """
    To run this test:
    python api/test_sms_utility.py <phone_number>
    Example: python api/test_sms_utility.py 0712345678
    """
    if len(sys.argv) < 2:
        print("Usage: python api/test_sms_utility.py <phone_number>")
        return

    phone_number = sys.argv[1]
    message = "Testing Vinny KJ SMS System. This is a local test."
    
    print(f"--- SMS Test ---")
    print(f"Target: {phone_number}")
    print(f"Message: {message}")
    
    response = send_notification_sms(phone_number, message)
    
    if response:
        print("\nSuccess! Response:")
        print(response)
    else:
        print("\nFailed. Check your console logs and .env settings.")

if __name__ == "__main__":
    run_test()
