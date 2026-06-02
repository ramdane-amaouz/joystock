# 🧾 JoyStock

> Stock and inventory management system for the restaurant industry

[![Version](https://img.shields.io/badge/version-1.0.0-blue)](https://github.com/ramdane-amaouz/joystock)
[![Backend](https://img.shields.io/badge/backend-FastAPI-009688)](https://fastapi.tiangolo.com)
[![Frontend](https://img.shields.io/badge/frontend-React-61DAFB)](https://react.dev)
[![Mobile](https://img.shields.io/badge/mobile-Expo-000020)](https://expo.dev)
[![Database](https://img.shields.io/badge/database-Supabase-3ECF8E)](https://supabase.com)

🇫🇷 [Version française](./README.md)

---

## 📋 Overview

JoyStock is a SaaS stock management application designed for restaurants. It enables tracking of inventories, goods receipts, sales, and real-time statistics generation.

The application consists of three parts:
- **Backend** — REST API built with FastAPI
- **Web Frontend** — React interface deployed on Vercel
- **Mobile App** — Android application built with Expo + React Native

---

## ✨ Features

### 📦 Stock Management
- Real-time stock tracking through periodic inventories
- **Theoretical stock** calculation (measured stock + receipts - consumption via sales)
- Goods receipt management
- Configurable alert threshold per product
- Automatic alerts for critical stock levels

### 🧮 Inventories
- Stock inventory creation
- Delivery reception
- Full inventory history per user

### 🍽️ Recipes
- Recipe creation and management
- Ingredient association with quantities
- Automatic product consumption calculation via sales

### 📊 Statistics *(admin only)*
- Estimated consumption trend per product
- Total sales per recipe
- Daily and weekly sales trends
- Theoretical stock per product with alert indicator
- Top consumed product

### 👥 User Management
- Email invitation system (via Resend)
- Two roles: **Admin** and **Employee**
- Password reset by email

---

## 🔐 Role-Based Access Control

JoyStock defines two roles with different access levels:

### 👤 Employee
| Feature | Access |
|---|---|
| Dashboard (product overview) | ✅ |
| View products | ✅ |
| Perform inventory | ✅ |
| Receive deliveries | ✅ |
| View own profile | ✅ |
| Statistics | ❌ |
| Stock alerts | ❌ |
| Invite users | ❌ |
| Manage recipes | ❌ |
| Configure alert thresholds | ❌ |

### 👑 Admin
| Feature | Access |
|---|---|
| Everything an employee can do | ✅ |
| Full statistics | ✅ |
| Stock alerts | ✅ |
| Invite users | ✅ |
| Manage recipes | ✅ |
| Add / manage products | ✅ |
| Configure alert thresholds | ✅ |
| View sales | ✅ |

---

## 🏗️ Architecture

```
joystock/
├── backend/                  # FastAPI REST API
│   ├── routers/
│   │   ├── produits.py
│   │   ├── inventaires.py
│   │   ├── invitations.py
│   │   ├── profiles.py
│   │   ├── recettes.py
│   │   ├── stats.py
│   │   └── ventes.py
│   ├── core/
│   │   └── security.py       # JWT authentication
│   ├── services/
│   │   └── mailer.py         # Email sending via Resend
│   ├── database.py           # Supabase connection
│   └── main.py
│
├── frontend/                 # React application
│   └── src/
│       ├── pages/
│       └── components/
│
├── joystock-mobile/          # Expo mobile application
│   └── app/
│       ├── (auth)/           # Login pages
│       ├── (admin)/          # Admin pages
│       └── (employe)/        # Employee pages
│
└── docker-compose.yml
```

---

## 🛠️ Tech Stack

| Component | Technology |
|---|---|
| Backend | Python / FastAPI |
| Database | Supabase (PostgreSQL) |
| Authentication | Supabase Auth (JWT) |
| Web Frontend | React + Vite |
| Mobile App | Expo + React Native + TypeScript |
| Emails | Resend |
| Backend Deployment | Render |
| Frontend Deployment | Vercel |

---

## 🚀 Running locally

### Prerequisites
- Docker and Docker Compose
- Node.js 20+
- Python 3.12+

### Backend + Web Frontend

```bash
git clone https://github.com/ramdane-amaouz/joystock.git
cd joystock
docker-compose up --build
```

- Backend: `http://localhost:8000`
- Frontend: `http://localhost:5173`
- API Documentation: `http://localhost:8000/docs`

### Environment Variables

**`backend/.env`**
```env
SUPABASE_URL=
SUPABASE_KEY=
RESEND_API_KEY=
FRONTEND_URL=http://localhost:5173
DEV_EMAIL=
```

**`frontend/.env`**
```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_URL=http://localhost:8000
```

### Mobile Application

```bash
cd joystock-mobile
npm install --legacy-peer-deps
npx expo start
```

---

## 📱 Mobile Application

The mobile app provides the same features as the web version with an interface tailored for Android smartphones.

**APK Build (Android)**
```bash
cd joystock-mobile
eas build --platform android --profile preview
```

---

## 📄 License

MIT — Ramdane Amaouz © 2026