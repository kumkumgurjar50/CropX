"""
Usage:
    python manage.py seed_data          # insert (skips if already present)
    python manage.py seed_data --flush  # wipe @cropx.dev data, then reseed
"""
import random
from datetime import date, timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

from farms.models import (
    Booking, Crop, DiseaseRecord, Farm, MarketListing,
    MarketPrice, Message, Notification, Order,
)

User = get_user_model()

# ── Static seed tables ────────────────────────────────────────────────────────

FARMERS = [
    {"email": "arjun.patil@cropx.dev",  "name": "Arjun Patil"},
    {"email": "sunita.devi@cropx.dev",  "name": "Sunita Devi"},
    {"email": "ravi.kumar@cropx.dev",   "name": "Ravi Kumar"},
    {"email": "priya.sharma@cropx.dev", "name": "Priya Sharma"},
    {"email": "manoj.yadav@cropx.dev",  "name": "Manoj Yadav"},
]
CUSTOMERS = [
    {"email": "anita.mehta@cropx.dev",  "name": "Anita Mehta"},
    {"email": "rohit.sinha@cropx.dev",  "name": "Rohit Sinha"},
    {"email": "kavya.nair@cropx.dev",   "name": "Kavya Nair"},
    {"email": "deepak.joshi@cropx.dev", "name": "Deepak Joshi"},
    {"email": "pooja.verma@cropx.dev",  "name": "Pooja Verma"},
]

FARMS_DATA = [
    {"name": "Green Valley Farm",   "village": "Nashik",   "district": "Nashik",   "state": "Maharashtra",      "area_acres": 12, "soil_type": "LOAMY",  "irrigation_type": "DRIP"},
    {"name": "Sunrise Agro",        "village": "Ludhiana", "district": "Ludhiana", "state": "Punjab",           "area_acres": 18, "soil_type": "SANDY",  "irrigation_type": "CANAL"},
    {"name": "Krishnapur Fields",   "village": "Warangal", "district": "Warangal", "state": "Telangana",        "area_acres": 9,  "soil_type": "CLAY",   "irrigation_type": "BOREWELL"},
    {"name": "Himachal Orchards",   "village": "Shimla",   "district": "Shimla",   "state": "Himachal Pradesh", "area_acres": 6,  "soil_type": "PEATY",  "irrigation_type": "SPRINKLER"},
    {"name": "Deccan Harvest",      "village": "Bidar",    "district": "Bidar",    "state": "Karnataka",        "area_acres": 22, "soil_type": "LOAMY",  "irrigation_type": "FLOOD"},
]

CROP_DEFS = [
    # (name,  variety,      stage,        health,      area, yield_kg)
    ("Wheat",    "GW-496",     "FLOWERING",  "GOOD",      8,  2800),
    ("Tomato",   "Hybrid-7",   "FRUITING",   "EXCELLENT", 3,  9000),
    ("Cotton",   "MCU-5",      "VEGETATIVE", "FAIR",      5,  1500),
    ("Rice",     "IR-64",      "SOWING",     "GOOD",      7,  3200),
    ("Onion",    "Nasik Red",  "MATURITY",   "GOOD",      4,  6000),
    ("Potato",   "Kufri Jyoti","HARVESTED",  "EXCELLENT", 3,  8000),
    ("Maize",    "DHM-117",    "VEGETATIVE", "GOOD",      6,  2400),
    ("Groundnut","TAG-24",     "FLOWERING",  "FAIR",      4,  1600),
    ("Soybean",  "JS-335",     "SOWING",     "GOOD",      5,  1200),
    ("Bajra",    "HHB-67",     "GERMINATION","EXCELLENT", 3,  900),
    ("Sugarcane","Co-86032",   "VEGETATIVE", "GOOD",      5,  40000),
    ("Turmeric", "Salem",      "MATURITY",   "EXCELLENT", 2,  3000),
]

