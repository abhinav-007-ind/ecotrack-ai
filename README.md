<div align="center">

# 🌍 EcoTrack AI
### AI-Powered Carbon Footprint Tracking & Sustainability Coaching

Track your carbon footprint, visualize Earth’s health in real time, and receive personalized AI recommendations to build sustainable habits.

![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-Enabled-blue)
![Firebase](https://img.shields.io/badge/Firebase-Backend-orange)
![Gemini AI](https://img.shields.io/badge/Gemini-AI-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

</div>

---

# 📌 Table of Contents
- Overview
- Chosen Vertical
- Problem Statement
- Approach & Logic
- How the Solution Works
- Features
- Tech Stack
- Project Structure
- Instructions to Run Locally
- Assumptions Made
- Future Improvements
- Author

---

# 🌟 Overview

EcoTrack AI is an intelligent sustainability platform designed to help users:

- Calculate their carbon footprint
- Understand environmental impact
- Visualize Earth health dynamically
- Receive AI-powered recommendations
- Track carbon offsets through tree planting
- Compete using eco gamification

The platform combines:

- Artificial Intelligence  
- Sustainability Analytics  
- Interactive Visualization  
- Gamification  

to encourage real-world eco-friendly habits.

---

# 🌱 Chosen Vertical

## Sustainability / Climate Tech / Environmental Awareness

This project belongs to the **Sustainability & Climate Tech** vertical.

The goal is to make climate awareness:

- Understandable  
- Visual  
- Actionable  
- Engaging  

instead of just showing static statistics.

---

# ❗ Problem Statement

People contribute to carbon emissions daily through:

- Transportation
- Electricity consumption
- Food habits
- Shopping behavior

Most people:

- Don’t know their carbon footprint
- Can’t understand long-term impact
- Don’t know how to improve sustainably

We solve this using:

### Measurement + Visualization + AI Guidance

---

# 🧠 Approach & Logic

EcoTrack AI uses five major systems.

---

## 1. Carbon Calculation Engine

The user provides lifestyle inputs:

- Daily transport distance
- Transport mode
- Electricity consumption
- Diet pattern
- Shopping frequency

Using emission factors, the system calculates:

- Daily CO₂
- Weekly CO₂
- Monthly CO₂
- Yearly CO₂

---

## 2. Dynamic Earth Visualization

A rotating Earth acts as visual feedback.

Earth changes state depending on user emissions:

### Healthy Earth
- Green glow
- Clean atmosphere
- Low emissions

### Moderate Earth
- Partial degradation
- Medium emissions

### Polluted Earth
- Dark / damaged
- High emissions

This creates emotional impact.

---

## 3. AI Recommendation Engine

Using **Google Gemini AI**, the platform generates personalized recommendations.

Examples:
- Reduce car usage
- Switch to public transport
- Lower meat consumption
- Reduce electricity wastage

Recommendations are based on user habits.

---

## 4. Gamification Layer

Users stay motivated using:

- Green Score
- Streak system
- Badges
- Leaderboard
- Tree milestones

This makes sustainability engaging.

---

## 5. Cloud Storage & Sync

Using Firebase:

- Authentication
- Firestore Database
- User Profiles
- Emission History
- Leaderboards

Local storage fallback improves reliability.

---

# ⚙ How the Solution Works

---

## Step 1 — Login

Users sign in via:

- Google Sign-In
- Email/Password
- Guest Mode

---

## Step 2 — Enter Lifestyle Inputs

User enters:

### Transport
Examples:
- Petrol car
- EV
- Bus/train
- Bicycle

### Electricity
Weekly kWh consumption

### Diet
- Vegan
- Vegetarian
- Flexitarian
- Meat-heavy

### Shopping
- Minimal
- Average
- Frequent

---

## Step 3 — Carbon Calculation

Formula:

```math
Carbon = Transport + Electricity + Diet + Shopping
```

Outputs:
- Daily emissions
- Weekly emissions
- Monthly emissions
- Yearly emissions

---

## Step 4 — Green Score

Score range:

### 90–100
Excellent

### 70–89
Good

### 40–69
Moderate

### Below 40
High impact

---

## Step 5 — Earth Update

The Earth background updates based on Green Score.

Example:

- Score 95 → Healthy Earth  
- Score 50 → Moderate Earth  
- Score 20 → Polluted Earth  

---

## Step 6 — AI Coaching

Gemini AI analyzes:

- Carbon sources
- Lifestyle habits
- Reduction opportunities

It provides:
- CO₂ savings
- Cost savings
- Habit changes

---

## Step 7 — Carbon Offset Tracking

Platform estimates trees needed.

Example:

Annual emission = 2 tons CO₂  
Required trees ≈ 100

Users can track:
- Trees planted
- Offset progress

---

# ✨ Features

## 🌍 Rotating Earth Background
- Fullscreen
- Responsive
- Dynamic state changes

---

## 🧮 Carbon Calculator
Calculates:
- Daily
- Weekly
- Monthly
- Yearly emissions

---

## 🤖 AI Eco Coach
Personalized sustainability recommendations.

---

## 📊 Dashboard
Shows:
- Green Score
- Emission stats
- Progress metrics
- Eco streak

---

## 🌱 Plant Tracker
Track planted trees and offset progress.

---

## 🏆 Leaderboard
Compare sustainability scores.

---

## 👤 Profile
Stores:
- Name
- Avatar
- Streak
- Trees
- Green score

---

# 🛠 Tech Stack

## Frontend
- React
- TypeScript
- Vite
- Tailwind CSS

## Backend
- Node.js
- Express (`server.ts`)

## Database
- Firebase Firestore

## Authentication
- Firebase Auth

## AI
- Google Gemini API

## UI
- Glassmorphism
- Responsive Design
- Motion Animations

---

# 📁 Project Structure

```bash
ecotrack-ai/
│
├── src/
│   ├── components/
│   │   ├── Dashboard.tsx
│   │   ├── EarthBackground.tsx
│   │   ├── EcoCalculator.tsx
│   │   ├── EcoCoach.tsx
│   │   ├── Leaderboard.tsx
│   │   ├── PlantTracker.tsx
│   │   └── Profile.tsx
│   │
│   ├── utils/
│   │   ├── carbonCalculator.ts
│   │   └── ecoStore.ts
│   │
│   ├── firebase.ts
│   ├── App.tsx
│   └── main.tsx
│
├── server.ts
├── package.json
└── README.md
```

---

# 💻 Instructions to Run Locally

## Prerequisites

Install:

- Node.js (v18+)
- Git
- VS Code (recommended)

Verify:

```bash
node -v
npm -v
git --version
```

---

## Step 1 — Clone Repo

```bash
git clone https://github.com/abhinav-007-ind/ecotrack-ai.git
cd ecotrack-ai
```

---

## Step 2 — Install Dependencies

```bash
npm install
```

---

## Step 3 — Create Environment File

Create `.env`

```env
GEMINI_API_KEY=your_gemini_key

VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

---

## Step 4 — Firebase Setup

Enable in Firebase Console:

### Authentication
Enable:
- Google Sign-In
- Email/Password

### Firestore
Create database.

---

## Step 5 — Authorized Domains

In Firebase:

Authentication → Settings → Authorized Domains

Add:

```text
localhost
localhost:3000
localhost:5173
```

Required for Google login.

---

## Step 6 — Run App

```bash
npm run dev
```

Runs at:

```text
http://localhost:3000
```

---

## Step 7 — Verify Features

Test:
- Login
- Dashboard
- Calculator
- Leaderboard
- AI Coach
- Plant Tracker

---

# ⚠ Common Errors

---

## Unauthorized Domain Error
Add localhost in Firebase authorized domains.

---

## Firebase Not Ready
Check:
- API keys
- `.env`
- Firebase config

---

## Gemini API Error
Check:
- API key
- Billing
- Quotas

---

## Module Not Found
Run:

```bash
npm install
```

Again.

---

# 🧪 Production Build

Build:

```bash
npm run build
```

Run:

```bash
npm start
```

---

# assumptions Made

---

## Carbon Estimation
Emission factors are approximate.

Actual emissions vary depending on:
- Vehicle efficiency
- Region
- Energy source

---

## Tree Offset Model
Average tree absorption used.

Real absorption depends on:
- Tree species
- Age
- Climate

---

## User Honesty
System assumes accurate user inputs.

---

## AI Suggestions
AI recommendations are educational and advisory.

They do not replace certified environmental analysis.

---

# 🚀 Future Improvements

Planned upgrades:

- Real pollution data integration
- Satellite overlays
- Carbon prediction using ML
- IoT smart meter integration
- NGO partnerships
- Carbon credit marketplace

---

# 🏆 Innovation

EcoTrack AI combines:

✅ Carbon analytics  
✅ AI personalization  
✅ Real-time Earth visualization  
✅ Gamification  
✅ Sustainability education  

Instead of only showing numbers, the platform makes users **feel the impact**.

---

# 👨‍💻 Author

## Abhinav Punk.M

Developer | Innovator | Builder

GitHub:  
https://github.com/abhinav-007-ind

---

<div align="center">

# 🌎 Track Carbon • Change Habits • Restore Earth

</div>
