<<<<<<< HEAD
# 🌱 BIO-COIN – Rewarding Cleanliness Through Incentives
=======
# 🌱 BIO-COIN

### Rewarding Cleanliness Through Incentives
>>>>>>> afc2b78 (Improve role based authentication and coin system)

BIO-COIN is a web-based civic engagement platform designed to encourage citizens to actively participate in waste collection and cleanliness activities by rewarding their contributions with **Bio-Coins**.

The platform combines **cleanliness reporting, gamification, digital rewards, leaderboards, awareness, and city-level statistics** to turn everyday environmental responsibility into an engaging and rewarding experience.

---

## 📌 Overview

Waste management is not only a government responsibility. Citizen participation plays a major role in keeping communities clean, but people often lack a simple and motivating way to contribute.

**BIO-COIN** addresses this problem by creating an incentive-driven ecosystem where users can report cleanliness activities, earn Bio-Coins, track their contributions, compete with other citizens, and redeem their accumulated coins for rewards.

The goal is simple:

> **Make cleanliness measurable, participatory, and rewarding. 🌱**

---

## 🎯 Objectives

- Encourage citizens to actively participate in cleanliness activities.
- Provide a digital platform for reporting waste collection.
- Reward verified cleanliness contributions with Bio-Coins.
- Gamify environmental participation through leaderboards.
- Provide users with a history of their cleanliness activities.
- Promote awareness about waste management and environmental responsibility.
- Provide city-level cleanliness and participation statistics.
- Create an incentive-based model for long-term citizen engagement.

---

## 🚀 Key Features

### 🗑️ Waste Reporting

Users can report waste collection and cleanliness activities through the platform.

Reports can be used to record community contributions and help build a history of cleanliness activities.

### 🪙 Bio-Coin Reward System

Users earn **Bio-Coins** for eligible cleanliness contributions.

The reward mechanism provides a direct incentive for citizens to participate in maintaining cleaner surroundings.

### 🏆 City Rankings & Leaderboard

Users can compare their contributions with other participants through rankings.

The competitive aspect encourages continued participation and creates a sense of community involvement.

### 📊 City Statistics

The platform provides statistics related to cleanliness activities and citizen participation.

This can help visualize the impact of community-driven waste management.

### 🎁 Reward Redemption

Users can use their accumulated Bio-Coins to redeem available rewards.

This connects digital participation with real-world incentives.

### 📜 Waste Activity History

Users can view their previous waste-related reports and track their participation over time.

### 📚 Awareness

The platform includes an awareness section focused on waste management, cleanliness, and responsible environmental practices.

### 🎙️ Voice Assistant

BIO-COIN includes a voice-assistance interface to make interaction with the platform more accessible and user-friendly.

### 🔐 Authentication & Protected Routes

The application includes authentication and protected user/admin routes to separate regular user functionality from administrative functionality.

### 🛠️ Admin Dashboard

Administrators can manage and monitor platform-level information and user activity through a dedicated admin interface.

---
## 📁 Project Structure

```text
bio-coin/
│
├── public/
│   ├── biocoin-favicon.ico
│   ├── placeholder.svg
│   └── robots.txt
│
├── src/
│   │
│   ├── assets/
│   │   ├── green-bharat-logo.png
│   │   └── hero-bg.jpg
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── AdminRoute.tsx
│   │   ├── NavLink.tsx
│   │   ├── PageHeader.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── VoiceAssistant.tsx
│   │
│   ├── hooks/
│   │   ├── use-mobile.tsx
│   │   └── use-toast.ts
│   │
│   ├── lib/
│   │   ├── auth-context.tsx
│   │   ├── mock-data.ts
│   │   ├── reports-store.ts
│   │   ├── supabase.ts
│   │   └── utils.ts
│   │
│   ├── pages/
│   │   ├── AdminPage.tsx
│   │   ├── AwarenessPage.tsx
│   │   ├── CityRankingPage.tsx
│   │   ├── HomePage.tsx
│   │   ├── Index.tsx
│   │   ├── LoginPage.tsx
│   │   ├── NotFound.tsx
│   │   ├── RedeemPage.tsx
│   │   ├── ReportPage.tsx
│   │   └── WasteHistoryPage.tsx
│   │
│   ├── test/
│   │
│   ├── App.css
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── vite-env.d.ts
│
├── .env
├── .gitignore
├── bun.lock
├── components.json
├── eslint.config.js
├── index.html
├── package.json
├── package-lock.json
├── playwright.config.ts
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── vitest.config.ts
└── README.md