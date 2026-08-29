# CropX — Tech Stack

## Backend

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Framework | Django | 5.2 | Core web framework |
| API | Django REST Framework | 3.16 | RESTful API |
| Auth | SimpleJWT | 5.5 | JWT access + refresh tokens |
| WebSockets | Django Channels + Daphne | 4.2 | Real-time notifications |
| CORS | django-cors-headers | 4.9 | Frontend ↔ Backend cross-origin |
| Filtering | django-filter | 25.2 | Query param filtering on list endpoints |
| AI Insights | Google Gemini 1.5 Flash | — | Weather farming tips, agronomic insights |
| ML Model | TensorFlow / Keras (MobileNetV2) | — | Local 107-class crop disease classifier |
| ML Runtime | Anaconda Python 3.13 | — | Subprocess environment with TensorFlow |
| Weather | OpenWeatherMap API | 2.5 | Current weather + 5-day forecast |
| Database | SQLite (dev) / PostgreSQL (prod) | — | Primary data store |
| Static files | WhiteNoise | 6.11 | Static file serving in production |
| WSGI/ASGI | Gunicorn + Daphne | — | Production servers |

## Frontend

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Framework | React | 18.3 | UI framework |
| Build tool | Vite | 8.2 | Dev server + bundler |
| UI Library | MUI (Material UI) | v9 | Component library + theming |
| State | Redux Toolkit | 2.12 | Global auth state |
| Routing | React Router DOM | 7.11 | Client-side routing |
| Forms | React Hook Form | 7.83 | Form state + validation |
| HTTP | Axios | 1.18 | API client with interceptors |
| Charts | Recharts | 2.12 | Sparklines, area charts |
| Animation | Framer Motion | 12.43 | Page and component animations |
| Toasts | React Toastify | 11.1 | User feedback notifications |
| AI Chatbot | Groq API (Llama 3.3 70B) | — | CropX AI agricultural assistant |
| AI Insights | Groq API → Gemini fallback | — | Personalised dashboard insights |
| Linting | OxLint | 1.71 | Fast Rust-based linter |

## Infrastructure (Development)

| Tool | Purpose |
|------|---------|
| SQLite | Default database (zero config) |
| In-memory channel layer | WebSocket message broker (no Redis needed in dev) |
| Vite proxy | Routes `/api` requests to Django in dev |

## Infrastructure (Production-ready)

| Tool | Purpose |
|------|---------|
| PostgreSQL | Production database |
| Redis + `channels-redis` | Production WebSocket channel layer |
| Gunicorn | WSGI server for sync views |
| Daphne | ASGI server for WebSocket connections |
| WhiteNoise | Serve static files without a CDN |
| HTTPS / CORS | Restrict `ALLOWED_HOSTS` + `CORS_ALLOWED_ORIGINS` |

## ML Model

| Detail | Value |
|--------|-------|
| Architecture | MobileNetV2 Sequential |
| Input | 224 × 224 RGB image |
| Output | 107-class softmax |
| Crops covered | Tomato, Potato, Rice, Wheat, Corn, Apple, Grape, Cherry, Coffee, Sugarcane, Cassava, Watermelon, Blueberry, Strawberry, and more |
| Inference | Anaconda Python subprocess (TensorFlow 2.x) |
| Model file | `backend/model/crop_disease_model.keras/` |
| Class list | `backend/model/class_indices.json` |
