# 🧾 JoyStock

> Système de gestion de stock et d'inventaire pour la restauration

[![Version](https://img.shields.io/badge/version-1.0.0-blue)](https://github.com/ramdane-amaouz/joystock)
[![Backend](https://img.shields.io/badge/backend-FastAPI-009688)](https://fastapi.tiangolo.com)
[![Frontend](https://img.shields.io/badge/frontend-React-61DAFB)](https://react.dev)
[![Mobile](https://img.shields.io/badge/mobile-Expo-000020)](https://expo.dev)
[![Base de données](https://img.shields.io/badge/database-Supabase-3ECF8E)](https://supabase.com)

🇬🇧 [English version](./README.en.md)

---

## 📋 Présentation

JoyStock est une application SaaS de gestion de stock destinée aux restaurants. Elle permet de suivre les inventaires, les réceptions de marchandises, les ventes et de générer des statistiques en temps réel.

L'application est composée de trois parties :
- **Backend** — API REST développée avec FastAPI
- **Frontend Web** — Interface React déployée sur Vercel
- **Application Mobile** — Application Android développée avec Expo + React Native

---

## ✨ Fonctionnalités

### 📦 Gestion des stocks
- Suivi du stock en temps réel via inventaires périodiques
- Calcul du **stock théorique** (stock mesuré + réceptions - consommation via ventes)
- Réception de marchandises
- Seuil d'alerte configurable par produit
- Alertes automatiques en cas de stock critique

### 🧮 Inventaires
- Création d'inventaires de stock
- Réception de livraisons
- Historique complet des inventaires par utilisateur

### 🍽️ Recettes
- Création et gestion des recettes
- Association d'ingrédients avec quantités
- Calcul automatique de la consommation des produits via les ventes

### 📊 Statistiques *(admin uniquement)*
- Évolution de la consommation estimée par produit
- Total des ventes par recette
- Évolution des ventes par jour et par semaine
- Stock théorique par produit avec indicateur d'alerte
- Top produit consommé

### 👥 Gestion des utilisateurs
- Système d'invitation par email (via Resend)
- Deux rôles : **Admin** et **Employé**
- Réinitialisation du mot de passe par email

---

## 🔐 Séparation des autorisations

JoyStock distingue deux rôles avec des accès différents :

### 👤 Employé
| Fonctionnalité | Accès |
|---|---|
| Tableau de bord (aperçu produits) | ✅ |
| Consulter les produits | ✅ |
| Faire un inventaire | ✅ |
| Réceptionner une livraison | ✅ |
| Consulter son profil | ✅ |
| Statistiques | ❌ |
| Alertes stock | ❌ |
| Inviter des utilisateurs | ❌ |
| Gérer les recettes | ❌ |
| Configurer les seuils d'alerte | ❌ |

### 👑 Admin
| Fonctionnalité | Accès |
|---|---|
| Tout ce que peut faire l'employé | ✅ |
| Statistiques complètes | ✅ |
| Alertes stock | ✅ |
| Inviter des utilisateurs | ✅ |
| Gérer les recettes | ✅ |
| Ajouter / gérer les produits | ✅ |
| Configurer les seuils d'alerte | ✅ |
| Consulter les ventes | ✅ |

---

## 🏗️ Architecture

```
joystock/
├── backend/                  # API FastAPI
│   ├── routers/              # Routes de l'API
│   │   ├── produits.py
│   │   ├── inventaires.py
│   │   ├── invitations.py
│   │   ├── profiles.py
│   │   ├── recettes.py
│   │   ├── stats.py
│   │   └── ventes.py
│   ├── core/
│   │   └── security.py       # Authentification JWT
│   ├── services/
│   │   └── mailer.py         # Envoi d'emails via Resend
│   ├── database.py           # Connexion Supabase
│   └── main.py
│
├── frontend/                 # Application React
│   └── src/
│       ├── pages/
│       └── components/
│
├── joystock-mobile/          # Application mobile Expo
│   └── app/
│       ├── (auth)/           # Pages de connexion
│       ├── (admin)/          # Pages admin
│       └── (employe)/        # Pages employé
│
└── docker-compose.yml
```

---

## 🛠️ Stack technique

| Composant | Technologie |
|---|---|
| Backend | Python / FastAPI |
| Base de données | Supabase (PostgreSQL) |
| Authentification | Supabase Auth (JWT) |
| Frontend Web | React + Vite |
| Application Mobile | Expo + React Native + TypeScript |
| Emails | Resend |
| Déploiement Backend | Render |
| Déploiement Frontend | Vercel |

---

## 🚀 Lancer le projet en local

### Prérequis
- Docker et Docker Compose
- Node.js 20+
- Python 3.12+

### Backend + Frontend Web

```bash
git clone https://github.com/ramdane-amaouz/joystock.git
cd joystock
docker-compose up --build
```

- Backend : `http://localhost:8000`
- Frontend : `http://localhost:5173`
- Documentation API : `http://localhost:8000/docs`

### Variables d'environnement

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

### Application Mobile

```bash
cd joystock-mobile
npm install --legacy-peer-deps
npx expo start
```

---

## 📱 Application Mobile

L'application mobile reprend les mêmes fonctionnalités que la version web avec une interface adaptée aux smartphones Android.

**Build APK (Android)**
```bash
cd joystock-mobile
eas build --platform android --profile preview
```

---

## 📄 Licence

MIT — Ramdane Amaouz © 2026