LISTING_DEFS = [
    # (crop_name, variety,       qty_kg,  price_per_kg, is_organic, status)
    ("Wheat",     "GW-496",      12000,   22.00,  False, "ACTIVE"),
    ("Tomato",    "Hybrid-7",    5000,    18.00,  False, "ACTIVE"),
    ("Cotton",    "MCU-5",       8000,    68.00,  False, "ACTIVE"),
    ("Rice",      "IR-64",       15000,   28.00,  True,  "ACTIVE"),
    ("Onion",     "Nasik Red",   10000,   12.00,  False, "ACTIVE"),
    ("Potato",    "Kufri Jyoti", 20000,   9.00,   True,  "ACTIVE"),
    ("Maize",     "DHM-117",     18000,   18.00,  False, "ACTIVE"),
    ("Groundnut", "TAG-24",      4000,    52.00,  True,  "ACTIVE"),
    ("Soybean",   "JS-335",      9000,    41.00,  False, "ACTIVE"),
    ("Bajra",     "HHB-67",      6000,    20.00,  True,  "ACTIVE"),
    ("Sugarcane", "Co-86032",    50000,   3.50,   False, "ACTIVE"),
    ("Turmeric",  "Salem",       2000,    90.00,  True,  "ACTIVE"),
    ("Wheat",     "Raj-4120",    8000,    21.50,  False, "DRAFT"),
    ("Rice",      "Basmati-370", 6000,    45.00,  True,  "DRAFT"),
    ("Tomato",    "PKM-1",       3000,    16.00,  False, "SOLD"),
]

MARKET_PRICES = [
    # (crop, market, state, district, price, min_p, max_p, trend, change_pct)
    ("Wheat",     "Azadpur Mandi",         "Delhi",       "North Delhi",  2250, 2100, 2380, "UP",     4.2),
    ("Wheat",     "Sector 26 Chandigarh",  "Punjab",      "Chandigarh",   2180, 2050, 2300, "STABLE", 0.3),
    ("Rice",      "Vashi APMC",            "Maharashtra", "Mumbai",       2950, 2700, 3100, "UP",     5.8),
    ("Rice",      "Koyambedu Market",      "Tamil Nadu",  "Chennai",      2800, 2600, 3000, "STABLE", -0.4),
    ("Tomato",    "Lasalgaon APMC",        "Maharashtra", "Nashik",       1650, 1200, 2100, "UP",    11.2),
    ("Tomato",    "Yeshwanthpur APMC",     "Karnataka",   "Bengaluru",    1420, 1000, 1900, "DOWN",  -6.3),
    ("Onion",     "Lasalgaon APMC",        "Maharashtra", "Nashik",       1350, 900,  1700, "UP",     9.0),
    ("Onion",     "Gultekdi Market",       "Maharashtra", "Pune",         1280, 850,  1600, "STABLE", 1.1),
    ("Potato",    "Agra Mandi",            "Uttar Pradesh","Agra",        950,  750,  1100, "DOWN",  -3.5),
    ("Potato",    "Azadpur Mandi",         "Delhi",       "North Delhi",  980,  800,  1150, "STABLE", 0.8),
    ("Cotton",    "Akola Market",          "Maharashtra", "Akola",        6950, 6500, 7200, "UP",     2.1),
    ("Cotton",    "Rajkot APMC",           "Gujarat",     "Rajkot",       6800, 6400, 7100, "STABLE",-0.5),
    ("Maize",     "Nizamabad Mandi",       "Telangana",   "Nizamabad",    1850, 1650, 2050, "UP",     3.6),
    ("Soybean",   "Indore Mandi",          "Madhya Pradesh","Indore",     4250, 4000, 4500, "UP",     6.2),
    ("Groundnut", "Junagadh APMC",         "Gujarat",     "Junagadh",     5400, 5000, 5700, "DOWN",  -2.8),
    ("Bajra",     "Jaipur Mandi",          "Rajasthan",   "Jaipur",       2100, 1900, 2300, "STABLE", 0.6),
    ("Sugarcane", "Kolhapur Mandi",        "Maharashtra", "Kolhapur",      380,  340,   420, "UP",     1.9),
    ("Turmeric",  "Erode Market",          "Tamil Nadu",  "Erode",        9200, 8500,10000, "UP",    12.5),
    ("Rice",      "Gultekdi Market",       "Maharashtra", "Pune",         2700, 2500, 2900, "DOWN",  -1.8),
    ("Wheat",     "Hapur Grain Market",    "Uttar Pradesh","Hapur",       2200, 2050, 2350, "UP",     2.9),
]

