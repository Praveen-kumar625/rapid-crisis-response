# 🚀 QUICK START GUIDE - LOCAL TESTING

## ⏱️ 5-MINUTE SETUP

### 1️⃣ Prerequisites Check
```bash
# Check Node.js version (must be 18+)
node --version

# Check npm
npm --version

# Check PostgreSQL
psql --version

# Check PostGIS (must be installed in PostgreSQL)
# We'll verify this during migration
```

---

### 2️⃣ Install Dependencies

**From project root** `c:\Users\praveen\OneDrive\Desktop\hacktoskill\rapid-crisis-response`:

```bash
# Install backend dependencies
npm --prefix backend install

# Install frontend dependencies  
npm --prefix frontend install

# Verify both package-lock.json files created
ls backend/package-lock.json
ls frontend/package-lock.json
```

**If npm install fails on Windows:**
```bash
# Clear npm cache
npm cache clean --force

# Try install again
npm --prefix backend install --legacy-peer-deps
npm --prefix frontend install --legacy-peer-deps
```

---

### 3️⃣ Database Setup

**Ensure PostgreSQL is running:**

On Windows:
```bash
# Check if PostgreSQL service is running
# Services app → Look for "postgresql-x64-XX"
# OR from command line:
sc query postgresql-x64-15  # (or your version)

# Should show: STATE: 4  RUNNING
```

**Create database and run migrations:**

```bash
# Navigate to backend
cd backend

# Create .env file with database credentials
# File: backend/.env
cat > .env << 'EOF'
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000
JWT_SECRET=dev-secret-key-change-in-production

# PostgreSQL
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/crisis_response

# Google Gemini
GEMINI_API_KEY=your_gemini_api_key_here

# Redis (optional, for socket.io)
REDIS_URL=redis://localhost:6379

# Twilio (optional, for voice)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
EOF

# Run migrations (creates tables + PostGIS extension)
npm run migrate
```

**Expected migration output:**
```
✅ Knex migrations batch 1 executed
✅ PostGIS extension created
✅ incidents table created
✅ Ready for development
```

---

### 4️⃣ Start Development Server

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Expected output:
# ✅ Server listening on port 5000
# ✅ Database connected
# ✅ Socket.io ready
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
# Expected output:
# ✅ React app running on http://localhost:3000
# ✅ Webpack dev server ready
# ✅ Service Worker registered
```

**Terminal 3 - Worker (optional, for background jobs):**
```bash
cd backend
npm run worker
# For RSS feed processing + incident scheduling
```

---

### 5️⃣ Test Application

**Browser:**
```
Open http://localhost:3000
```

**Check browser console (F12):**
```javascript
// Should show:
[ReportForm] Geolocation SUCCESS: 19.1234 72.8765  // Your actual location
[ServiceWorker] Registered successfully
[API] Connected to backend on localhost:5000
```

---

## ✅ VERIFICATION CHECKLIST

### ✨ Test 1: Geolocation (Bug 1.1)

1. **Allow geolocation permission** when prompted
2. **Check console** for: `[ReportForm] Geolocation SUCCESS: <lat> <lng>`
3. **Verify coordinates** are NOT (0, 0)
4. **Submit dummy report** → Map should show your location

---

### 🤖 Test 2: AI Vision (Bug 1.2)

1. **Upload image** to report form
2. **Wait 2-3 seconds** for AI analysis
3. **Check console** for:
   ```
   [AI Service] parseJsonSafely SUCCESS: parsed JSON object
   ```
4. **Toast should show**: "🎯 AI detected: <category>"
5. **Form category auto-updated** from image analysis

---

### 🛡️ Test 3: Error Handling (Bug 1.3)

1. **Stop PostgreSQL** (Services → postgresql → Stop)
2. **Try to submit report** → Should get 500 error (JSON)
3. **Backend still running** (no crash)
4. **Restart PostgreSQL** → App recovers automatically

---

### 📱 Test 4: Offline Sync (Warning 2.1)

1. **DevTools** (F12) → **Network** tab
2. **Set to "Offline"** mode
3. **Submit report** → Toast: "Report queued offline"
4. **Close browser completely**
5. **Reopen browser** → Go online
6. **Check backend logs** for sync with floor/room/wing:
   ```
   [ServiceWorker] syncReports: floorLevel=2, roomNumber=305, wingId=south
   ```

---

### 🎥 Test 5: Multimodal Input (Warning 2.2)

1. **Select image from phone/camera** showing incident
2. **Wait for AI analysis** (2-3 seconds)
3. **Verify two toasts**:
   - `🎯 AI detected: <category>` (auto-category)
   - `📊 Severity auto-set: <1-5>/5` (auto-severity)
4. **Form fields updated** automatically
5. **Submit report** with auto-filled fields

---

### 🔐 Test 6: JWT Validation (Warning 2.3)

**Terminal - Test without auth:**
```bash
# Test endpoint without JWT
curl -X POST http://localhost:5000/incidents \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","category":"fire","lat":0,"lng":0}'

