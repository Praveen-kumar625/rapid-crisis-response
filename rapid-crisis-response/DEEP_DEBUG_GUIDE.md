# 🔍 DEEP DEBUG GUIDE - DEMO TROUBLESHOOTING

For when things go wrong during live demo. Use this guide to diagnose and fix issues in real-time.

---

## 🚨 CRITICAL ISSUE: Geolocation Showing (0, 0)

### Symptom
- Form submits at latitude 0, longitude 0 (Null Island)
- Map shows incident at wrong location
- Backend shows: `"lat": 0, "lng": 0`

### Root Causes & Fixes

| Root Cause | How to Check | How to Fix |
|-----------|------------|-----------|
| Permission denied | Browser console: `navigator.permissions.query({name: 'geolocation'})` shows `denied` | Clear site permissions in browser settings; reload page; grant permission |
| Network is HTTPS required | App on `http://` instead of `https://` | For demo, use `localhost` (HTTP allowed); production needs HTTPS |
| Timeout too short | Check backend log timing | Increase timeout: edit `frontend/src/components/ReportForm.js` line 45: change `timeout: 10000` to `timeout: 30000` |
| useEffect not triggered | DevTools → React → ReportForm → Check `position` state | Force component remount: refresh page `Ctrl+R` |

### Quick Debug in Browser Console
```javascript
// Check if geolocation available:
'geolocation' in navigator  // Should be true

// Get current position manually:
navigator.geolocation.getCurrentPosition(
  (pos) => console.log('LAT:', pos.coords.latitude, 'LNG:', pos.coords.longitude),
  (err) => console.log('ERROR:', err.message)
);

// Check if permission granted:
navigator.permissions.query({name: 'geolocation'})
  .then(result => console.log('Permission:', result.state))
```

### During Live Demo (60-second fix)
```bash
# If geolocation not working on demo machine:
# 1. Open browser console
# 2. Check permissions status (above)
# 3. If denied, clear site permissions and reload
# 4. If still failing, use manual coordinates:

# Terminal - Patch coordinates temporarily:
# Edit frontend/src/components/ReportForm.js line 47
# Add fallback: setPosition({ lat: 19.0760, lng: 72.8777 });  # Demo location

# Reload browser
```

---

## 💥 CRITICAL ISSUE: Backend Crashes on AI Request

### Symptom
- Submit image → timeout
- Backend console: `SyntaxError: Unexpected token < in JSON at position 0`
- Backend server stops responding
- New requests hang

### Root Cause Analysis

