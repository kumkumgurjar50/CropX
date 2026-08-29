# CropX — Git Commit Guide

This project follows [Conventional Commits](https://www.conventionalcommits.org/).

## Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

- **type** — what kind of change (see table below)
- **scope** — what part of the codebase (e.g. `auth`, `farms`, `frontend`, `model`)
- **subject** — short imperative summary, no period, max 72 chars
- **body** — explain *what* and *why*, not *how* (wrap at 72 chars)
- **footer** — `BREAKING CHANGE:` notes or `Closes #issue`

## Types

| Type | When to use |
|------|-------------|
| `feat` | A new feature visible to users |
| `fix` | A bug fix |
| `refactor` | Code change that is neither a fix nor a feature |
| `perf` | Performance improvement |
| `style` | Formatting, whitespace — no logic change |
| `docs` | Documentation only |
| `chore` | Build scripts, CI, dependencies, config |
| `test` | Adding or updating tests |
| `revert` | Reverts a previous commit |

## Scopes

| Scope | Area |
|-------|------|
| `auth` | Authentication app (login, register, JWT) |
| `farms` | Farms Django app (models, views, serializers) |
| `model` | Local ML inference model |
| `ws` | WebSocket consumers, middleware, routing |
| `signals` | Django signals and notifications |
| `frontend` | General frontend change |
| `dashboard` | Farmer or customer dashboard |
| `messages` | Messaging feature |
| `notifications` | Notification bell and WebSocket hook |
| `scanner` | Disease / crop scanner |
| `marketplace` | Marketplace listings and orders |
| `bookings` | Booking requests feature |
| `weather` | Weather page |
| `ai` | AI insights or chatbot |
| `ui` | Visual / styling / layout |
| `deps` | Dependency updates |
| `config` | Project config, `.env`, `settings.py` |
| `docs` | Documentation files |

---

## Recommended Commit Sequence for This Project

Use these commits to build a clean, reviewable history on GitHub.

```bash
cd "c:\Users\Krish Patel\Desktop\x\CropX"
```

### Commit 1 — Project scaffold & configuration

```bash
git add .gitignore TECHSTACK.md README.md COMMITS.md
git add backend/.env.example backend/requirements.txt
git add frontend/.env.example frontend/package.json frontend/vite.config.js
git add frontend/index.html frontend/public/
git commit -m "chore(config): add project scaffold, gitignore, env examples, requirements"
```

### Commit 2 — Custom User model & JWT authentication

```bash
git add backend/authentication/
git add backend/cropx_backend/
git add backend/manage.py
git commit -m "feat(auth): custom User model with roles, JWT login/register/refresh/logout, email verification"
```

### Commit 3 — Core Django models

```bash
git add backend/farms/models.py
git add backend/farms/migrations/
git commit -m "feat(farms): add Farm, Crop, MarketListing, Order, Booking, Message, Notification, DiseaseRecord models"
```

### Commit 4 — REST API views, serializers, permissions

```bash
git add backend/farms/serializers.py
git add backend/farms/views.py
git add backend/farms/urls.py
git add backend/farms/permissions.py
git add backend/farms/admin.py
git commit -m "feat(farms): REST API for farms, crops, listings, orders, bookings, messages, notifications"
```

### Commit 5 — AI, weather, and dashboard endpoints

```bash
git add backend/farms/views.py
git commit -m "feat(ai): crop scanner (local model), Gemini insights, OpenWeatherMap weather endpoint, dashboard stats"
```

### Commit 6 — Local ML inference model

```bash
git add backend/model/
git commit -m "feat(model): add MobileNetV2 disease classifier — 107 classes, subprocess predictor, disease knowledge base"
```

### Commit 7 — Real-time WebSocket notifications

```bash
git add backend/farms/consumers.py
git add backend/farms/middleware.py
git add backend/farms/routing.py
git add backend/farms/notifications.py
git add backend/farms/signals.py
git add backend/cropx_backend/asgi.py
git commit -m "feat(ws): WebSocket notification consumer, JWT middleware, signal-driven notifications for orders/bookings/messages"
```

### Commit 8 — Frontend base: providers, routing, theme, auth

```bash
git add frontend/src/main.jsx
git add frontend/src/App.jsx
git add frontend/src/context/
git add frontend/src/store/
git add frontend/src/hooks/
git add frontend/src/routes/
git add frontend/src/services/
git add frontend/src/constants/
git add frontend/src/utils/
git add frontend/src/styles/
git commit -m "feat(frontend): React app shell — Redux auth, JWT interceptors, MUI theme, dark mode, protected routes"
```

### Commit 9 — Shared layout components

```bash
git add frontend/src/components/
git commit -m "feat(ui): DashboardLayout sidebar+topbar, NotificationBell with live badge, auth-gated AI ChatSupport FAB"
```

### Commit 10 — Auth pages

```bash
git add frontend/src/pages/auth/
git commit -m "feat(auth): login, signup, forgot/reset password, email verification pages"
```

### Commit 11 — Farmer portal pages

```bash
git add frontend/src/pages/farmer/
git add frontend/src/pages/dashboard/FarmerDashboard.jsx
git commit -m "feat(dashboard): farmer portal — FarmManager, MyCrops, Marketplace (table), Orders with status actions, Bookings, DiseaseScanner, FertilizerCenter, Weather, CropPrices, Messages, Notifications"
```

### Commit 12 — Customer portal pages

```bash
git add frontend/src/pages/customer/
git add frontend/src/pages/dashboard/CustomerDashboard.jsx
git commit -m "feat(dashboard): customer portal — BrowseFarms, Marketplace, Orders with timeline, Bookings, CropScanner (local model), Messages pre-select from listing, Notifications"
```

### Commit 13 — Shared pages

```bash
git add frontend/src/pages/LandingPage.jsx
git add frontend/src/pages/ProfilePage.jsx
git add frontend/src/pages/SettingsPage.jsx
git add frontend/src/pages/dashboard/AdminDashboard.jsx
git commit -m "feat(frontend): landing page, profile, settings, admin dashboard"
```

### Commit 14 — AI features and real-time dashboard insights

```bash
git add frontend/src/pages/dashboard/FarmerDashboard.jsx
git add frontend/src/pages/dashboard/CustomerDashboard.jsx
git add frontend/src/components/common/ChatSupport.jsx
git commit -m "feat(ai): Groq-powered AI insights on dashboards, auth-gated chatbot, Gemini fallback for customer insights"
```

### Commit 15 — Documentation

```bash
git add README.md TECHSTACK.md COMMITS.md
git add backend/README.md frontend/README.md
git commit -m "docs: add root README, TECHSTACK, COMMITS guide, backend and frontend setup docs"
```

---

## One-shot commit (if you want a single clean commit)

If you prefer a single initial commit for the whole project:

```bash
git add -A
git commit -m "feat: initial CropX platform — Django REST + Channels backend, React 18 frontend, local ML disease scanner, Groq AI chatbot, real-time WebSocket notifications"
```

---

## Pushing to GitHub

```bash
# If you haven't already set the remote:
git remote add origin https://github.com/your-username/CropX.git

# Push
git push -u origin main
```

## Branch naming

| Pattern | Example |
|---------|---------|
| `feature/<name>` | `feature/booking-system` |
| `fix/<name>` | `fix/message-button-routing` |
| `refactor/<name>` | `refactor/dashboard-ai-insights` |
| `docs/<name>` | `docs/backend-readme` |
| `chore/<name>` | `chore/update-dependencies` |
