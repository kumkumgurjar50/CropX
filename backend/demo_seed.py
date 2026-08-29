import os
import django
import random
from django.utils import timezone
from datetime import timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cropx_backend.settings')
django.setup()

from authentication.models import User
from farms.models import Farm, Crop, MarketListing, Order, Booking, Message, Notification

def seed():
    print("Updating all user passwords to '123'...")
    users = User.objects.all()
    count = 0
    for u in users:
        u.set_password("123")
        u.save()
        count += 1
    print(f"Updated passwords for {count} users.")

    customer = User.objects.filter(role='CUSTOMER').first()
    farmer = User.objects.filter(role='FARMER').first()

    if customer and farmer:
        print(f"Adding rich demo interactions between {customer.name} and {farmer.name}...")
        
        # Add Messages
        Message.objects.all().delete()
        Notification.objects.all().delete()
        
        m1 = Message.objects.create(sender=customer, recipient=farmer, body="Hi! What's the latest update on the organic wheat listing?")
        m1.created_at = timezone.now() - timedelta(minutes=60)
        m1.save()
        
        m2 = Message.objects.create(sender=farmer, recipient=customer, body="Hello! It is ready for harvest this weekend. Let me know the quantity you need.")
        m2.created_at = timezone.now() - timedelta(minutes=45)
        m2.save()

        m3 = Message.objects.create(sender=customer, recipient=farmer, body="Perfect. I'll place an order for 250kg via the portal. Thanks!")
        m3.created_at = timezone.now() - timedelta(minutes=10)
        m3.is_read = False
        m3.save()

        # Add Notification
        Notification.objects.create(
            user=farmer, title="New Message",
            message=f"{customer.name} sent you a new message.",
            notification_type="MESSAGE"
        )
        Notification.objects.create(
            user=customer, title="Order Payment Successful",
            message=f"You successfully paid for ORD-857000 to {farmer.name}.",
            notification_type="ORDER"
        )
        Notification.objects.create(
            user=farmer, title="Payment Received",
            message=f"Payment for ORD-857000 received from {customer.name}.",
            notification_type="ORDER"
        )
        print("Demo chat & notification data injected.")

if __name__ == '__main__':
    seed()