```javascript
// ❌ BEFORE FIX: Raw Gemini response might be HTML error (not JSON)
const rawResponse = "```json\n{\"spam_score\": 0.1}\n```";  // Markdown wrapped
JSON.parse(rawResponse)  // 💥 SyntaxError!

// ✅ AFTER FIX: Safe parsing
const cleaned = rawResponse
  .replace(/^```json\s*/, '')  // Remove opening backticks
  .replace(/\s*```$/, '');     // Remove closing backticks
JSON.parse(cleaned)  // ✅ Works!
```

### Debug Steps

**Backend Console Check:**
```bash
# Look for these logs:
[AI Service] parseJsonSafely SUCCESS: parsed JSON object  # ✅ Good
[AI Service] parseJsonSafely FATAL: SyntaxError           # ❌ Bad

# If you see ❌ FATAL, the fix isn't working
```

**Verify Fix is Applied:**
```bash
# Check file content:
grep -n "parseJsonSafely" backend/src/services/ai.service.js

# Should show line 42 has the markdown stripping code
# If not present, the file wasn't updated
```

**Quick Fix (60-second patch):**
```bash
# Edit backend/src/services/ai.service.js
# Find: function parseJsonSafely(raw) {
# Find the block at line 42-60

# Make sure it has:
if (text.startsWith('```json')) {
    text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
}

# If missing, add it after line 50

# Save and restart backend:
# Terminal where backend running: Ctrl+C
# npm run dev
```

**Verify Gemini Model Config:**
```bash
# Check line 92 in ai.service.js:
generationConfig: { responseMimeType: 'application/json' }

# This prevents Gemini from wrapping response in markdown
# If missing, add it to model initialization
```

### During Live Demo (2-minute fix)
```bash
# If backend crashes on AI request:

# 1. Check backend console for "parseJsonSafely FATAL"
# 2. If present, geolocation/analyze endpoint is using old code

# 3. Temporarily bypass AI:
# Edit backend/src/controllers/incidents.controller.js
# In analyze() function, add at top:
return res.json({ 
    spam_score: 0.5, 
    auto_severity: 3,
    detected_language: 'en' 
});

# 4. Restart backend
# 5. Demo form submission (will use defaults instead of AI)
# 6. Later: fix the parseJsonSafely code properly
```

---

## 🔐 CRITICAL ISSUE: Backend Returns 500/Crashes on Auth

### Symptom
- Submit report → 500 error: `Cannot read property 'sub' of undefined`
- Backend console: `TypeError: Cannot read property 'sub' of undefined`
- Backend server crashes or hangs

### Root Cause
JWT middleware not validating `req.user` before controller uses it

### Debug Steps

**Check JWT Middleware:**
```bash
# Verify middleware applied to /incidents route
# File: backend/src/routes/incidents.routes.js

# Should show:
router.post('/', authMiddleware, incidentsController.create);
#                ^^^^^^^^^^^^^^^ JWT middleware before controller
```

**Check Controller Has Guard Clause:**
```bash
# File: backend/src/controllers/incidents.controller.js
# Line 25-28 should show:

if (!req.user || !req.user.sub) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid JWT token' });
}

# If not present, add it at start of create() function
```

**Send Test Request to Check:**
```bash
# Terminal:
curl -X POST http://localhost:5000/incidents \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","category":"fire","lat":0,"lng":0}'

# Expected if fixed: 401 with error message
# Bad if not fixed: 500 with TypeError in backend console
```

### During Live Demo (90-second fix)
```bash
# If demo machine throws 401/500 on auth:

# 1. Check backend console: Does it show TypeError?
# 2. If yes, add guard clause:

# Edit backend/src/controllers/incidents.controller.js line 25:
exports.create = async(req, res) => {
    try {
        // 🚨 ADD THIS:
        if (!req.user || !req.user.sub) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        
        // Rest of function...

# 3. Restart backend
# 4. Test again
```

---

## 📴 CRITICAL ISSUE: Offline Sync Not Working

### Symptom
- Submit offline → Toast says queued
- Go online → Incident doesn't sync
- Reload page → Queued report gone
- No error messages

### Root Cause Analysis

**Service Worker Not Registered:**
```javascript
// Check in browser DevTools:
// DevTools → Application → Service Workers

// Should show: 
// http://localhost:3000/service-worker.js - activated and running

// If:
// - ❌ Not listed: Service Worker not registered
// - ❌ Redundant: Old version, clear cache
// - ❌ Stopped: Click "Unregister" then refresh
```

**Background Sync Not Triggered:**
```javascript
// Check DevTools → Application → Service Workers → Sync
// Should show: sync-reports registered

// If empty:
// 1. Service Worker not registered
// 2. Browser doesn't support Background Sync (old browsers)
```

### Debug Steps

**Verify Service Worker Registered:**
```javascript
// Browser console:
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('Service Workers:', regs.length);
  regs.forEach(r => console.log(r.scope, r.active ? 'ACTIVE' : 'inactive'));
});

// Expected: Shows scope /rapid-crisis-response with ACTIVE
```

**Manually Trigger Sync:**
```javascript
// Browser console:
navigator.serviceWorker.ready.then(reg => {
  reg.sync.register('sync-reports').then(
    () => console.log('✅ Sync registered'),
    (err) => console.log('❌ Sync failed:', err)
  );
});
```

**Check IndexedDB Has Queued Reports:**
```javascript
// Browser console - Open IndexedDB viewer:
// DevTools → Application → Storage → IndexedDB → database → incidents

