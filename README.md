<div align="center">

# 🚨 Rapid Crisis Response
**AI-Powered Offline-First Disaster Triage & Coordination Platform**

[![Google Solution Challenge](https://img.shields.io/badge/Google-Solution_Challenge_2026-4285F4?style=for-the-badge&logo=google)](https://developers.google.com/community/gdsc-solution-challenge)
[![Team Leader](https://img.shields.io/badge/Team_Lead-Praveen_Kumar_Jayswal-10B981?style=for-the-badge&logo=codeforces)](https://github.com/Praveen-kumar625)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

*Accelerating emergency response and crisis coordination in the Hospitality sector using Google Gemini 1.5 Flash Vision AI and Progressive Web Apps.*

</div>

---

## 📑 Table of Contents
- [The "Golden Hour" Problem](#-the-golden-hour-problem)
- [Our AI-Augmented Solution](#-our-ai-augmented-solution)
- [Key Features & USP](#-key-features--usp)
- [System Architecture](#-system-architecture)
- [Technical Differentiators (The Bulletproof Engineering)](#-technical-differentiators)
- [Monorepo Structure](#-monorepo-structure)
- [Getting Started](#-getting-started)

---

## 🌋 The "Golden Hour" Problem
During natural disasters or localized emergencies (like hotel fires), chaotic communication delays first responders. Victims often lack the means to send detailed reports without stable internet, and responders waste the critical **"Golden Hour"** manually verifying panic-driven, multilingual, or vague emergency calls instead of actively deploying resources.

---

## 💡 Our AI-Augmented Solution
**Rapid Crisis Response** bridges the gap between affected citizens (guests) and emergency responders (hotel staff/paramedics). 

Instead of relying on manual text triage, our system utilizes **Google Gemini 1.5 Flash** for instant multimodal visual/audio verification, and **PostgreSQL + PostGIS** for real-time indoor spatial clustering (Floor/Room mapping). It works even when the Wi-Fi burns down, utilizing PWA offline caching.

---

## 🚀 Key Features & USP

| Feature | Description | Google Tech Used |
| :--- | :--- | :--- |
| 👁️ **Multimodal Triage** | Victims snap a photo or record an SOS voice note. AI detects disaster type, calculates severity (1-5), and outputs an action plan. | `Gemini 1.5 Flash` |
| 🌍 **Multilingual SOS** | Hotel guests speak in their native language; AI instantly transcribes and translates it to English for staff. | `Gemini API` |
| 📴 **Offline-First PWA** | Reports are cached via IndexedDB if the network fails, auto-syncing seamlessly via Background Sync when online. | `Chrome Workbox` |
| 🏢 **Indoor Micro-Mapping** | Moving beyond basic Lat/Lng, our PostGIS database tracks specific `floor_level` and `room_number` for precision deployment. | `Google Maps API` |

---

## ⚙️ System Architecture

Our robust, fault-tolerant stack ensures zero data loss during high-stress situations.

* **Client Layer:** React.js PWA + IndexedDB (Offline Storage) + Axios.
* **Backend Processing:** Node.js + Express + Google GenAI SDK.
* **Database & GIS:** PostgreSQL + PostGIS (Spatial Indexing) managed via Knex.js.
* **Real-time Engine:** Redis + Socket.io for immediate responder dashboard updates.
* **Authentication:** Firebase Auth (Configured for persistent offline capability).

---

## 🛡️ Technical Differentiators 
*(Built to survive live demos and real-world network failures)*

<details>
<summary><b>1. Deterministic AI JSON Output (No Crashing)</b></summary>
<br>
Instead of fragile string parsing, we enforce strict JSON mode in Gemini to prevent Markdown wrapping errors.

```javascript
const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: { responseMimeType: 'application/json' }
});
# 🛠️ Rapid Crisis Response - Complete Setup & Documentation Guide

## 📋 Prerequisites
Ensure you have the following installed on your system before proceeding:
* **Node.js** (v18 or higher)
* **Docker Desktop** (Required for PostgreSQL + PostGIS & Redis)
* **Google Gemini API Key** (Get it from Google AI Studio)
* **Firebase Project** (For Responder Authentication)