# Expected response:
# {"error":"Unauthorized: Missing or invalid JWT token"}
# Status: 401 (not 500)
```

---

## 🐛 TROUBLESHOOTING

### Node/npm issues
```bash
# Check versions
node --version  # Should be v18+ or v20+
npm --version   # Should be v9+

# If version too old:
# Download from https://nodejs.org/
# Install Node.js LTS
# Close all terminal windows
# Reopen and try again
```

### PostgreSQL connection error
```bash
# Verify PostgreSQL running
pg_isready -h localhost -p 5432

# If not running, start it:
# Windows: Services app → postgresql-x64-XX → Start
# OR: sc start postgresql-x64-15

# Check credentials in .env match your setup
# Default: postgres / postgres
```

### Port already in use
```bash
# If port 5000 or 3000 in use:

# Windows - Find process using port:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# OR change port in .env:
PORT=5001  # Use different port
```

### npm install hangs
```bash
# Clear cache + retry
npm cache clean --force
npm --prefix backend install --legacy-peer-deps --verbose
```

### Service Worker not registering
```javascript
// DevTools Console - Check:
navigator.serviceWorker.getRegistrations()

// If empty, try hard refresh:
Ctrl + Shift + R  (Windows/Linux)
Cmd + Shift + R   (Mac)
```

### Geolocation stuck at (0, 0)
```javascript
// Check browser permission:
navigator.permissions.query({name: 'geolocation'})
// Should show: state: "granted"

// If denied, reset site permissions:
// Chrome: Settings → Privacy → Site settings → Geolocation → Clear all
// Firefox: Preferences → Privacy → Permissions → Location
```

---

## 📊 Expected Output When Running

### Backend Console:
```
✅ Knex migrations OK
✅ Database connected: crisis_response
✅ API server listening on port 5000
✅ Redis connected (if configured)
✅ Socket.io ready
```

### Frontend Console (F12):
```
[ReportForm] Geolocation SUCCESS: 19.0760 72.8777
[ServiceWorker] Registered successfully
[Socket] Connected to backend
[API] Sync pending reports: 0
```

### Submit Test Report:
```
Browser toast: "✅ Incident reported successfully!"

Backend log:
[IncidentsController] create: New incident #456
[AI Service] Triage complete: spam_score=0.1, severity=4
[Socket] Broadcasting to 3 connected clients
[DB] INSERT incidents INSERT 1 row
```

---

## 🎯 Demo Workflow (Tested Path)

1. **Load app** → Allow geolocation
2. **Fill report form** with incident details
3. **Upload image** → See AI auto-detect category + severity
4. **Submit offline** (disable internet) → See "queued" notification
5. **Re-enable internet** → See auto-sync happen
6. **View map** → See incident at correct location with auto-detected priority

---

## 📞 Still Having Issues?

1. Check `FIX_STATUS_REPORT.md` for detailed verification steps
2. Check `BUGFIXES_LOG.md` for technical details on each fix
3. Review console.log messages for exact error location
4. Run with `--verbose` flag: `npm --prefix backend run dev -- --verbose`

---

**Status**: 🟢 Ready for testing  
**Estimated setup time**: 5 minutes  
**Estimated verification time**: 15 minutes

Good luck! 🚀