// Should show queued reports with:
// - title, description, lat, lng, floorLevel, roomNumber, wingId
// - mediaBase64 if image was attached

// If empty: Reports not being queued (check api.post in ReportForm)
```

### During Live Demo (3-minute fix)
```bash
# If offline sync not working:

# Option 1: Force sync manually
# DevTools → Application → Service Workers → click "sync-reports" → Run

# Option 2: Trigger via JavaScript
# DevTools Console:
navigator.serviceWorker.ready.then(r => r.sync.register('sync-reports'))

# Option 3: Unregister and re-register Service Worker
# DevTools → Application → Service Workers → Unregister
# Hard refresh: Ctrl+Shift+R
# Wait 3 seconds for re-registration

# Option 4: If Browser doesn't support Sync (old browser)
# Open DevTools → Console → Check:
'SyncManager' in window  // Should be true

# If false: Browser too old, use manual refresh instead
```

---

## 🎬 CRITICAL ISSUE: Image Upload / AI Vision Not Working

### Symptom
- Upload image → Form hangs 5+ seconds
- No toast appears
- Backend console: no AI analysis logs
- Form still shows old values (no auto-update)

### Root Cause Analysis

| Scenario | Check | Fix |
|----------|-------|-----|
| File too large | Check file size warning | Upload image < 5MB |
| Gemini API key invalid | Backend console: `Forbidden` error | Verify `GEMINI_API_KEY` in `.env` is correct |
| Gemini quota exceeded | Backend log: `Rate limit exceeded` | Wait 1 hour or upgrade Gemini plan |
| Network timeout | Browser Network tab: request hangs | Increase timeout or check internet |
| AI Service broken | Backend shows "AI analysis failed" | Check backend logs for exception |

### Debug Steps

**Check File Size:**
```javascript
// Browser console:
const file = document.querySelector('input[type="file"]').files[0];
console.log('File size:', file.size / 1024 / 1024, 'MB');

// Should be < 5 MB
// If > 5 MB: File too large, select smaller image
```

**Check API Request:**
```javascript
// DevTools → Network tab → filter "analyze"
// Click the request that says "POST /incidents/analyze"
// Check:
// - Status: 200 (good) or 500 (bad)
// - Response: {...analysis JSON...} or error message
```

**Check Backend Logs for Gemini Issues:**
```bash
# Terminal where backend running:
# Look for:
[AI Service] Gemini API call...  # ✅ Good
[AI Service] Gemini error: 403  # ❌ Quota exceeded
[AI Service] parseJsonSafely FATAL  # ❌ Response parse error
```

**Verify GEMINI_API_KEY:**
```bash
# Terminal:
# Check .env file has valid key:
cat backend/.env | grep GEMINI_API_KEY

# Should show:
GEMINI_API_KEY=sk-proj-xxxxxxxxxxx

# If empty or invalid:
# 1. Get new key from https://makersuite.google.com/app/apikey
# 2. Update backend/.env
# 3. Restart backend: Ctrl+C then npm run dev
```

### During Live Demo (2-minute fix)
```bash
# If image upload hangs:

# Option 1: Skip AI analysis temporarily
# DevTools Console:
// Patch the handleMediaChange to skip API call
window.skipAiAnalysis = true;

# Option 2: Upload smaller image
# Try image < 1MB instead

# Option 3: Use fallback defaults
# Edit backend/src/controllers/incidents.controller.js
# In analyze() function, comment out Gemini call:
/*
const analysis = await IncidentService.analyze({...});
*/
// Return defaults:
return res.json({ 
    spam_score: 0.5, 
    auto_severity: 3,
    detected_language: 'en' 
});

