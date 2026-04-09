# 🏛️ SYSTEM ARCHITECTURE
## *Rapid Crisis Response // Technical Deep-Dive*

This document outlines the high-level design and data flow of the RCR ecosystem, defining its **Ultra Level** resilience and intelligence layers.

---

## 1. High-Level Component Map

```mermaid
graph TD
    subgraph "The Edge (Hardware & Mobile)"
        Guest((Guest Mobile)) --> PWA[React PWA]
        Sensors((IoT Sensors)) --> IoTWorker[IoT Generation Pipeline]
        PWA --> IDB[(IndexedDB Cache)]
    end

    subgraph "Orchestration Layer (Backend)"
        PWA -- "Socket.io (Real-time)" --> API[Node.js Engine]
        API --> Queue[BullMQ / Redis]
        API --> DB[(PostgreSQL)]
    end

    subgraph "Intelligence Layer (Cloud)"
        Queue --> Worker[Background Processor]
        Worker --> Gemini[[Gemini 1.5 Flash]]
        Worker --> GCloud[[Google Cloud API]]
        Worker --> Twilio[[Twilio Dispatch]]
    end

    subgraph "Command Layer (Tactical)"
        API -- "WebSocket Broadcast" --> Dashboard[Tactical Commander]
        Dashboard --> Map[Crisis Map / Z-Axis Grid]
    end
```

---

## 2. Core Pipelines

### 🎙️ Voice SOS Pipeline
1.  **Capture**: `MediaRecorder API` captures audio chunks in the `PhoneModal`.
2.  **Ingestion**: Audio is Base64 encoded and POSTed to `/api/incidents/sos/voice`.
3.  **Transformation**: The backend routes the buffer to **Google Cloud Speech-to-Text** for transcription.
4.  **Localization**: If the detected language is non-English, it's processed by **Google Cloud Translation**.
5.  **Triage**: The English text is sent to **Gemini 1.5 Flash** for severity classification and category mapping.
6.  **Persistence**: A formal incident is created in PostgreSQL and broadcasted to all responders.

### 📡 Real-Time IoT Stream
1.  **Generation**: A background worker simulates hotel sensor arrays (Smoke, Heat, CO2).
2.  **Broadcast**: Data is published to a Redis channel specific to the building (`hotel_{id}_iot`).
3.  **UI Sync**: The `IndoorHeatmap` component receives the `NEW_IOT_ALERT` via Socket.io.
4.  **Routing**: The evacuation pathfinder recalculates the safest exit by dynamically avoiding rooms with high telemetry (> 80°C).

---

## 3. Resilience & Defense Layers

| Feature | Implementation | Purpose |
| :--- | :--- | :--- |
| **Crash-Proofing** | Centralized `catchAsync` & Global Error Middleware | Prevents Node.js process termination on API failure. |
| **Network Blackout** | Service Worker Background Sync + IndexedDB | Guarantees eventual delivery of SOS reports in low-signal areas. |
| **Data Integrity** | Knex.js Migrations + ACID Transactions | Ensures consistent state across multi-tenant data. |
| **API Safety** | Guard Clauses + Optional Chaining | Protects against `undefined` properties in unstable external responses. |

---

## 4. Visual Philosophy
The system adopts a **Tactical Command Center** aesthetic:
- **Palette**: `#0B0F19` (Deep Navy), `#22D3EE` (Electric Cyan), `#EF4444` (Hazard Red).
- **Feedback**: Pulsing animations for active hazards, scanning effects for floor grids.
- **Density**: High-signal visualization using Recharts and Google Maps Advanced Markers.

---

**RCR Architecture v2.0 // Ultra Level Ready**
