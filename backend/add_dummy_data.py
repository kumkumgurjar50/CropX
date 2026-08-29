import os
import django
import random
from decimal import Decimal
from datetime import timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cropx_backend.settings')
django.setup()

from faker import Faker
from django.utils import timezone
from authentication.models import User
from farms.models import Farm, Crop, MarketListing, Fertilizer, MarketPrice

def generate_dummy_data():
    fake = Faker('en_IN')
    
    # 1. Ensure at least 3 Farmers and 3 Customers exist
    farmers = list(User.objects.filter(role='FARMER'))
    customers = list(User.objects.filter(role='CUSTOMER'))
    
    while len(farmers) < 3:
        email = fake.unique.email()
        u = User.objects.create(email=email, role='FARMER', name=fake.name())
        u.set_password('123')
        u.save()
        farmers.append(u)
    
    while len(customers) < 3:
        email = fake.unique.email()
        u = User.objects.create(email=email, role='CUSTOMER', name=fake.name())
        u.set_password('123')
        u.save()
        customers.append(u)
        
    print(f"Ensured users exist: {len(farmers)} Farmers, {len(customers)} Customers.")

    # 2. Add Farms and Crops
    print("Adding Farms and Crops...")
    crop_names = ['Wheat', 'Rice', 'Cotton', 'Sugarcane', 'Maize', 'Millet', 'Soybean', 'Tomato', 'Potato']
    
    for farmer in farmers:
        # Give each farmer 1-2 farms
        for _ in range(random.randint(1, 2)):
            farm, created = Farm.objects.get_or_create(
                owner=farmer,
                name=f"{fake.last_name()} Agro Farm",
                defaults={
                    'village': fake.city(),
                    'district': fake.city(),
                    'state': fake.state(),
                    'area_acres': Decimal(random.uniform(5, 50)).quantize(Decimal('0.01')),
                    'soil_type': random.choice(['CLAY', 'SANDY', 'LOAMY']),
                    'irrigation_type': random.choice(['DRIP', 'SPRINKLER']),
                }
            )
            
            # Add 2-4 crops per farm
            for _ in range(random.randint(2, 4)):
                c = random.choice(crop_names)
                Crop.objects.create(
                    farm=farm,
                    name=c,
                    sowing_date=timezone.now().date() - timedelta(days=random.randint(20, 100)),
                    current_stage=random.choice(['VEGETATIVE', 'FLOWERING', 'FRUITING', 'MATURITY']),
                    health_status=random.choice(['GOOD', 'EXCELLENT', 'FAIR']),
                    area_acres=Decimal(random.uniform(1, 10)).quantize(Decimal('0.01')),
                    expected_yield_kg=Decimal(random.uniform(1000, 5000)).quantize(Decimal('0.01')),
                )
                
    # 3. Add Market Listings
    print("Adding Market Listings...")
    MarketListing.objects.filter(status='DRAFT').delete()
    for farmer in farmers:
        for _ in range(random.randint(2, 5)):
            c = random.choice(crop_names)
            MarketListing.objects.create(
                farmer=farmer,
                crop_name=c,
                variety=f"Premium {c}",
                quantity_kg=Decimal(random.randint(50, 2000)),
                price_per_kg=Decimal(random.uniform(10, 150)).quantize(Decimal('0.01')),
                is_organic=random.choice([True, False]),
                description=fake.sentence(),
                status='ACTIVE'
            )
            
    # 4. Add Fertilizers
    print("Adding Fertilizers...")
    fert_names = ['Urea', 'DAP', 'MOP', 'SSP', 'NPK 19-19-19', 'Zinc Sulphate', 'Neem Cake']
    if Fertilizer.objects.count() < 10:
        for _ in range(15):
            name = random.choice(fert_names)
            Fertilizer.objects.create(
                name=f"{fake.company()} {name}",
                brand=fake.company(),
                fertilizer_type=random.choice(['Chemical', 'Organic', 'Fungicide', 'Biofertilizer']),
                description=fake.paragraph(),
                crops=f"{random.choice(crop_names)}, {random.choice(crop_names)}",
                prevents="various pests, fungal infections",
                dose=f"{random.randint(2, 10)} ml/L",
                price=Decimal(random.uniform(200, 1500)).quantize(Decimal('0.01')),
                stock=random.randint(50, 500)
            )

    # 5. Add Market Prices (Market Insights)
    print("Adding Market Prices...")
    if MarketPrice.objects.count() < 20:
        for c in crop_names:
            for _ in range(3):
                MarketPrice.objects.create(
                    crop_name=c,
                    market_name=fake.city() + " APMC",
                    state=fake.state(),
                    price_per_quintal=Decimal(random.uniform(1500, 8000)).quantize(Decimal('0.01')),
                    trend=random.choice(['UP', 'DOWN', 'STABLE']),
                    change_percent=round(random.uniform(-5.0, 5.0), 1)
                )

    print("Success! Extensive dummy data has been added to the database.")

if __name__ == '__main__':
    generate_dummy_data()