DISEASE_RECORDS = [
    # (disease_name, severity, confidence, symptoms, organic_treatment, chemical_treatment)
    ("Powdery Mildew",    "MEDIUM", 87.4,
     "White powdery patches on leaves; yellowing around affected areas.",
     "Spray neem oil (5 ml/L) every 7 days. Remove infected leaves promptly.",
     "Apply Carbendazim 50 WP @ 1 g/L or Propiconazole 25 EC @ 1 ml/L."),
    ("Leaf Blight",       "HIGH",   91.2,
     "Brown irregular lesions on leaves; rapid yellowing and leaf drop.",
     "Apply copper-based fungicide (Bordeaux mixture 1%). Improve air circulation.",
     "Mancozeb 75 WP @ 2 g/L; spray at 10-day intervals."),
    ("Root Rot",          "CRITICAL",79.8,
     "Wilting despite adequate water; dark discoloration of roots.",
     "Improve drainage; apply Trichoderma viride @ 4 g/kg soil.",
     "Drench with Metalaxyl 8% + Mancozeb 64 WP @ 2.5 g/L."),
    ("Aphid Infestation", "LOW",    95.1,
     "Clusters of small insects on new growth; sticky honeydew residue.",
     "Spray neem oil or insecticidal soap. Introduce ladybird beetles.",
     "Imidacloprid 17.8 SL @ 0.3 ml/L; limit to 2 applications."),
    ("Yellow Mosaic Virus","HIGH",  82.6,
     "Yellow-green mosaic pattern on leaves; stunted growth.",
     "Remove and destroy infected plants. Control whitefly vector with yellow sticky traps.",
     "No cure; spray Thiamethoxam 25 WG @ 0.3 g/L to control whitefly vector."),
]

NOTIFICATION_DEFS = [
    ("New order received",         "ORDER",   "A customer placed a new order for your crop listing. Check Orders tab."),
    ("Tomato prices rising 📈",    "MARKET",  "Tomato prices up 12% in Azadpur Mandi this week. Consider listing now."),
    ("Disease risk alert 🦠",      "DISEASE", "High humidity detected in your region. Watch for fungal infections on wheat."),
    ("Rain forecast tomorrow 🌧️",  "WEATHER", "Heavy rainfall expected. Delay fertilizer application and harvest ripe produce today."),
    ("Market opportunity 💰",      "MARKET",  "Cotton prices at 6-month high in Akola APMC. Consider listing your cotton stock."),
    ("AI insight: Soybean 🤖",     "AI",      "Soybean demand rising in Indore. Prices up 6.2% — good time to sell stored stock."),
    ("Booking confirmed ✅",        "ORDER",   "Your booking request has been confirmed by the farmer. Delivery in 3 days."),
    ("New message received 💬",    "SYSTEM",  "Rohit Sinha sent you a message about your tomato listing."),
]

MESSAGES = [
    ("Hi, I'm interested in your wheat listing. Is it still available?", "I want to buy 500 kg."),
    ("Hello! Yes, the wheat is available and freshly harvested.", "I can arrange delivery within 3 days."),
    ("Can you offer a discount for bulk purchase of 1000 kg tomatoes?", "We are a restaurant chain."),
    ("For 1000 kg we can offer ₹16/kg instead of ₹18. Let me know.", "I can pack and deliver by Friday."),
    ("Is the rice organically grown? We need certified organic produce.", "Please share certification."),
    ("Yes, it is 100% organic. I can share the certificate on WhatsApp.", "No synthetic pesticide used."),
    ("What is the minimum order quantity for onions?", "We need regular weekly supply."),
    ("Minimum is 200 kg per order. For weekly supply I can give ₹11/kg.", "Delivery every Monday."),
    ("Does the potato come in sorted/graded sizes?", "We need A-grade for retail."),
    ("Yes, I grade all produce before packing. A-grade available at ₹9.50/kg.", "Fresh from cold store."),
]

