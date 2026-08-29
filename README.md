# 🌾 CropX — Smart Agriculture & Farm Management Platform

**CropX** is an end-to-end smart agricultural management, direct marketplace, and AI crop disease diagnosis web platform designed for **Farmers**, **Customers**, and **System Administrators**.

---

## 🔑 Administrative & Test Account Credentials

All test accounts are pre-seeded in the database (`db.sqlite3`).

### 🛡️ 1. Administrator Account
- **Role**: `ADMIN`
- **Email**: `admin@cropx.com`
- **Password**: `123456789`
- **Access**: Full platform overview, user management directory, real-time analytics, and Fertilizer catalog control (Add / Edit / Delete fertilizer products).

---

### 👨‍🌾 2. Farmer Accounts (Farmers 1 to 10)
- **Role**: `FARMER`
- **Password**: `123456789` *(Same password for all farmer accounts)*
- **Sample Logins**:
  - `farmer1@cropx.com` — Ramesh Patel (Maharashtra)
  - `farmer2@cropx.com` — Suresh Kumar (Punjab)
  - `farmer3@cropx.com` — Rajesh Sharma (Uttar Pradesh)
  - `farmer4@cropx.com` — Vikram Singh (Haryana)
  - `farmer5@cropx.com` — Harpreet Singh (Punjab)
  - `farmer6@cropx.com` to `farmer10@cropx.com`

---

### 🛒 3. Customer Accounts (Customers 1 to 10)
- **Role**: `CUSTOMER`
- **Password**: `123456789` *(Same password for all customer accounts)*
- **Sample Logins**:
  - `customer1@cropx.com` — Priya Sharma (Delhi)
  - `customer2@cropx.com` — Amit Verma (Mumbai)
  - `customer3@cropx.com` — Neha Gupta (Bengaluru)
  - `customer4@cropx.com` — Rohan Mehta (Ahmedabad)
  - `customer5@cropx.com` — Ananya Roy (Kolkata)
  - `customer6@cropx.com` to `customer10@cropx.com`

---

## ✨ Main Features by Role

### 1. 🛡️ Admin Control Center (`/admin/dashboard`)
- **Real-Time Analytics**: View live metrics for Total Users, Farmers, Customers, Verified Accounts, Active Farms, Crops, Total Orders, Pending Deliveries, and Total Platform Revenue (₹).
- **User Directory**: Search and filter all registered Farmers and Customers with active status and registration dates.
- **Farms & Crops Directory**: Monitor active agricultural farms, state/district locations, owner names, and crop counts.
- **Fertilizer Catalog Control**: Add, edit, or delete fertilizer products with instant live synchronization to the customer/farmer Fertilizer Center catalog.

---

### 2. 👨‍🌾 Farmer Portal
- **Farm Manager**: Add and manage farms with district, state, soil type, and total area in acres.
- **My Crops**: Track crop planting, harvest dates, expected yield, and stage progression.
- **Marketplace Listings**: Post crops for direct sale to customers with custom pricing per kg/quintal.
- **Order & Booking Management**: Manage incoming customer crop bookings with status updates (Pending, Accepted, In Transit, Delivered).
- **AI Disease Scanner**: Upload crop leaf photos for instant deep learning disease diagnosis, confidence %, severity rating, and organic/chemical treatment advice.
- **Crop Prices**: Live Mandi market prices across Indian agricultural mandis.
- **Fertilizer Center**: Browse 250+ fertilizers with multi-item cart, quantity controls, customer delivery details form, and Cash-on-Delivery ordering.

---

### 3. 🛒 Customer Portal
- **Browse Farms & Marketplace**: Explore verified regional farms, crops, and direct farmer listings.
- **Direct Crop Bookings**: Place orders directly with farmers for fresh produce.
- **Fertilizer Ordering Flow**:
  - **Add to Cart**: Add multiple fertilizer products with live cart badge counter.
  - **Cart Drawer**: Adjust quantities, remove items, view order total (₹).
  - **Customer Details Form**: Enter Full Name, Mobile Number, Delivery Address, City, State, and Pincode.
  - **Cash on Delivery**: Select COD and confirm orders cleanly.
- **Crop Scanner**: Upload leaf photos to detect plant health issues.
- **Farmer Messaging**: Chat directly with farmers regarding crop orders and deliveries.

---

## 🔬 AI Plant Disease Scan Validation

The Disease Scanner uses a **MobileNetV2 Deep Learning Keras Model** (107 fine-grained plant disease classes) coupled with **RGB Foliage Feature Validation**:
- **Valid Leaf Photos**: Returns precise crop disease predictions, confidence score (%), severity level, organic treatment, and chemical treatment recommendations.
- **Non-Leaf / Out-of-Distribution Images**: (e.g. documents, passbooks, animals, objects, or flat colors) are automatically detected and returned as:
  **`Unknown Image — Please upload a clear image of a supported crop leaf.`**
  *(Suppressing false disease names, confidence bars, or treatment recommendations)*.

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
|---|---|
| **Frontend** | React 18, Vite, Material-UI (MUI v5), Emotion, Framer Motion, Axios, React Router v6 |
| **Backend** | Python 3.10+, Django 4.2, Django REST Framework (DRF), SimpleJWT Authentication |
| **ML Inference** | TensorFlow 2.x / Keras (MobileNetV2), NumPy, Pillow |
| **Database** | SQLite (`db.sqlite3`) |
| **Styling** | Modern Dark/Light Design System, Glassmorphism, Responsive Grid System |

---

## 🚀 How to Run Locally

### 1. Backend Setup (Django)
```bash
# Navigate to backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Run migrations (optional)
python manage.py migrate

# Start Django development server
python manage.py runserver 8000
```
*Backend API available at: `http://localhost:8000/api/`*

---

### 2. Frontend Setup (Vite + React)
```bash
# Navigate to frontend directory
cd frontend

# Install npm dependencies
npm install

# Start Vite dev server
npm run dev
```
*Frontend Application available at: `http://localhost:5173/`*

---

## 📄 License
This project is developed for **CropX Agriculture Solutions**. All rights reserved.
