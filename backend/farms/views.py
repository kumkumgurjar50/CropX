from datetime import timedelta

from rest_framework import generics, status, filters
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django_filters.rest_framework import DjangoFilterBackend
from .models import Farm, Crop, MarketListing, Order, DiseaseRecord, MarketPrice, Message, Notification, Fertilizer, FertilizerOrder
from .serializers import (
    FarmSerializer, CropSerializer, MarketListingSerializer,
    OrderSerializer, DiseaseRecordSerializer, MarketPriceSerializer,
    MessageSerializer, NotificationSerializer, FertilizerSerializer, FertilizerOrderSerializer
)
from .permissions import IsFarmer, IsOwner


# ── Farms ────────────────────────────────────────────────────────────────────
class FarmListCreateView(generics.ListCreateAPIView):
    serializer_class = FarmSerializer
    permission_classes = [IsAuthenticated, IsFarmer]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'district', 'state']
    ordering_fields = ['created_at', 'area_acres']

    def get_queryset(self):
        if self.request.user.role == 'ADMIN':
            return Farm.objects.all()
        return Farm.objects.filter(owner=self.request.user, is_active=True)


class FarmDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = FarmSerializer
    permission_classes = [IsAuthenticated, IsOwner]

    def get_queryset(self):
        return Farm.objects.filter(owner=self.request.user)


# ── Crops ────────────────────────────────────────────────────────────────────
class CropListCreateView(generics.ListCreateAPIView):
    serializer_class = CropSerializer
    permission_classes = [IsAuthenticated, IsFarmer]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['farm', 'current_stage', 'health_status', 'is_active']
    search_fields = ['name', 'variety']

    def get_queryset(self):
        return Crop.objects.filter(farm__owner=self.request.user)


class CropDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CropSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Crop.objects.filter(farm__owner=self.request.user)


# ── Market Listings ──────────────────────────────────────────────────────────
class MarketListingListCreateView(generics.ListCreateAPIView):
    serializer_class = MarketListingSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'is_organic']
    search_fields = ['crop_name', 'variety']
    ordering_fields = ['price_per_kg', 'created_at']

    def get_queryset(self):
        user = self.request.user
        if user.role == 'FARMER':
            return MarketListing.objects.filter(farmer=user)
        return MarketListing.objects.filter(status='ACTIVE')


class MarketListingDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = MarketListingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return MarketListing.objects.filter(farmer=self.request.user)


# ── Orders ───────────────────────────────────────────────────────────────────
class OrderListCreateView(generics.ListCreateAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'payment_status']
    ordering_fields = ['created_at', 'total_price']

    def get_queryset(self):
        user = self.request.user
        if user.role == 'FARMER':
            return Order.objects.filter(farmer=user)
        elif user.role == 'CUSTOMER':
            return Order.objects.filter(customer=user)
        return Order.objects.all()


class OrderDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        from django.db.models import Q
        return Order.objects.filter(Q(farmer=user) | Q(customer=user))

    def update(self, request, *args, **kwargs):
        """Farmers advance status; customers cancel pending orders."""
        order = self.get_object()
        user  = request.user

        FARMER_TRANSITIONS = {
            'PENDING':    'ACCEPTED',
            'ACCEPTED':   'PACKED',
            'PACKED':     'IN_TRANSIT',
            'IN_TRANSIT': 'DELIVERED',
        }

        if user.role == 'FARMER' and order.farmer == user:
            new_status = request.data.get('status')
            if not new_status:
                return Response({'detail': 'status field is required.'}, status=status.HTTP_400_BAD_REQUEST)

            allowed_next = FARMER_TRANSITIONS.get(order.status)
            if new_status != allowed_next:
                return Response(
                    {'detail': f'Cannot move from {order.status} to {new_status}. Expected next: {allowed_next}'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            order.status = new_status
            order.save(update_fields=['status', 'updated_at'])
            return Response(OrderSerializer(order).data)

        if user.role == 'CUSTOMER' and order.customer == user:
            if request.data.get('status') == 'CANCELLED' and order.status == 'PENDING':
                order.status = 'CANCELLED'
                order.save(update_fields=['status', 'updated_at'])
                return Response(OrderSerializer(order).data)
            return Response(
                {'detail': 'Customers can only cancel pending orders.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response({'detail': 'Not allowed.'}, status=status.HTTP_403_FORBIDDEN)


# ── Disease Scanner ──────────────────────────────────────────────────────────
class DiseaseRecordListCreateView(generics.ListCreateAPIView):
    serializer_class = DiseaseRecordSerializer
    permission_classes = [IsAuthenticated, IsFarmer]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        return DiseaseRecord.objects.filter(farmer=self.request.user)


class DiseaseRecordDetailView(generics.RetrieveAPIView):
    serializer_class = DiseaseRecordSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return DiseaseRecord.objects.filter(farmer=self.request.user)


# ── Market Prices ────────────────────────────────────────────────────────────
class MarketPriceListView(generics.ListAPIView):
    serializer_class = MarketPriceSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['state', 'district', 'trend']
    search_fields = ['crop_name', 'market_name', 'state']

    def get_queryset(self):
        return MarketPrice.objects.all().order_by('-created_at')


class MarketPriceHighlightsView(APIView):
    """Returns 5-8 trending crops for the dashboard widget."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        import random
        from decimal import Decimal

        CROPS = [
            {'name': 'Wheat', 'emoji': '🌾'},
            {'name': 'Cotton', 'emoji': '🌿'},
            {'name': 'Rice', 'emoji': '🍚'},
            {'name': 'Tomato', 'emoji': '🍅'},
            {'name': 'Onion', 'emoji': '🧅'},
            {'name': 'Potato', 'emoji': '🥔'},
            {'name': 'Maize', 'emoji': '🌽'},
            {'name': 'Groundnut', 'emoji': '🥜'},
            {'name': 'Soybean', 'emoji': '🫘'},
            {'name': 'Bajra', 'emoji': '🌾'},
        ]
        MARKETS = [
            ('Azadpur Mandi', 'Delhi'), ('Vashi APMC', 'Maharashtra'),
            ('Koyambedu Market', 'Tamil Nadu'), ('Yeshwanthpur APMC', 'Karnataka'),
            ('Gultekdi Market', 'Maharashtra'), ('Sector 26 Chandigarh', 'Punjab'),
        ]
        BASE_PRICES = {
            'Wheat': 2200, 'Cotton': 6800, 'Rice': 2800, 'Tomato': 1500,
            'Onion': 1200, 'Potato': 900, 'Maize': 1800, 'Groundnut': 5200,
            'Soybean': 4100, 'Bajra': 2000,
        }

        selected = random.sample(CROPS, 6)
        data = []
        for crop in selected:
            base = BASE_PRICES[crop['name']]
            change_pct = round(random.uniform(-8, 12), 2)
            price = round(base * (1 + change_pct / 100))
            market = random.choice(MARKETS)
            trend = 'UP' if change_pct > 0.5 else ('DOWN' if change_pct < -0.5 else 'STABLE')
            sparkline = [round(base * (1 + random.uniform(-5, 5) / 100)) for _ in range(7)]
            sparkline[-1] = price
            data.append({
                'id': crop['name'].lower(),
                'name': crop['name'],
                'emoji': crop['emoji'],
                'price_per_quintal': price,
                'change_percent': change_pct,
                'trend': trend,
                'market_name': market[0],
                'state': market[1],
                'sparkline': sparkline,
            })

        return Response({'results': data})


# ── Messages ─────────────────────────────────────────────────────────────────
class MessageThreadView(APIView):
    """
    GET  /api/messages/?with=<user_id>  — fetch conversation with a specific user
    POST /api/messages/                 — send a message  { recipient, body }
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        other_id = request.query_params.get('with')
        if not other_id:
            # Return list of unique conversation partners
            from django.db.models import Q, Max
            partners = (
                Message.objects
                .filter(Q(sender=request.user) | Q(recipient=request.user))
                .values('sender', 'recipient')
            )
            seen = set()
            result = []
            for p in partners:
                other = p['recipient'] if p['sender'] == request.user.id else p['sender']
                if other not in seen:
                    seen.add(other)
                    result.append(other)
            from authentication.models import User
            from authentication.serializers import UserSerializer
            # Exclude users who have set profile_visible=False (unless it's yourself)
            from django.db.models import Q
            users = (
                User.objects
                .filter(pk__in=result)
                .select_related('preferences')
                .exclude(Q(preferences__profile_visible=False) & ~Q(pk=request.user.pk))
            )
            return Response(UserSerializer(users, many=True).data)

        from django.db.models import Q
        messages = Message.objects.filter(
            Q(sender=request.user, recipient_id=other_id) |
            Q(sender_id=other_id, recipient=request.user)
        ).order_by('created_at')
        # Mark incoming as read
        messages.filter(recipient=request.user, is_read=False).update(is_read=True)
        return Response(MessageSerializer(messages, many=True).data)

    def post(self, request):
        serializer = MessageSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


# ── Notifications ────────────────────────────────────────────────────────────
class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)


class NotificationMarkReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk=None):
        if pk:
            Notification.objects.filter(pk=pk, user=request.user).update(is_read=True)
        else:
            Notification.objects.filter(user=request.user).update(is_read=True)
        return Response({'status': 'ok'})


class NotificationDeleteView(APIView):
    """
    DELETE /api/notifications/<pk>/   — delete a single notification
    DELETE /api/notifications/        — delete all notifications for the user
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk=None):
        if pk:
            deleted, _ = Notification.objects.filter(pk=pk, user=request.user).delete()
            if not deleted:
                return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        else:
            Notification.objects.filter(user=request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ── Customer Dashboard Stats ──────────────────────────────────────────────────
class CustomerDashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        bookings = Booking.objects.filter(customer=user)
        crop_spent = sum(b.quantity_kg * (b.listing.price_per_kg if b.listing else 0) for b in bookings)
        
        orders = Order.objects.filter(customer=user)
        order_spent = sum(o.total_price for o in orders.filter(status='DELIVERED'))

        fert_orders = FertilizerOrder.objects.filter(user=user)
        fert_spent = sum(fo.total_price for fo in fert_orders)

        total_spent = float(crop_spent + order_spent + fert_spent)
        active_listings = MarketListing.objects.filter(status='ACTIVE').count()

        return Response({
            'total_orders': bookings.count() + orders.count(),
            'active_orders': bookings.filter(status__in=['PENDING', 'BOOKED']).count(),
            'delivered_orders': bookings.filter(status='COMPLETED').count(),
            'total_spent': total_spent,
            'fertilizer_spent': float(fert_spent),
            'available_listings': active_listings,
        })


# ── Dashboard Stats ──────────────────────────────────────────────────────────
class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated, IsFarmer]

    def get(self, request):
        user = request.user
        farms = Farm.objects.filter(owner=user, is_active=True)
        crops = Crop.objects.filter(farm__owner=user, is_active=True)
        
        # Calculate revenue from bookings and legacy orders
        farmer_bookings = Booking.objects.filter(farmer=user, status__in=['BOOKED', 'COMPLETED'])
        booking_revenue = sum(b.quantity_kg * (b.listing.price_per_kg if b.listing else 0) for b in farmer_bookings)
        
        legacy_orders = Order.objects.filter(farmer=user)
        order_revenue = sum(o.total_price for o in legacy_orders.filter(status='DELIVERED'))
        
        total_revenue = float(booking_revenue + order_revenue)

        # Calculate fertilizer expenses
        fert_orders = FertilizerOrder.objects.filter(user=user)
        fertilizer_expense = float(sum(fo.total_price for fo in fert_orders))

        # Net Income = Total Revenue - Fertilizer Expenses
        net_income = total_revenue - fertilizer_expense
        today_income = total_revenue * 0.15 if total_revenue > 0 else 0

        pending_bookings = Booking.objects.filter(farmer=user, status='PENDING').count()
        pending_orders = legacy_orders.filter(status='PENDING').count()
        unread_notifications = Notification.objects.filter(user=user, is_read=False).count()

        return Response({
            'farms_count': farms.count(),
            'active_crops': crops.count(),
            'total_orders': farmer_bookings.count() + legacy_orders.count(),
            'pending_deliveries': pending_bookings + pending_orders,
            'total_revenue': total_revenue,
            'fertilizer_expense': fertilizer_expense,
            'net_income': net_income,
            'today_income': today_income,
            'farm_health_score': 88,
            'weather_risk': 'LOW',
            'market_opportunity': 82,
            'unread_notifications': unread_notifications,
        })


# ═══════════════════════════════════════════════════════════════════════════════
# AI VIEWS — Gemini + OpenWeatherMap
# ═══════════════════════════════════════════════════════════════════════════════

def _gemini_text(prompt: str) -> str:
    """Call Gemini 1.5-flash text model. Returns the text response."""
    import google.generativeai as genai
    from django.conf import settings
    genai.configure(api_key=settings.GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-1.5-flash')
    response = model.generate_content(prompt)
    return response.text.strip()


# ── Crop Scanner — local MobileNetV2 model (107 classes) ────────────────────
class CropScanView(APIView):
    """
    POST /api/ai/scan/
    Accepts multipart/form-data with an 'image' field (JPEG/PNG/WebP).
    Runs inference through the local CropX MobileNetV2 model via predictor.py
    (subprocess to Anaconda Python which has TensorFlow/Keras installed).
    Returns disease name, severity, confidence, treatments, and a market price hint.
    Used by both the Farmer Disease Scanner and the Customer Crop Scanner.
    """
    permission_classes = [IsAuthenticated]
    parser_classes     = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        import sys, base64, random
        from django.conf import settings

        # ── 1. Get raw image bytes (multipart upload or base64 JSON) ─────────
        image_bytes = None

        if 'image' in request.FILES:
            image_bytes = request.FILES['image'].read()
        elif request.data.get('image_base64'):
            try:
                image_bytes = base64.b64decode(request.data['image_base64'])
            except Exception:
                return Response(
                    {'detail': 'Invalid base64 image.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            return Response(
                {'detail': 'Provide an image file (multipart) or image_base64 field.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ── 2. Run local model inference via predictor subprocess ─────────────
        try:
            if str(settings.BASE_DIR) not in sys.path:
                sys.path.insert(0, str(settings.BASE_DIR))
            from model.predictor import predict
            result = predict(image_bytes)
        except Exception as e:
            return Response(
                {'detail': f'Model inference failed: {str(e)}'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        # ── 3. Attach market price for the detected crop ──────────────────────
        BASE_PRICES = {
            'wheat':      2200,
            'cotton':     6800,
            'rice':       2800,
            'tomato':     1500,
            'onion':      1200,
            'potato':      900,
            'maize':      1800,
            'corn':       1800,
            'groundnut':  5200,
            'soybean':    4100,
            'bajra':      2000,
            'mango':      4000,
            'apple':      8000,
            'grape':      6000,
            'cherry':     9000,
            'peach':      5500,
            'strawberry': 7000,
            'blueberry':  8500,
            'orange':     3500,
            'coffee':    12000,
            'sugercane':  3200,
            'cassava':    1400,
            'watermelon': 1800,
        }
        MARKETS = [
            'Azadpur Mandi, Delhi',
            'Lasalgaon APMC, Maharashtra',
            'Koyambedu, Tamil Nadu',
            'Yeshwanthpur APMC, Karnataka',
            'Vashi APMC, Maharashtra',
        ]

        crop_lower = (result.get('crop_name') or '').lower()
        base_price = next((v for k, v in BASE_PRICES.items() if k in crop_lower), None)

        if base_price:
            change = round(random.uniform(-8, 12), 1)
            price  = round(base_price * (1 + change / 100))
            result['market_price'] = {
                'price_per_quintal': price,
                'change_percent':    change,
                'market':            random.choice(MARKETS),
                'trend':             'UP' if change > 0.5 else ('DOWN' if change < -0.5 else 'STABLE'),
            }
        else:
            result['market_price'] = None

        return Response(result, status=status.HTTP_200_OK)


# ── AI Insights for Customer Dashboard ───────────────────────────────────────
class AIInsightsView(APIView):
    """
    GET /api/ai/insights/
    Generates personalised agronomic insights for the logged-in customer
    based on their order history and available listings.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # Gather context
        orders = Order.objects.filter(customer=user).order_by('-created_at')[:10]
        active_listings = MarketListing.objects.filter(status='ACTIVE').order_by('-created_at')[:8]

        order_summary = ', '.join(
            f"{o.crop_name} ({o.quantity_kg}kg at ₹{o.price_per_kg}/kg)"
            for o in orders
        ) or 'No orders yet'

        listing_summary = ', '.join(
            f"{l.crop_name} at ₹{l.price_per_kg}/kg"
            for l in active_listings
        ) or 'No active listings'

        prompt = f"""You are an expert agricultural market analyst for India.
A customer on the CropX platform has the following profile:
- Recent orders: {order_summary}
- Currently available crops in the marketplace: {listing_summary}

Generate exactly 5 personalised, actionable agronomic and market insights for this customer.
Each insight should be practical, data-driven, and specific to Indian agriculture.

Return ONLY a JSON array (no markdown, no code fences) of 5 objects:
[
  {{
    "icon": "<single emoji>",
    "title": "Short title (max 8 words)",
    "text": "Detailed actionable insight (2-3 sentences)",
    "type": "market|weather|crop|health|price",
    "color": "<hex color code matching the type>"
  }}
]

Use these colors: market=#22c55e, weather=#3b82f6, crop=#2E7D32, health=#f59e0b, price=#8b5cf6"""

        try:
            import json, re
            raw = _gemini_text(prompt)
            raw = re.sub(r'^```(?:json)?\s*', '', raw)
            raw = re.sub(r'\s*```$', '', raw)
            insights = json.loads(raw)
            return Response({'insights': insights[:5]}, status=status.HTTP_200_OK)
        except Exception as e:
            # Return safe fallback so the dashboard never breaks
            return Response({
                'insights': [
                    {'icon': '📈', 'title': 'Market prices are active', 'text': 'Check the marketplace for fresh listings from verified farmers near you.', 'type': 'market', 'color': '#22c55e'},
                    {'icon': '🌾', 'title': 'Good time to stock wheat', 'text': 'Wheat prices historically dip after harvest season. Consider placing an order now.', 'type': 'price', 'color': '#8b5cf6'},
                    {'icon': '💧', 'title': 'Irrigation advisory', 'text': 'Monitor water-intensive crops like rice and sugarcane for consistent moisture during growth stage.', 'type': 'crop', 'color': '#2E7D32'},
                    {'icon': '🍅', 'title': 'Tomato demand is rising', 'text': 'Festival season demand for tomatoes is increasing. Source from multiple farmers to secure supply.', 'type': 'market', 'color': '#22c55e'},
                    {'icon': '🌤️', 'title': 'Check local weather', 'text': 'Weather conditions affect crop availability. Plan purchases accordingly to avoid supply disruptions.', 'type': 'weather', 'color': '#3b82f6'},
                ],
                'source': 'fallback',
            }, status=status.HTTP_200_OK)


# ── Weather (OpenWeatherMap + Gemini farming advice) ─────────────────────────
class WeatherView(APIView):
    """
    GET /api/weather/?city=<city_name>&lat=<lat>&lon=<lon>
    Returns current weather + 5-day forecast + AI farming advice.
    Defaults to Ahmedabad if no location provided.
    """
    permission_classes = [IsAuthenticated]

    def _gemini_weather(self, request, city, lat, lon):
        """Generate realistic weather data for the city using Gemini when no OWM key is set."""
        import json, re, random
        from datetime import datetime, timedelta

        location = city if city else f"coordinates {lat},{lon}"
        today = datetime.now()
        DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

        prompt = f"""You are a weather service API. Generate realistic current weather and a 7-day forecast
for {location}, India (or the closest Indian city if coordinates).
Consider the current season (today is {today.strftime('%B %d, %Y')}) and typical weather patterns for that region.

Return ONLY a valid JSON object (no markdown, no code fences) in exactly this format:
{{
  "current": {{
    "city": "<city name>",
    "country": "IN",
    "temp": <integer celsius>,
    "feels_like": <integer celsius>,
    "temp_min": <integer celsius>,
    "temp_max": <integer celsius>,
    "humidity": <integer 0-100>,
    "wind_speed": <float km/h>,
    "description": "<weather description>",
    "icon_code": "<one of: 01d 02d 03d 04d 09d 10d 11d 13d 50d>",
    "visibility": <float km>,
    "pressure": <integer hPa>,
    "clouds": <integer 0-100>
  }},
  "forecast": [
    {{
      "date": "YYYY-MM-DD",
      "day": "<day name>",
      "temp_max": <integer>,
      "temp_min": <integer>,
      "humidity": <integer>,
      "rain_prob": <integer 0-100>,
      "wind_speed": <float>,
      "description": "<description>",
      "icon_code": "<icon code>",
      "ai_advice": "<1-2 sentence practical farming advice specific to the weather>"
    }}
  ]
}}
The forecast array must have exactly 7 entries starting from today ({today.strftime('%Y-%m-%d')}).
Days: {', '.join(DAYS[((today + timedelta(days=i)).weekday())] + ' ' + (today + timedelta(days=i)).strftime('%Y-%m-%d') for i in range(7))}.
Make the farming advice specific and practical for Indian farmers."""

        try:
            raw = _gemini_text(prompt)
            raw = re.sub(r'^```(?:json)?\s*', '', raw.strip())
            raw = re.sub(r'\s*```$', '', raw)
            data = json.loads(raw)
            if 'current' not in data or 'forecast' not in data:
                raise ValueError('Invalid structure from Gemini')
            data['gemini_weather'] = True
            return Response(data, status=status.HTTP_200_OK)

        except Exception:
            # Last resort: structured random data
            import random as rnd
            forecast = []
            for i in range(7):
                d = today + timedelta(days=i)
                forecast.append({
                    'date': d.strftime('%Y-%m-%d'),
                    'day': DAYS[d.weekday()],
                    'temp_max': rnd.randint(28, 38),
                    'temp_min': rnd.randint(18, 26),
                    'humidity': rnd.randint(50, 85),
                    'rain_prob': rnd.randint(5, 55),
                    'wind_speed': round(rnd.uniform(8, 22), 1),
                    'description': rnd.choice(['Partly Cloudy', 'Sunny', 'Overcast', 'Light Rain', 'Clear Sky']),
                    'icon_code': rnd.choice(['01d', '02d', '03d', '10d']),
                    'ai_advice': [
                        'Good conditions for field operations today.',
                        'Monitor soil moisture — temperatures are rising.',
                        'Ideal morning to apply foliar fertilizers before 10am.',
                        'High humidity — inspect crops for fungal infections.',
                        'Light rain expected — delay pesticide application.',
                        'Great day for crop harvesting and post-harvest drying.',
                        'Windy conditions — avoid spraying chemicals today.',
                    ][i],
                })
            return Response({
                'current': {
                    'city': city or 'India', 'country': 'IN',
                    'temp': rnd.randint(28, 35), 'feels_like': rnd.randint(30, 38),
                    'temp_min': rnd.randint(20, 25), 'temp_max': rnd.randint(32, 38),
                    'humidity': rnd.randint(55, 78), 'wind_speed': round(rnd.uniform(10, 20), 1),
                    'description': 'Partly Cloudy', 'icon_code': '02d',
                    'visibility': 10.0, 'pressure': 1012, 'clouds': rnd.randint(20, 55),
                },
                'forecast': forecast,
                'mock': True,
            }, status=status.HTTP_200_OK)

    def get(self, request):
        import requests as req_lib
        from django.conf import settings

        city = request.query_params.get('city', 'Ahmedabad')
        lat = request.query_params.get('lat')
        lon = request.query_params.get('lon')
        api_key = getattr(settings, 'OPENWEATHER_API_KEY', '').strip()

        # ── Guard: use Gemini to generate realistic weather when no OWM key ────
        if not api_key:
            return self._gemini_weather(request, city, lat, lon)

        try:
            # Current weather
            if lat and lon:
                current_url = f'https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={api_key}&units=metric'
                forecast_url = f'https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={api_key}&units=metric'
            else:
                current_url = f'https://api.openweathermap.org/data/2.5/weather?q={city}&appid={api_key}&units=metric'
                forecast_url = f'https://api.openweathermap.org/data/2.5/forecast?q={city}&appid={api_key}&units=metric'

            current_resp = req_lib.get(current_url, timeout=8)
            current_resp.raise_for_status()
            current = current_resp.json()

            forecast_resp = req_lib.get(forecast_url, timeout=8)
            forecast_resp.raise_for_status()
            forecast_raw = forecast_resp.json()

            # Parse current weather
            weather_now = {
                'city': current.get('name', city),
                'country': current.get('sys', {}).get('country', ''),
                'temp': round(current['main']['temp']),
                'feels_like': round(current['main']['feels_like']),
                'temp_min': round(current['main']['temp_min']),
                'temp_max': round(current['main']['temp_max']),
                'humidity': current['main']['humidity'],
                'wind_speed': round(current.get('wind', {}).get('speed', 0) * 3.6, 1),  # m/s → km/h
                'description': current['weather'][0]['description'].title(),
                'icon_code': current['weather'][0]['icon'],
                'uv_index': 0,  # Requires separate UV endpoint
                'visibility': round(current.get('visibility', 10000) / 1000, 1),
                'pressure': current['main']['pressure'],
                'clouds': current.get('clouds', {}).get('all', 0),
            }

            # Parse 5-day forecast — pick one reading per day (noon)
            from collections import defaultdict
            from datetime import datetime
            day_data = defaultdict(list)
            for item in forecast_raw.get('list', []):
                dt = datetime.fromtimestamp(item['dt'])
                day_data[dt.strftime('%Y-%m-%d')].append(item)

            daily_forecast = []
            for date_str, items in sorted(day_data.items())[:7]:
                # Pick midday reading
                midday = min(items, key=lambda x: abs(datetime.fromtimestamp(x['dt']).hour - 12))
                daily_forecast.append({
                    'date': date_str,
                    'day': datetime.strptime(date_str, '%Y-%m-%d').strftime('%A'),
                    'temp_max': round(max(i['main']['temp_max'] for i in items)),
                    'temp_min': round(min(i['main']['temp_min'] for i in items)),
                    'humidity': round(sum(i['main']['humidity'] for i in items) / len(items)),
                    'rain_prob': round(max(i.get('pop', 0) for i in items) * 100),
                    'wind_speed': round(midday.get('wind', {}).get('speed', 0) * 3.6, 1),
                    'description': midday['weather'][0]['description'].title(),
                    'icon_code': midday['weather'][0]['icon'],
                })

            # Generate AI farming advice with Gemini
            try:
                advice_prompt = f"""You are an agricultural advisor in India.
Current weather: {weather_now['temp']}°C, {weather_now['description']}, humidity {weather_now['humidity']}%, wind {weather_now['wind_speed']} km/h.
7-day forecast summary: {', '.join(f"{d['day']}: {d['temp_max']}°C high, {d['rain_prob']}% rain" for d in daily_forecast[:7])}

Generate exactly 7 short farming advice tips, one per day.
Return ONLY a JSON array of 7 strings. Each string must be 1-2 sentences of practical advice.
Example: ["Good day for spraying pesticides before 10am.", "Rain expected, delay fertilizer application."]"""

                import json, re
                raw = _gemini_text(advice_prompt)
                raw = re.sub(r'^```(?:json)?\s*', '', raw)
                raw = re.sub(r'\s*```$', '', raw)
                advice_list = json.loads(raw)
            except Exception:
                advice_list = [
                    'Monitor crop moisture levels regularly.',
                    'Ideal conditions for field operations this morning.',
                    'Check for pest activity after rain.',
                    'High temperature — increase irrigation frequency.',
                    'Good day for harvesting mature crops.',
                    'Apply organic mulch to retain soil moisture.',
                    'Inspect crops for signs of fungal infection after humid conditions.',
                ]

            # Attach advice to each day
            for i, day in enumerate(daily_forecast):
                day['ai_advice'] = advice_list[i] if i < len(advice_list) else 'Monitor your crops and adjust irrigation as needed.'

            return Response({
                'current': weather_now,
                'forecast': daily_forecast,
            }, status=status.HTTP_200_OK)

        except req_lib.exceptions.HTTPError as e:
            if '401' in str(e):
                # Key not yet activated (new keys take up to 2h) — use Gemini fallback
                return self._gemini_weather(request, city, lat, lon)
            if '404' in str(e):
                return Response({'detail': f'City "{city}" not found. Try a different city name.'}, status=status.HTTP_404_NOT_FOUND)
            return Response({'detail': f'Weather service error: {str(e)}'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as e:
            return Response({'detail': f'Weather fetch failed: {str(e)}'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)


# ═══════════════════════════════════════════════════════════════════════════════
# BOOKING VIEWS (Step 5)
# ═══════════════════════════════════════════════════════════════════════════════
from .models import Booking
from .serializers import BookingSerializer


class BookingListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/bookings/         — list bookings for the current user
    POST /api/bookings/         — customer creates a booking request
    """
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status']

    def get_queryset(self):
        user = self.request.user
        if user.role == 'CUSTOMER':
            return Booking.objects.filter(customer=user)
        elif user.role == 'FARMER':
            return Booking.objects.filter(farmer=user)
        return Booking.objects.all()


class BookingDetailView(generics.RetrieveUpdateAPIView):
    """
    GET   /api/bookings/<id>/   — get a single booking
    PATCH /api/bookings/<id>/   — farmer updates status (BOOKED / REJECTED)
    """
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'CUSTOMER':
            return Booking.objects.filter(customer=user)
        elif user.role == 'FARMER':
            return Booking.objects.filter(farmer=user)
        return Booking.objects.all()

    def update(self, request, *args, **kwargs):
        """
        Farmers can only update status and farmer_note.
        Customers can only cancel their own pending bookings.
        """
        booking = self.get_object()
        user = request.user

        if user.role == 'FARMER' and booking.farmer == user:
            allowed = {'status', 'farmer_note'}
            data = {k: v for k, v in request.data.items() if k in allowed}
            serializer = self.get_serializer(booking, data=data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)

        if user.role == 'CUSTOMER' and booking.customer == user:
            if booking.status == 'PENDING':
                booking.status = 'CANCELLED'
                booking.save(update_fields=['status'])
                return Response(BookingSerializer(booking).data)
            return Response({'detail': 'Can only cancel pending bookings.'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'detail': 'Not allowed.'}, status=status.HTTP_403_FORBIDDEN)


class PublicFarmListView(generics.ListAPIView):
    """
    GET /api/farms/public/   — all active farms visible to customers.
    Farms whose owner has profile_visible=False are excluded (respects
    the owner's Privacy → Profile visibility preference).
    """
    serializer_class = FarmSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'district', 'state', 'owner__name', 'owner__email']

    def get_queryset(self):
        # Admins see everything; everyone else sees only farms of visible farmers
        if self.request.user.role == 'ADMIN':
            return Farm.objects.filter(is_active=True).select_related('owner')
        return (
            Farm.objects
            .filter(is_active=True)
            .select_related('owner', 'owner__preferences')
            .exclude(owner__preferences__profile_visible=False)
        )


# ── Fertilizer Center ────────────────────────────────────────────────────────
class FertilizerListView(generics.ListCreateAPIView):
    """
    GET  /api/fertilizers/ — Public read catalog. Supports search and type filter.
    POST /api/fertilizers/ — Admin adds a new fertilizer product.
    """
    serializer_class   = FertilizerSerializer
    permission_classes = [IsAuthenticated]
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields   = ['fertilizer_type', 'is_active']
    search_fields      = ['name', 'brand', 'crops', 'prevents', 'fertilizer_type']
    ordering_fields    = ['price', 'rating', 'created_at']

    def get_queryset(self):
        if self.request.user.role == 'ADMIN':
            return Fertilizer.objects.all().order_by('-created_at')
        return Fertilizer.objects.filter(is_active=True).order_by('-created_at')

    def create(self, request, *args, **kwargs):
        if request.user.role != 'ADMIN':
            return Response({'detail': 'Only Admins can add new fertilizers.'}, status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)


class FertilizerDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/fertilizers/<id>/ — Product detail
    PATCH  /api/fertilizers/<id>/ — Admin updates fertilizer
    DELETE /api/fertilizers/<id>/ — Admin deletes fertilizer
    """
    serializer_class   = FertilizerSerializer
    permission_classes = [IsAuthenticated]
    queryset           = Fertilizer.objects.all()

    def update(self, request, *args, **kwargs):
        if request.user.role != 'ADMIN':
            return Response({'detail': 'Only Admins can edit fertilizers.'}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if request.user.role != 'ADMIN':
            return Response({'detail': 'Only Admins can delete fertilizers.'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)


class FertilizerOrderListCreateView(generics.ListCreateAPIView):
    """
    POST /api/fertilizers/orders/ — Customer/Farmer places a fertilizer order
    GET  /api/fertilizers/orders/ — View orders for logged in user
    """
    serializer_class   = FertilizerOrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return FertilizerOrder.objects.filter(user=self.request.user)



# ── Admin Dashboard Stats ─────────────────────────────────────────────────────
class AdminDashboardStatsView(APIView):
    """
    GET /api/dashboard/admin-stats/
    Returns platform-wide statistics for the admin dashboard.
    Restricted to users with role ADMIN.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from authentication.models import User as AuthUser
        from django.db.models import Sum, Count
        from django.utils import timezone

        if request.user.role != 'ADMIN':
            return Response({'detail': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)

        today = timezone.now().date()
        week_ago = today - timedelta(days=7)

        total_users = AuthUser.objects.count()
        total_farmers = AuthUser.objects.filter(role='FARMER').count()
        total_customers = AuthUser.objects.filter(role='CUSTOMER').count()
        verified_users = AuthUser.objects.filter(is_verified=True).count()
        new_users_week = AuthUser.objects.filter(created_at__date__gte=week_ago).count()

        total_farms = Farm.objects.count()
        active_farms = Farm.objects.filter(is_active=True).count()
        total_crops = Crop.objects.count()
        active_crops = Crop.objects.filter(is_active=True).count()

        total_listings = MarketListing.objects.count()
        active_listings = MarketListing.objects.filter(status='ACTIVE').count()

        all_orders = Order.objects.all()
        total_orders = all_orders.count()
        pending_orders = all_orders.filter(status='PENDING').count()
        delivered_orders = all_orders.filter(status='DELIVERED').count()
        revenue_result = all_orders.filter(payment_status='PAID').aggregate(total=Sum('total_price'))
        total_revenue = float(revenue_result['total'] or 0)
        orders_week = all_orders.filter(created_at__date__gte=week_ago).count()

        total_bookings = Booking.objects.count()
        pending_bookings = Booking.objects.filter(status='PENDING').count()

        unread_notifications = Notification.objects.filter(is_read=False).count()

        # Recent 5 orders for activity feed
        recent_orders = Order.objects.select_related('farmer', 'customer').order_by('-created_at')[:5]
        recent_order_data = [
            {
                'order_id': o.order_id,
                'crop_name': o.crop_name,
                'farmer': o.farmer.name,
                'customer': o.customer.name,
                'total_price': float(o.total_price),
                'status': o.status,
                'created_at': o.created_at.isoformat(),
            }
            for o in recent_orders
        ]

        # Recent 5 users
        recent_users = AuthUser.objects.order_by('-created_at')[:5]
        recent_user_data = [
            {
                'name': u.name,
                'email': u.email,
                'role': u.role,
                'is_verified': u.is_verified,
                'created_at': u.created_at.isoformat(),
            }
            for u in recent_users
        ]

        return Response({
            'users': {
                'total': total_users,
                'farmers': total_farmers,
                'customers': total_customers,
                'verified': verified_users,
                'new_this_week': new_users_week,
            },
            'farms': {
                'total': total_farms,
                'active': active_farms,
                'total_crops': total_crops,
                'active_crops': active_crops,
            },
            'marketplace': {
                'total_listings': total_listings,
                'active_listings': active_listings,
                'total_orders': total_orders,
                'pending_orders': pending_orders,
                'delivered_orders': delivered_orders,
                'orders_this_week': orders_week,
                'total_revenue': total_revenue,
            },
            'bookings': {
                'total': total_bookings,
                'pending': pending_bookings,
            },
            'notifications': {
                'unread': unread_notifications,
            },
            'recent_orders': recent_order_data,
            'recent_users': recent_user_data,
        })


class OrderPaymentView(APIView):
    """
    POST /api/orders/<id>/pay/
    Simulates a payment gateway resolving the transaction.
    Marks the payment_status as PAID.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            order = Order.objects.get(pk=pk)
            if request.user.role != 'CUSTOMER' or order.customer != request.user:
                return Response({'detail': 'Only the customer can pay for this order.'}, status=status.HTTP_403_FORBIDDEN)
        except Order.DoesNotExist:
            return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        if order.payment_status == 'PAID':
            return Response({'detail': 'Already paid.'}, status=status.HTTP_400_BAD_REQUEST)

        order.payment_status = 'PAID'
        order.save(update_fields=['payment_status', 'updated_at'])

        # Notify the farmer
        try:
            Notification.objects.create(
                user=order.farmer,
                title="Payment Received!",
                message=f"Customer {request.user.name} released the payment of ₹{order.total_price} for {order.crop_name}.",
                notification_type='ORDER'
            )
        except Exception:
            pass

        return Response({'message': 'Payment successful', 'payment_status': 'PAID'}, status=status.HTTP_200_OK)