# 4. Restart backend
# 5. Demo form (image upload will work, just use defaults)
```

---

## 🗺️ CRITICAL ISSUE: Map Not Showing Incidents

### Symptom
- Submit incident → Toast says success
- Reload page → Map is empty
- Backend console shows incident saved to DB
- Map component not rendering incidents

### Root Cause Analysis

```
Possible causes:
1. CrisisMap.js not fetching from /incidents endpoint
2. Map component not mounted correctly
3. Geolocation causing map not to center
4. API response format wrong
```

### Debug Steps

**Check API Response:**
```javascript
// Browser console:
fetch('http://localhost:3000/api/incidents').then(r => r.json()).then(d => {
  console.log('Incidents from API:', d);
  // Should show array of incidents with: lat, lng, title, etc
});
```

**Check Map Renders Incidents:**
```javascript
// DevTools → React DevTools
// Find CrisisMap component
// Check props.incidents array

// If empty: API not called or incidents not fetched
// If populated: Check map rendering logic
```

**Common Issues in `CrisisMap.js`:**
```javascript
// Issue 1: Wrong query parameter
// ❌ /incidents?filter=active  (filter not supported)
// ✅ /incidents  (no filter, or use ?bbox=...)

// Issue 2: Map not centered
// Check: const mapCenter = { lat: center?.[1], lng: center?.[0] };
// Should be: lat, lng (NOT reversed)

// Issue 3: Markers not appearing
// Check: map.addLayer() called with correct GeoJSON format
```

### During Live Demo (90-second fix)
```bash
# If map empty:

# Option 1: Check API working
# Terminal:
curl 'http://localhost:3000/api/incidents' | head -20

# Option 2: Manually add test incident
# Terminal:
curl -X POST http://localhost:3000/api/incidents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dummy-token" \
  -d '{
    "title": "Demo Fire",
    "category": "fire",
    "lat": 19.0760,
    "lng": 72.8777,
    "priority": 5
  }'

# Option 3: Check React component
# DevTools → React DevTools → CrisisMap
# Check if incidents prop has data

# If still empty:
# Temporarily patch CrisisMap.js to show hardcoded test incident

# Option 4: Full nuclear option - restart frontend
# Terminal: Ctrl+C
# npm start
# Wait for rebuild
```

---

## 📊 QUICK REFERENCE - Common Error Codes

| Code | Cause | Fix |
|------|-------|-----|
| 400 | Missing required fields | Check form has: title, category, lat, lng |
| 401 | Invalid JWT / No permission | Ensure auth header present + JWT valid |
| 500 | Server error / exception | Check backend console for stack trace |
| 429 | Rate limit exceeded (Gemini) | Wait or upgrade API plan |
| 504 | Gateway timeout | Backend not responding, restart it |

---

## 🆘 EMERGENCY DEMO FALLBACK

If everything is broken 10 minutes before demo:

**Option 1: Use Prerecorded Demo**
```bash
# Use screenshot or video of working app
# Show the code changes instead of live demo
# Explain fixes verbally with code walkthrough
```

**Option 2: Simplified Demo**
```bash
# Skip geolocation - use hardcoded coordinates
# Skip AI vision - show manual form filling
# Skip offline sync - demo online-only flow
# Still demonstrates core: incident reporting + mapping
```

**Option 3: Backend-Only API Demo**
```bash
# Use Postman/curl to demo API endpoints
# Show: POST /incidents creates incident
# Show: GET /incidents returns all incidents
# Show: POST /incidents/analyze does AI triage
# Skip frontend UI
```

---

## 📈 PERFORMANCE TIPS FOR DEMO

| Issue | Impact | Fix |
|-------|--------|-----|
| Map loads slow | Looks broken | Limit incidents to last 100: add `LIMIT 100` to query |
| AI response 5+ seconds | Audience thinks app hung | Disable AI during demo, hardcode response |
| Background noise | Distraction | Mute microphone during Voice SOS demo |
| Network latency | Timeouts | Use localhost (not remote server) |
| Browser tabs open | Memory issues | Close other tabs before demo |

---

**Last Updated**: Session Final  
**Status**: 🟢 Ready for deployment  

**Remember**: When demoing live, keep a backup terminal ready to restart services at any moment.

Good luck! 🍀
