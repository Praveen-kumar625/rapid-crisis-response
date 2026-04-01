# Rapid Crisis Response

A full-stack emergency reporting platform with offline support, multimodal AI incident analysis (image/video), and real-time responder mapping.

---
## 🚀 What it does
- Real-time incident reporting + board
- Map-driven responder routing (Google Maps)
- AI-enriched incident classification (Gemini 1.5 Flash style inference)
- Action plan and required resources per incident
- Image/Video upload in report form
- Offline reporting with IndexedDB + Background Sync
- WebSocket updates for incident events
- PostGIS spatial storage and query

---
## 🧩 Architecture
- **Frontend** (CRA + React)
  - `frontend/src/components/ReportForm.js`
  - `frontend/src/components/CrisisMap.js`
  - `frontend/src/pages/Dashboard.js`, `MapPage.js`, etc.
  - `frontend/src/api.js` (attached Auth0/Firebase bearer token)
  - `frontend/src/idb.js` (offline queue store)
  - `frontend/public/service-worker.js` (background sync, offline queue)

- **Backend** (Node+Express+Knex+PostgreSQL+Redis)
  - `backend/src/index.js` service + middleware
  - `backend/src/routes/incidents.routes.js`
  - `backend/src/controllers/incidents.controller.js`
  - `backend/src/services/incident.service.js`
  - `backend/src/services/ai.service.js` (Gemini + fallback)
  - `backend/src/services/socket.service.js`
  - `backend/src/migrations/001_initial_schema.js` (postgis + expanded fields)
  - `backend/src/middleware/auth.js` (demo-mode + Firebase JWT)

---
## ⚙️ Prerequisites
- Node.js 20+ / npm 10+
- Docker + docker-compose (recommended)
- PostgreSQL with PostGIS + Redis
- Google Maps API key (for map rendering)
- Optional: Firebase service account key + gemini API key

---
## 🛠️ Installation
```bash
cd rapid-crisis-response
npm install
npm run migrate     # backend DB migration
```

### Docker option
```bash
docker compose up -d
npm run migrate
```

---
## ▶️ Run in dev
```bash
# Start backend + worker + frontend in parallel
npm run dev
```

or start manually:
```bash
cd backend && npm start
cd frontend && npm start
```

Open:
- http://localhost:3000 (frontend)
- http://localhost:3001/health (API)

---
## 🗂️ Environment variables
`./.env` (repo root) and `backend/.env`:
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS`
- `REDIS_HOST`, `REDIS_PORT`
- `PORT_API`, `PORT_WEB`
- `DEMO_MODE=true` (to bypass Firebase auth)
- `GEMINI_API_KEY`
- `FIREBASE_PROJECT_ID`, `GOOGLE_APPLICATION_CREDENTIALS`
- `REACT_APP_GOOGLE_MAPS_API_KEY` etc.

---
## ✨ Feature walkthrough
### Report form (frontend)
- Title, description, category, severity slider
- Media capture (camera/photo/video)
- Base64 conversion for embedded persistence
- AI analysis trigger to prefill category/severity
- Offline queue writes to IndexedDB
- Background sync register on offline save

### API routes
- `GET /incidents` list with PostGIS filter
- `POST /incidents/analyze` prefill AI 
- `POST /incidents` create new report
- `PATCH /incidents/:id/status` update status

### AI service (backend)
- `analyzeReport()` returns JSON:
  - `spam_score`, `auto_severity`, `predictedCategory`
  - `actionPlan`, `recommendedResources`
  - fallback if no Gemini key
- Used by `IncidentService.create` to store AI insights

### Data model
`incidents` table includes:
- `title`, `description`, `category`, `severity`, `status`
- `location` (PostGIS point)
- `spam_score`, `auto_severity`
- `ai_action_plan`, `ai_required_resources` (jsonb)
- `media_type`, `media_base64`

---
## 🧾 Validation
- `npm run build:web` passes (CRA production build)
- `backend` server now starts if `DB & Redis` are reachable
- `npx react-scripts build` works with `browserslist` config

---
## 🛡️ Troubleshooting
- `EADDRINUSE 3001`: stop other service and restart backend.
- `ECONNREFUSED` (postgres/redis): ensure containers/services running.
- `@google/generative-ai` missing: `npm install @google/generative-ai`.
- `react-scripts` not found: `npm install` under `frontend`.

---
## 🏁 What to test
1. Upload photo in report.
2. AI returns category/severity, action plan, resource list.
3. Incident appears on map as a pin.
4. Click pin shows resource plan details in bottom overlay.
5. Go offline: submit incident; come online: auto-sync via Background Sync.
6. `GET /incidents` includes `actionPlan`/`requiredResources` fields.

---
## 📦 File links (key files)
- `frontend/src/components/ReportForm.js`
- `frontend/src/components/CrisisMap.js`
- `frontend/public/service-worker.js`
- `backend/src/services/ai.service.js`
- `backend/src/services/incident.service.js`
- `backend/src/controllers/incidents.controller.js`
- `backend/src/routes/incidents.routes.js`
- `backend/src/migrations/001_initial_schema.js`

---
## 🙌 Notes for winning
the hackathon:
- Highlight multimodal AI (camera/photo analysis) in demo.
- Mention offline reliability polish (Background Sync + IndexedDB).
- Show real-time map updates + action plans + resource dispatch.
- Keep demo cases short and impact-driven (FIRE/FLOOD from quick image to resource suggestion).