BOOKING_MESSAGES = [
    "I need this for my restaurant. Can you deliver by Thursday?",
    "Interested in a bulk purchase. Please confirm availability.",
    "Can you guarantee organic certification for this batch?",
    "We need regular weekly supply — 500 kg every Monday.",
    "Please pack in 50 kg bags. We will arrange pickup.",
    "Is price negotiable for 2000+ kg order?",
    "Need fresh stock — harvested within last 7 days only.",
    "Can you arrange transport to Pune? Happy to pay extra.",
]

FARMER_NOTES = [
    "Confirmed! Stock is ready. Will deliver Thursday morning.",
    "Available. I'll pack in 50 kg bags as requested.",
    "Organic certificate will be shared via WhatsApp before dispatch.",
    "Regular supply possible. Will maintain ₹11/kg for weekly orders.",
    "Pickup welcome. Please come between 8am–12pm.",
    "Best price for 2000+ kg is ₹10.50/kg. Let me know.",
    "",  # some without notes
    "",
]


class Command(BaseCommand):
    help = "Seed rich dummy data for all farmer/customer sections."

    def add_arguments(self, parser):
        parser.add_argument("--flush", action="store_true", help="Delete @cropx.dev data first")

    def handle(self, *args, **options):
        if options["flush"]:
            self.stdout.write("Flushing existing cropx.dev data…")
            Order.objects.all().delete()
            Booking.objects.all().delete()
            DiseaseRecord.objects.all().delete()
            MarketListing.objects.all().delete()
            Crop.objects.all().delete()
            Farm.objects.all().delete()
            Message.objects.filter(sender__email__endswith="@cropx.dev").delete()
            Notification.objects.filter(user__email__endswith="@cropx.dev").delete()
            MarketPrice.objects.all().delete()
            User.objects.filter(email__endswith="@cropx.dev").delete()
            self.stdout.write(self.style.WARNING("  Flushed."))

        # ── Users ────────────────────────────────────────────────────────────
        farmer_users, customer_users = [], []
        for data in FARMERS:
            u, created = User.objects.get_or_create(
                email=data["email"],
                defaults={"name": data["name"], "role": "FARMER", "is_verified": True},
            )
            if created:
                u.set_password("123"); u.save()
                self.stdout.write(f"  + Farmer: {u.email}")
            farmer_users.append(u)

        for data in CUSTOMERS:
            u, created = User.objects.get_or_create(
                email=data["email"],
                defaults={"name": data["name"], "role": "CUSTOMER", "is_verified": True},
            )
            if created:
                u.set_password("123"); u.save()
                self.stdout.write(f"  + Customer: {u.email}")
            customer_users.append(u)

        # ── Farms & Crops ─────────────────────────────────────────────────────
        farms = []
        for i, farmer in enumerate(farmer_users):
            fd = FARMS_DATA[i]
            farm, _ = Farm.objects.get_or_create(
                owner=farmer, name=fd["name"],
                defaults={**{k: v for k, v in fd.items() if k != "area_acres"},
                          "area_acres": Decimal(str(fd["area_acres"])), "is_active": True},
            )
            farms.append(farm)
            # 2-3 crops per farm
            for j in range(3):
                cd = CROP_DEFS[(i * 3 + j) % len(CROP_DEFS)]
                sow = date.today() - timedelta(days=random.randint(20, 100))
                Crop.objects.get_or_create(
                    farm=farm, name=cd[0],
                    defaults={
                        "variety": cd[1], "current_stage": cd[2],
                        "health_status": cd[3],
                        "area_acres": Decimal(str(cd[4])),
                        "expected_yield_kg": Decimal(str(cd[5])),
                        "sowing_date": sow,
                        "expected_harvest": sow + timedelta(days=random.randint(90, 150)),
                        "is_active": True,
                        "notes": f"Well-maintained crop. {cd[2].capitalize()} stage.",
                    },
                )

        # ── Market Listings ───────────────────────────────────────────────────
        listings = []
        for i, ld in enumerate(LISTING_DEFS):
            farmer = farmer_users[i % len(farmer_users)]
            listing, created = MarketListing.objects.get_or_create(
                farmer=farmer, crop_name=ld[0], variety=ld[1],
                defaults={
                    "quantity_kg": Decimal(str(ld[2])),
                    "price_per_kg": Decimal(str(ld[3])),
                    "is_organic": ld[4],
                    "status": ld[5],
                    "harvest_date": date.today() - timedelta(days=random.randint(2, 14)),
                    "description": (
                        f"Premium quality {ld[0]} ({ld[1]}) directly from farm. "
                        f"{'Certified organic. ' if ld[4] else ''}Well-graded and sorted. "
                        f"Available for immediate dispatch."
                    ),
                },
            )
            if created:
                self.stdout.write(f"  + Listing: {listing.crop_name} [{listing.status}] by {farmer.name}")
            if listing.status == "ACTIVE":
                listings.append((listing, farmer))

        # ── Orders ────────────────────────────────────────────────────────────
        order_statuses = [
            "DELIVERED", "DELIVERED", "DELIVERED", "ACCEPTED",
            "PENDING", "IN_TRANSIT", "PACKED", "DELIVERED",
            "CANCELLED", "PENDING",
        ]
        pay_map = {
            "DELIVERED": "PAID", "ACCEPTED": "PENDING", "PENDING": "PENDING",
            "IN_TRANSIT": "PAID", "PACKED": "PENDING", "CANCELLED": "REFUNDED",
        }
        cities = ["Mumbai", "Delhi", "Bangalore", "Chennai", "Hyderabad", "Pune", "Ahmedabad"]
        for idx, customer in enumerate(customer_users):
            for k in range(4):  # 4 orders per customer = 20 total
                listing, farmer = listings[(idx * 4 + k) % len(listings)]
                qty = Decimal(str(random.randint(50, 800)))
                price = listing.price_per_kg
                total = (qty * price).quantize(Decimal("0.01"))
                st = order_statuses[(idx * 4 + k) % len(order_statuses)]
                Order.objects.get_or_create(
                    listing=listing, customer=customer, farmer=farmer,
                    defaults={
                        "crop_name": listing.crop_name,
                        "quantity_kg": qty,
                        "price_per_kg": price,
                        "total_price": total,
                        "status": st,
                        "payment_status": pay_map.get(st, "PENDING"),
                        "delivery_address": (
                            f"{customer.name}, Plot {random.randint(1,99)}, "
                            f"{random.choice(cities)} - {random.randint(400001, 600099)}"
                        ),
                    },
                )
        self.stdout.write(f"  + Orders: {Order.objects.count()} total")

        # ── Bookings ──────────────────────────────────────────────────────────
        booking_statuses = ["PENDING", "PENDING", "BOOKED", "BOOKED", "REJECTED",
                            "CANCELLED", "COMPLETED", "PENDING", "BOOKED", "BOOKED"]
        for idx, customer in enumerate(customer_users):
            for k in range(3):  # 3 bookings per customer = 15 total
                listing, farmer = listings[(idx * 3 + k) % len(listings)]
                qty = Decimal(str(random.randint(100, 1000)))
                bst = booking_statuses[(idx * 3 + k) % len(booking_statuses)]
                fnote = random.choice(FARMER_NOTES) if bst in ("BOOKED", "REJECTED", "COMPLETED") else ""
                Booking.objects.get_or_create(
                    customer=customer, farmer=farmer, listing=listing,
                    defaults={
                        "quantity_kg": qty,
                        "message": random.choice(BOOKING_MESSAGES),
                        "farmer_note": fnote,
                        "status": bst,
                    },
                )
        self.stdout.write(f"  + Bookings: {Booking.objects.count()} total")

        # ── Market Prices ─────────────────────────────────────────────────────
        for mp in MARKET_PRICES:
            MarketPrice.objects.get_or_create(
                crop_name=mp[0], market_name=mp[1], state=mp[2],
                defaults={
                    "district": mp[3],
                    "price_per_quintal": Decimal(str(mp[4])),
                    "min_price": Decimal(str(mp[5])),
                    "max_price": Decimal(str(mp[6])),
                    "trend": mp[7],
                    "change_percent": mp[8],
                },
            )
        self.stdout.write(f"  + Market prices: {MarketPrice.objects.count()} records")

        # ── Disease Records ───────────────────────────────────────────────────
        all_crops = list(Crop.objects.filter(farm__in=farms))
        for idx, farmer in enumerate(farmer_users):
            for j in range(2):
                dr = DISEASE_RECORDS[(idx * 2 + j) % len(DISEASE_RECORDS)]
                crop = all_crops[(idx * 2 + j) % len(all_crops)] if all_crops else None
                DiseaseRecord.objects.get_or_create(
                    farmer=farmer, disease_name=dr[0],
                    defaults={
                        "crop": crop,
                        "image": "disease_scans/images.jpg",
                        "severity": dr[1],
                        "confidence": dr[2],
                        "symptoms": dr[3],
                        "organic_treatment": dr[4],
                        "chemical_treatment": dr[5],
                        "scan_status": "COMPLETED",
                    },
                )
        self.stdout.write(f"  + Disease records: {DiseaseRecord.objects.count()} total")

        # ── Messages ──────────────────────────────────────────────────────────
        for idx, (farmer, customer) in enumerate(zip(farmer_users, customer_users)):
            pair = MESSAGES[idx % len(MESSAGES)]
            Message.objects.get_or_create(
                sender=customer, recipient=farmer, body=pair[0],
            )
            Message.objects.get_or_create(
                sender=farmer, recipient=customer, body=pair[1],
            )
        # Cross messages — customers messaging other farmers
        for idx, customer in enumerate(customer_users):
            other_farmer = farmer_users[(idx + 2) % len(farmer_users)]
            extra = MESSAGES[(idx + 5) % len(MESSAGES)]
            Message.objects.get_or_create(
                sender=customer, recipient=other_farmer, body=extra[0],
            )
            Message.objects.get_or_create(
                sender=other_farmer, recipient=customer, body=extra[1],
            )
        self.stdout.write(f"  + Messages: {Message.objects.count()} total")

        # ── Notifications ─────────────────────────────────────────────────────
        for farmer in farmer_users:
            for i, (title, ntype, msg) in enumerate(NOTIFICATION_DEFS):
                Notification.objects.get_or_create(
                    user=farmer, title=title,
                    defaults={
                        "message": msg,
                        "notification_type": ntype,
                        "is_read": i > 2,  # first 3 unread
                    },
                )
        for customer in customer_users:
            for i, (title, ntype, msg) in enumerate(NOTIFICATION_DEFS[4:]):
                Notification.objects.get_or_create(
                    user=customer, title=title,
                    defaults={
                        "message": msg,
                        "notification_type": ntype,
                        "is_read": i > 0,
                    },
                )
        self.stdout.write(f"  + Notifications: {Notification.objects.count()} total")

        # ── Summary ───────────────────────────────────────────────────────────
        self.stdout.write(self.style.SUCCESS("\n✓ Seed complete!"))
        self.stdout.write(self.style.SUCCESS(f"  Farmers       : {len(farmer_users)}"))
        self.stdout.write(self.style.SUCCESS(f"  Customers     : {len(customer_users)}"))
        self.stdout.write(self.style.SUCCESS(f"  Farms         : {Farm.objects.count()}"))
        self.stdout.write(self.style.SUCCESS(f"  Crops         : {Crop.objects.count()}"))
        self.stdout.write(self.style.SUCCESS(f"  Listings      : {MarketListing.objects.count()}"))
        self.stdout.write(self.style.SUCCESS(f"  Orders        : {Order.objects.count()}"))
        self.stdout.write(self.style.SUCCESS(f"  Bookings      : {Booking.objects.count()}"))
        self.stdout.write(self.style.SUCCESS(f"  Market Prices : {MarketPrice.objects.count()}"))
        self.stdout.write(self.style.SUCCESS(f"  Disease Scans : {DiseaseRecord.objects.count()}"))
        self.stdout.write(self.style.SUCCESS(f"  Messages      : {Message.objects.count()}"))
        self.stdout.write(self.style.SUCCESS(f"  Notifications : {Notification.objects.count()}"))
