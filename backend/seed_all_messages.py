import os
import django
import random
from django.utils import timezone
from datetime import timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cropx_backend.settings')
django.setup()

from authentication.models import User
from farms.models import Message

def seed_all_messages():
    print("Deleting old messages...")
    Message.objects.all().delete()
    
    customers = list(User.objects.filter(role='CUSTOMER'))
    farmers = list(User.objects.filter(role='FARMER'))
    
    count = 0
    
    print("Populating messages so every user has conversations...")
    for farmer in farmers:
        # Give each farmer 2 random customers to complain/chat
        for c in random.sample(customers, min(2, len(customers))):
            m1 = Message.objects.create(sender=c, recipient=farmer, body="Hi! What's the latest update on your listing?")
            m1.created_at = timezone.now() - timedelta(minutes=60)
            m1.save()
            
            m2 = Message.objects.create(sender=farmer, recipient=c, body="Hello! It is ready for harvest this weekend. Let me know the quantity you need.")
            m2.created_at = timezone.now() - timedelta(minutes=45)
            m2.save()

            m3 = Message.objects.create(sender=c, recipient=farmer, body="Perfect. I'll place an order via the portal. Thanks!")
            m3.created_at = timezone.now() - timedelta(minutes=10)
            m3.save()
            count += 3

    print(f"Done! Created {count} messages across {len(farmers) * 2} conversations.")

if __name__ == '__main__':
    seed_all_messages()
