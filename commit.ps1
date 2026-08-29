# CropX — Full Project Commit Script
# Run this from a plain PowerShell window (NOT inside VS Code terminal):
#   cd "C:\Users\Krish Patel\Desktop\x\CropX"
#   .\commit.ps1

Set-Location "C:\Users\Krish Patel\Desktop\x\CropX"

# ── Safety: remove stale lock ──────────────────────────────────────────────
$lock = ".git\index.lock"
if (Test-Path $lock) { Remove-Item $lock -Force; Write-Host "Removed stale lock" }

# ── Stage backend ──────────────────────────────────────────────────────────
git add .gitignore README.md TECHSTACK.md COMMITS.md
git add backend\README.md backend\.env.example backend\requirements.txt
git add backend\manage.py
git add backend\authentication\serializers.py backend\authentication\urls.py backend\authentication\views.py
git add backend\cropx_backend\asgi.py backend\cropx_backend\settings.py backend\cropx_backend\urls.py backend\cropx_backend\wsgi.py
git add backend\farms\admin.py backend\farms\apps.py backend\farms\urls.py backend\farms\views.py
git add backend\farms\consumers.py backend\farms\middleware.py backend\farms\notifications.py
git add backend\farms\routing.py backend\farms\signals.py backend\farms\permissions.py
git add backend\farms\models.py backend\farms\serializers.py
git add "backend\farms\management\"
git add backend\farms\migrations\
git add backend\authentication\models.py backend\authentication\managers.py backend\authentication\permissions.py backend\authentication\utils.py backend\authentication\apps.py backend\authentication\admin.py
git add backend\authentication\migrations\
git add backend\model\predictor.py backend\model\infer.py backend\model\class_indices.py 2>$null
git add backend\model\class_indices.json backend\model\__init__.py

# ── Stage frontend ─────────────────────────────────────────────────────────
git add frontend\README.md frontend\.env.example frontend\package.json frontend\vite.config.js frontend\index.html
git add frontend\src\main.jsx frontend\src\App.jsx
git add frontend\src\components\
git add frontend\src\context\
git add frontend\src\hooks\
git add frontend\src\pages\
git add frontend\src\routes\
git add frontend\src\services\
git add frontend\src\store\
git add frontend\src\styles\
git add frontend\src\constants\
git add frontend\src\utils\
git add frontend\src\assets\ 2>$null

# ── Remove any leaked files ────────────────────────────────────────────────
git reset HEAD "backend\cropx_backend\__pycache__\" 2>$null
git restore --staged (git diff --cached --name-only | Where-Object { $_ -match "__pycache__|\.pyc|\.pyo|db\.sqlite3|\.env$|node_modules" }) 2>$null

Write-Host "`n=== Staged files ==="
git diff --cached --name-only | Sort-Object

# ── Commit 1: Full project ─────────────────────────────────────────────────
git commit -m "feat: initial CropX platform

Backend:
- Django 5 + DRF REST API — farms, crops, listings, orders, bookings, messages
- Custom User model with FARMER/CUSTOMER/ADMIN roles + SimpleJWT
- Django Channels WebSocket notifications + JWT middleware
- Signal-driven notifications for orders, bookings, messages
- Local MobileNetV2 disease classifier (107 classes) via Anaconda subprocess
- Gemini AI insights, OpenWeatherMap weather, Groq-ready API views
- seed_data management command, requirements.txt, .env.example

Frontend:
- React 18 + Vite + MUI v9 — farmer and customer portals
- Redux Toolkit auth state, Axios interceptors + silent JWT refresh
- DashboardLayout (sidebar + topbar) with auth-gated AI chatbot FAB
- Real-time NotificationBell (WebSocket + REST fallback polling)
- Farmer: FarmManager, MyCrops, Marketplace (table), Orders with status
  actions, Bookings, DiseaseScanner, Weather, CropPrices, Messages
- Customer: BrowseFarms with message-to-farmer nav, CustomerMarketplace,
  Orders with timeline, Bookings, CropScanner (local ML), Messages
- FarmerDashboard + CustomerDashboard with Groq AI insights
- Dark/light theme, MUI global theme, toast overrides, CSS reset

Docs: README.md, TECHSTACK.md, COMMITS.md, backend/README.md, frontend/README.md"

Write-Host "`nCommit exit code: $LASTEXITCODE"
if ($LASTEXITCODE -eq 0) {
    Write-Host "`n=== SUCCESS — now push with: ==="
    Write-Host "git remote add origin https://github.com/YOUR_USERNAME/CropX.git"
    Write-Host "git push -u origin main"
} else {
    Write-Host "`nCommit failed. Check the errors above."
}
