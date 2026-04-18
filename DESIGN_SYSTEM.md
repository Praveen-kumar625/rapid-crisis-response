# Rapid Crisis Response (RCR) - Design System
*Version 4.2.0_ULTRA (Intelligence-Driven)*

## Core Philosophy: "The Golden Hour Reclaimed"
UI/UX prioritized for zero-distraction situational awareness. Every millisecond of cognitive load saved is a life protected.

## 1. Color Palette: "Midnight Void & Cyber Pulse"
High-contrast, low-strain tactical colors.

| Token | Hex | Role | Visual Logic |
| :--- | :--- | :--- | :--- |
| **VOID_BG** | `#020617` | Main Background | Absorb distractions |
| **PULSE_CYAN** | `#00f0ff` | Primary / Active | Uplink status & interaction |
| **ALARM_RED** | `#ff3366` | Emergency / SOS | Immediate action required |
| **WARN_AMBER** | `#f59e0b` | Caution / Pending | Degradation warning |
| **LINK_EMERALD** | `#10b981` | Stable / Secured | Nominal operation |
| **GLASS_SURFACE**| `rgba(15,23,42,0.6)` | UI Panels | Layered situational depth |

## 2. Typography: "Monospace Precision"
Optimized for readability in high-stress environments.

- **Primary Typeface:** `Inter` (Variable) - High legibility for body.
- **Tactical Typeface:** `JetBrains Mono` - For coordinates, IDs, and system logs.
- **Visual Style:** 
  - Labels: `10px`, Uppercase, `tracking-[0.25em]`, Black Weight.
  - Data: `Tabular Nums` to prevent shifting during real-time updates.

## 3. UI Components (Standardized)
- **Buttons:** `TacticalButton.jsx` (Snake / Glitch variants).
- **Cards:** `glass-panel` (backdrop-blur-xl, border-white/5).
- **Icons:** `lucide-react` (Stroke: 1.5px for precision).

## 4. Visual Signatures
- **Scanlines:** Subtle overlay animations to indicate "Live" data state.
- **Neon Glows:** `text-glow-cyan` used only for high-priority active links.
- **LCD Readouts:** High-contrast backgrounds for sensor telemetry.
