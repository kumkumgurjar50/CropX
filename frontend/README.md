# CropX Frontend

React 18 + Vite + MUI v9 frontend for the CropX agricultural platform.

## Requirements

- Node.js 18+
- npm 9+

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Open .env and fill in VITE_GROQ_API_KEY (and optionally VITE_API_URL)

# 3. Start the development server
npm run dev
```

App runs at `http://localhost:5173`

The Vite dev server proxies `/api` requests to `http://127.0.0.1:8000` automatically — no manual CORS configuration needed in dev.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | ✅ | Backend base URL. Default: `http://127.0.0.1:8000/api` |
| `VITE_GROQ_API_KEY` | ✅ | Groq API key for CropX AI chatbot and dashboard insights. Get a free key at [console.groq.com](https://console.groq.com/keys) |
| `VITE_APP_NAME` | — | Browser tab app name. Default: `CropX` |

> **Note on Groq**: The free tier has generous rate limits and requires no credit card. The chatbot and AI insights panels fall back to static content if the key is not set.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Build for production to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run OxLint |

## Project Structure

```
src/
├── App.jsx                  # Root router + route definitions
├── main.jsx                 # React entry point — Redux + Router + Theme providers
│
├── components/common/
│   ├── DashboardLayout.jsx  # Sidebar + topbar shell for all dashboard pages
│   ├── ChatSupport.jsx      # AI chatbot FAB (auth-gated — only shows when logged in)
│   ├── NotificationBell.jsx # Bell icon with live badge + dropdown
│   ├── AuthShell.jsx        # Centred card wrapper for auth pages
│   ├── LandingNavbar.jsx    # Public landing page navbar
│   ├── Navbar.jsx           # (shared utility)
│   ├── PageShell.jsx        # Generic page wrapper
│   └── SectionHeading.jsx   # Styled section heading component
│
├── context/
│   ├── AuthContext.jsx      # Session rehydration on app load
│   └── ThemeContext.jsx     # MUI theme builder + dark/light toggle
│
├── hooks/
│   ├── useAuth.js           # login / register / logout + Redux dispatch
│   ├── useNotifications.js  # WebSocket + REST polling for notifications
│   └── usePageTitle.js      # Sets document.title per page
│
├── pages/
│   ├── auth/                # LoginPage, SignupPage, ForgotPassword, ResetPassword, VerifyEmail
│   ├── dashboard/           # FarmerDashboard, CustomerDashboard, AdminDashboard
│   ├── farmer/              # FarmManager, MyCrops, Marketplace, Orders, FarmerBookings,
│   │                        # DiseaseScanner, FertilizerCenter, Weather, CropPrices,
│   │                        # Messages, Notifications
│   ├── customer/            # BrowseFarms, CustomerMarketplace, CustomerOrders,
│   │                        # CustomerBookings, CustomerCropScanner,
│   │                        # CustomerMessages, CustomerNotifications
│   ├── LandingPage.jsx
│   ├── ProfilePage.jsx
│   └── SettingsPage.jsx
│
├── routes/
│   ├── ProtectedRoute.jsx   # Redirects unauthenticated users to /login
│   └── RoleBasedRoute.jsx   # Redirects users to their correct dashboard if wrong role
│
├── services/
│   └── api.js               # Axios instance with JWT bearer token + silent refresh interceptor
│
├── store/
│   ├── store.js             # Redux store
│   └── slices/authSlice.js  # Auth state: user, tokens, loading, isAuthenticated
│
├── styles/
│   └── global.css           # CSS reset, scrollbar, toast overrides, theme transitions
│
├── constants/
│   └── roles.js             # ROLES enum, ROLE_LABELS, getDashboardPath()
│
└── utils/
    └── errorParser.js       # Extract user-friendly messages from DRF error responses
```

## Auth Flow

1. User logs in → `POST /api/auth/login/` → receives `{ access, refresh, user }`
2. Tokens stored in `localStorage` (remember me) or `sessionStorage` (session only)
3. All API requests attach `Authorization: Bearer <access>` via Axios request interceptor
4. On 401 → response interceptor silently calls `POST /api/auth/refresh/` → retries original request
5. On failed refresh → Redux `logout` action → redirect to `/login`
6. On app load → `AuthContext` validates stored token via `GET /api/auth/me/`

## Notifications

The `useNotifications` hook:
- Opens a WebSocket: `ws://localhost:8000/ws/notifications/?token=<jwt>`
- Receives `{ type: 'notification', ... }` frames → prepends to list, increments badge
- Receives `{ type: 'unread_count', count }` frames → syncs badge
- Sends `{ type: 'mark_read', id }` to mark individual/all notifications
- Falls back to REST polling every 20 s when WebSocket is disconnected

## Building for Production

```bash
npm run build
```

Output goes to `dist/`. Serve it from any static host or via Django's `STATICFILES_DIRS`.

### With a Django backend

Add to `settings.py`:
```python
STATICFILES_DIRS = [BASE_DIR.parent / 'frontend' / 'dist']
```

Or deploy frontend separately to Vercel/Netlify and point `VITE_API_URL` at your production backend.
