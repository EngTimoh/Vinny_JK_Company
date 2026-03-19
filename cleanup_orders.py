import os
import django
import sys

# Setup Django environment
sys.path.append(r'c:\Users\ADMIN\Desktop\tintproject\Vinny_JK_Company')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vinny_kj.settings')
django.setup()

from api.models import Order

def cleanup():
    # Mark old paid or delivered orders as confirmed
    paid_count = Order.objects.filter(is_paid=True).update(is_confirmed=True)
    delivered_count = Order.objects.filter(is_delivered=True).update(is_confirmed=True)
    
    # Ensure default payment method is set (should already be from model default but good to be sure)
    # Most old orders were M-Pesa
    Order.objects.filter(payment_method='').update(payment_method='M-Pesa')
    
    print(f"Updated {paid_count} paid orders and {delivered_count} delivered orders.")

if __name__ == "__main__":
    cleanup()
