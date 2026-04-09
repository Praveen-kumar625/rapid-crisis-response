# 🦚 GEMINI PROJECT MANDATES
## *Rapid Crisis Response (RCR) // Quality & Architectural Integrity*

This document serves as the **Single Source of Truth** for the project's engineering standards. Every sub-agent and developer MUST adhere to these mandates to maintain the **Ultra Level** architecture.

---

## 🏗️ Architectural Core
1.  **Layered Separation**: Maintain strict boundaries between `Controllers`, `Services`, and `Infrastructure`. Business logic MUST NEVER live inside a Controller.
2.  **Event-Driven Offloading**: Heavy tasks (AI analysis, SMS alerts, external API syncs) MUST be offloaded to `BullMQ` processors.
3.  **Offline-First Primacy**: The frontend MUST prioritize `IndexedDB` persistence. Every SOS report is a "Signal Node" that must survive a complete network blackout.
4.  **Z-Axis Awareness**: All spatial data (Incidents, IoT) MUST include `floorLevel` and `wingId` to support 3D tactical visualization.

---

## 🛡️ Resilience Mandates
1.  **Zero-Crash Policy**: All controllers MUST use the `globalErrorHandler` and `catchAsync` wrappers.
2.  **Defensive Mapping**: Use **Optional Chaining** (`?.`) and **Nullish Coalescing** (`??`) for all external API responses (GCP, Twilio, Gemini).
3.  **Graceful Degradation**: 
    *   If Redis is down, use the `MockQueue` fallback.
    *   If GCP AI fails, create a "Manual Review" incident automatically.
4.  **Constraint-Based Validation**: Use the `validate` middleware for every POST/PATCH request to prevent TypeErrors at the service layer.

---

## 🎨 Aesthetic Standards
1.  **Mission-Critical UI**: Use the `Tactical Dark` palette.
2.  **Visual Feedback**: Every async action MUST have a state (Loading, Success, Error). Use `AnimatePresence` for fluid transitions.
3.  **Information Density**: Prioritize "Data at a Glance." Use high-contrast Badges and pulsing SVG elements for active hazards.

---

## 📖 Technical Metadata
*   **Backend Runtime**: Node.js 20+ (LTS)
*   **Frontend Engine**: React 18 (Concurrent Mode)
*   **Intelligence Layer**: Google Gemini 1.5 Flash + Cloud Speech/Translate
*   **State Persistence**: PostgreSQL + Redis (Sync) + IndexedDB (Local)

**Maintain the standard. Seconds save lives.**
