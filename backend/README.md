# CropX Backend

Django 5 + DRF + Channels backend for the CropX platform.

## Requirements

- Python 3.10 – 3.14
- Anaconda Python 3.13 with TensorFlow *(only needed for the disease scanner)*

## Setup

```bash
# 1. Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # macOS / Linux

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment variables
cp .env.example .env
# Open .env and fill in SECRET_KEY, GEMINI_API_KEY, OPENWEATHER_API_KEY, ANACONDA_PYTHON

# 4. Apply migrations
python manage.py migrate

# 5. Create a superuser (admin)
python manage.py createsuperuser

# 6. (Optional) Seed demo data
python manage.py seed_data

# 7. Start the development server
python manage.py runserver
```

API base URL: `http://127.0.0.1:8000/api/`  
Admin panel: `http://127.0.0.1:8000/admin/`

## Environment Variables

Copy `.env.example` to `.env` and fill in the values:

| Variable | Description |
|----------|-------------|
| `SECRET_KEY` | Django secret key — generate with `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"` |
| `DEBUG` | `True` for development, `False` for production |
| `GEMINI_API_KEY` | Google Gemini API key — get free key at [aistudio.google.com](https://aistudio.google.com/app/apikey) |
| `OPENWEATHER_API_KEY` | OpenWeatherMap key — get free key at [openweathermap.org](https://openweathermap.org/api) |
| `ANACONDA_PYTHON` | Full path to Anaconda Python binary with TensorFlow installed |

## Project Layout

```
backend/
├── authentication/       # Custom User model, JWT views, email verification
│   ├── models.py         # User with role (FARMER / CUSTOMER / ADMIN)
│   ├── serializers.py
│   ├── views.py          # Login, Register, Refresh, Logout, Me, VerifyEmail
│   └── urls.py
├── farms/                # Core business logic
│   ├── models.py         # Farm, Crop, MarketListing, Order, Booking, Message, Notification, …
│   ├── serializers.py
│   ├── views.py          # All API views including AI, Weather, Dashboard stats
│   ├── urls.py
│   ├── signals.py        # Auto-notifications on Order/Booking/Message save
│   ├── notifications.py  # send_notification() — DB persist + WebSocket push
│   ├── consumers.py      # Channels WebSocket consumer (per-user notification group)
│   ├── middleware.py     # JWT auth middleware for WebSocket connections
│   ├── routing.py        # WebSocket URL routing
│   ├── admin.py          # Django admin registrations
│   └── management/commands/seed_data.py
├── model/                # Local ML inference
│   ├── predictor.py      # Subprocess runner — calls infer.py via Anaconda Python
│   ├── infer.py          # TF/Keras inference script (run in Anaconda subprocess)
│   ├── class_indices.json # 107 class names
│   └── crop_disease_model.keras/  # Model weights (MobileNetV2)
├── cropx_backend/
│   ├── settings.py
│   ├── urls.py
│   ├── asgi.py           # Channels ASGI application
│   └── wsgi.py
├── manage.py
├── requirements.txt
└── .env.example
```

## Key API Endpoints

All endpoints require `Authorization: Bearer <access_token>` unless noted.

### Auth (no token required)
```
POST /api/auth/register/
POST /api/auth/login/
POST /api/auth/refresh/
GET  /api/auth/verify-email/<uidb64>/<token>/
```

### Farmer endpoints
```
GET/POST   /api/farms/
GET/POST   /api/crops/
GET/POST   /api/listings/
GET/POST   /api/orders/          PATCH /api/orders/<id>/  (advance status)
GET/POST   /api/bookings/        PATCH /api/bookings/<id>/  (confirm/reject)
GET/POST   /api/disease/scans/
GET        /api/dashboard/stats/
POST       /api/ai/scan/         (multipart image upload → local model)
GET        /api/weather/?city=<name>
GET        /api/market/highlights/
```

### Customer endpoints
```
GET        /api/listings/?status=ACTIVE
POST       /api/orders/
GET        /api/bookings/
POST       /api/bookings/
POST       /api/ai/scan/         (same local model as farmer)
GET        /api/ai/insights/
GET        /api/dashboard/customer-stats/
```

### Shared
```
GET/POST   /api/messages/
GET/POST   /api/messages/?with=<user_id>
GET        /api/notifications/
POST       /api/notifications/read/
POST       /api/notifications/<id>/read/
```

### WebSocket
```
ws://localhost:8000/ws/notifications/?token=<access_token>
```

## ML Model

The disease scanner runs as a **subprocess** to work around Python version constraints (Django runs on Python 3.14; TensorFlow requires Python ≤ 3.13).

```
Django request
    └── CropScanView.post()
            └── model.predictor.predict(image_bytes)
                    └── subprocess: anaconda_python infer.py <tmp_image_path>
                            └── TF model → JSON result → stdout
                    └── parse JSON → return to Django → return to frontend
```

To set up the Anaconda environment:
```bash
conda create -n cropx-ml python=3.13
conda activate cropx-ml
pip install tensorflow keras numpy pillow
```

Then set `ANACONDA_PYTHON=C:\Users\YourName\anaconda3\envs\cropx-ml\python.exe` in `.env`.

## Running in Production

```bash
# Collect static files
python manage.py collectstatic --no-input

# Run ASGI server (supports both HTTP and WebSocket)
daphne -b 0.0.0.0 -p 8000 cropx_backend.asgi:application

# Or split: Gunicorn for HTTP, Daphne for WebSocket behind nginx
```

For production also:
- Set `DEBUG=False`
- Set a strong `SECRET_KEY`
- Switch `CHANNEL_LAYERS` to Redis: `pip install channels-redis`
- Switch database to PostgreSQL
- Set `CORS_ALLOWED_ORIGINS` to your frontend domain
