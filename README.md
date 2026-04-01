<div align="center">
  
  # 🚨 Rapid Crisis Response
  
  **AI-Powered Real-Time Disaster Management & Responder Coordination Platform**

  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)
  [![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
  [![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
  [![Gemini AI](https://img.shields.io/badge/AI-Gemini_1.5_Flash-orange.svg)](https://deepmind.google/technologies/gemini/)

  <p align="center">
    <a href="#-about-the-project">About</a> •
    <a href="#-features">Features</a> •
    <a href="#-tech-stack">Tech Stack</a> •
    <a href="#-getting-started">Setup Guide</a>
  </p>
</div>

---

## 📖 About the Project

Rapid Crisis Response is a comprehensive platform designed to bridge the gap between affected citizens and emergency responders during critical situations. By leveraging **Google Gemini AI** for incident verification and **Google Maps / PostGIS** for real-time spatial tracking, it ensures help reaches where it is needed most, efficiently and safely.

---

## ✨ Features

- **🗺️ Live Interactive Map:** Real-time clustering and visualization of incidents using Google Maps API.
- **🤖 AI Spam Detection & Severity:** Gemini 1.5 Flash automatically analyzes incident descriptions to filter out spam and assign appropriate severity levels.
- **📡 Offline-First Reporting:** Queue reports without an internet connection; auto-syncs when online via IndexedDB.
- **🔐 Secure Authentication:** Seamless user login and management powered by Firebase Auth.
- **🚨 Automated Alerts:** Twilio integration for high-severity SMS broadcasting to critical responders.
- **📊 Admin Dashboard:** Data visualization with Recharts for analyzing disaster categories and response rates.

---

## 🛠 Tech Stack

### Frontend
- **Framework:** React.js
- **Mapping:** @vis.gl/react-google-maps
- **PWA:** Workbox & IndexedDB
- **Auth:** Firebase Authentication

### Backend
- **Server:** Node.js & Express.js
- **Database:** PostgreSQL with PostGIS (via Knex.js)
- **Real-time:** Socket.io & Redis
- **AI Integration:** Google Generative AI (Gemini)

---

## 🚀 Getting Started

Follow these instructions to set up the project locally.

### 1️⃣ Prerequisites
- **Node.js** (v20.x LTS)
- **Docker & Docker-Compose** (for PostgreSQL + Redis)
- **Git**

### 2️⃣ Clone the Repository
```bash
git clone https://github.com/Praveen-kumar625/rapid-crisis-response.git
cd rapid-crisis-response
npm install
npm run dev
npm start
