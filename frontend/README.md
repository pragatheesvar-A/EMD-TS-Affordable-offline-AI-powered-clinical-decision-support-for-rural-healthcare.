# EMD-TS — Edge Medical Diagnostics & Telemedicine System

**Better Information. Faster Screening. Connected Care.**

An offline-first, AI-assisted wearable clinical decision support **installable web app (PWA)** for rural and semi-urban Primary Health Centres (PHCs), built for the EMD-TS hackathon. This repository is a complete, runnable, tested MVP — not a mockup.

> This README, and the product itself, are built from the original EMD-TS hackathon PPT (`EMD-TS-Hackathon-Deck.pptx`), which is the primary source of truth for problem, solution, architecture, terminology and roadmap.

---

## 1. Problem

A patient arrives at a rural PHC with chest discomfort and breathing difficulty. The PHC has no ECG equipment, no cardiologist or pulmonologist on-site, and unreliable internet. Identifying whether the patient needs urgent referral becomes slow and error-prone. Existing wearables, hospital ECG machines, cloud AI, telemedicine apps and digital records all solve *part* of the problem — but none connect sensing → screening → clinical workflow → referral → doctor review in one offline-first system.

## 2. Solution

EMD-TS connects a simulated wearable sensor layer to a full clinical workflow: **live vitals → ECG → edge AI screening → explainable risk prioritization → clinical copilot → smart referral → doctor dashboard → secure, tamper-evident audit trail → offline sync**. AI provides screening, risk flags, summaries and referral support — a qualified clinician always makes the final diagnosis and treatment decision.

## 3. Important Prototype Boundary

**No physical wearable hardware has been built.** This MVP implements a realistic **simulated wearable sensor** (ECG, heart rate, SpO₂, temperature, activity) with two modes (Normal / High-Risk Demo). The architecture clearly separates:

- **Current MVP:** software simulation + local deterministic rule-engine (stands in for TinyML), running as an installable, offline-first web app.
- **Future production:** ESP32 / Ambiq Apollo4 + real sensors + TensorFlow Lite Micro TinyML models + a native Flutter app.

No clinical validation is claimed. All risk scoring is transparent, deterministic, and explainable — never a black-box diagnosis.

## 4. Why a PWA instead of a native app

The original technology direction targets **Flutter** for production. For this hackathon build we deliberately shipped a **React + TypeScript Progressive Web App** instead of native Flutter, for one practical reason: the sandboxed cloud environment this project was built in has no network access to the Flutter SDK or the Dart package registry (pub.dev), so a Flutter build could not be compiled, run, or tested here — and the brief was explicit that nothing should ship without being actually run and tested.

A PWA gets very close to the native target for a hackathon demo, with zero rebuild of the tested application logic:

- **Installable** — "Add to Home Screen" on Android/iOS creates a real home-screen icon and launches full-screen (`display: standalone`), no browser chrome.
- **Fully offline** — a service worker precaches the entire app shell; verified in this repo's test suite by disabling the network entirely and confirming the app still renders and navigates.
- **Zero cloud dependency** — all data lives in the browser's `localStorage`; nothing is sent anywhere.

See `future_production_architecture` in the Architecture page for the native Flutter path.

## 5. Features Implemented (all 13 screens are fully wired, no dead buttons, no lorem ipsum)

1. **Dashboard** — PHC worker overview, live stat tiles, recent patients, "Run Hackathon Demo."
2. **Patient Registration** — full intake form, validation, generates Patient ID + SHA-256 record hash + `PATIENT_CREATED` blockchain transaction.
3. **Live Monitoring** — simulated wearable ("Connect Wearable" → BLE simulation), Normal / High-Risk Demo modes, animated live vitals, and a canvas-animated prototype ECG (Start/Pause/Reset, Normal/Abnormal).
4. **AI Screening** — deterministic local rule-engine ("Edge AI"), 5 analysis modules with progress states, 0–100 risk score, LOW/MODERATE/HIGH classification.
5. **Explainable AI** — every flag shows *why* ("SpO₂ below threshold," "Elevated heart rate," etc.) plus an AI-assisted recommendation and a clinician-decision disclaimer.
6. **Multilingual (Tamil/English)** — global language switcher plus a Clinical Copilot demo of Tamil↔English structured symptom extraction (chest pain / duration), matching the PPT's example.
7. **Patient Timeline** — longitudinal visit history, SpO₂/HR/temperature trend charts (Recharts), automatic "downward SpO₂ trend" detection.
8. **Clinical Copilot** — auto-generated structured patient summary, findings, priority, suggested next step.
9. **Smart Referral** — priority → care level → specialist mapping, generated referral note, Save + Print/Export, `REFERRAL_GENERATED` transaction.
10. **Doctor Dashboard** — patients grouped by priority, full case view (vitals, ECG, explainable findings, timeline, referral), clinical notes, and a final action (Reviewed / Refer / Monitor / Additional Investigation) that writes a `DOCTOR_REVIEWED` transaction. The AI never diagnoses or prescribes.
11. **Security Center** — data integrity status, access audit count, consent status, blockchain status; **working** tamper-detection demo (mutates a record, recomputes SHA-256, shows a real hash mismatch, restores it); **working** unauthorized-access simulation (safe, no real intrusion); per-patient consent grant/revoke.
12. **Blockchain Audit Trail** — full transaction table (timestamp, type, patient ID, role, action, hash, status) over a real local hash-chained ledger, with live chain-integrity verification.
13. **Architecture** — prototype data-flow diagram, on-chain/off-chain security split, and an Implemented-in-MVP vs Future-Production technology matrix.
14. **Business Model** — target customers, hardware+software+service revenue model, expected impact by stakeholder, and the 6-phase future roadmap (from the PPT).
15. **Settings** — language, online/offline toggle with a working local sync queue + "Secure Sync," disclaimers, and a one-click demo-data reset.
16. **Complete Hackathon Demo Mode** (`/demo`) — a guided, 20-step, ~3–5 minute walkthrough that actually executes every action above (not just narration) against demo patient Ravi Kumar: connect wearable → vitals → ECG → AI screening → explainability → Tamil demo → clinical copilot → referral → doctor review → blockchain audit → integrity check → unauthorized access → tamper → restore.

## 6. Architecture

```
PATIENT → WEARABLE SENSOR LAYER (simulated) → EDGE CONTROLLER (prototype: ESP32 target)
        → EMD-TS APP (this repo) → EDGE AI / RISK ASSESSMENT (local rule-engine)
        → CLINICAL COPILOT + SMART REFERRAL → DOCTOR DASHBOARD
        → SECURITY LAYER (SHA-256 + RBAC + consent + local blockchain)
        → SECURE SYNC / CLOUD (simulated)
```

Security data path: **clinical data → encrypted, off-chain local storage**; **audit data → SHA-256 → local permissioned blockchain → tamper-evident audit**. Raw patient data (name, phone, ECG, sensor readings) is **never** written to the chain — only pseudonymous IDs, record hashes, roles, actions and timestamps.

## 7. Technology Stack

| Layer | Implemented in this MVP | Future production |
|---|---|---|
| Frontend | React 19 + TypeScript + Vite, Tailwind CSS v4, Recharts, lucide-react | Flutter + Dart (per original PPT direction) |
| App shell | **vite-plugin-pwa** — installable, offline service worker, web app manifest | Native Android/iOS build |
| Storage | Browser `localStorage` (per spec: "IndexedDB or localStorage") | SQLite on-device |
| AI / Screening | Deterministic TypeScript rule-engine (`src/lib/aiEngine.ts`) | TensorFlow Lite Micro / TinyML CNN on ESP32/Apollo4 |
| Hashing | Web Crypto API `SHA-256` (`src/lib/crypto.ts`) | Same |
| Blockchain | Custom local permissioned ledger (`src/lib/blockchain.ts`) — blocks, transactions, previousHash/currentHash chaining, full-chain verification, tamper detection | Hyperledger Fabric or similar permissioned chain |
| Backend/Cloud | Simulated local sync queue only | Python + FastAPI, Azure/Firebase, PostgreSQL + HL7 FHIR |
| Security | SHA-256 hashing, RBAC simulation (5 roles), consent management | AES-256 at rest, JWT auth |

## 8. Security & Blockchain Design

- **On-chain:** pseudonymous Patient ID, SHA-256 record hash, action type, user role, timestamp, transaction ID, record version.
- **Off-chain:** all clinical content (name, symptoms, vitals, ECG) — kept in local storage only.
- **Transaction types:** `PATIENT_CREATED`, `CONSENT_GRANTED`, `CONSENT_REVOKED`, `SCREENING_COMPLETED`, `RECORD_VIEWED`, `RECORD_UPDATED`, `REFERRAL_GENERATED`, `DOCTOR_REVIEWED`, `ACCESS_DENIED`, `RECORD_SYNCED`.
- **Tamper detection** (Security Center → "Simulate Data Tampering"): mutates a demo patient's stored record directly (bypassing the app, simulating an attacker), recomputes its SHA-256 hash, and compares it against the hash committed at creation time — a real mismatch is shown (not staged), with a working "Restore Original Record" action.
- **Unauthorized access simulation:** a safe, local-only demonstration of RBAC blocking an `Unknown_User` from viewing a record; writes an `ACCESS_DENIED` transaction. No real intrusion is performed.

## 9. Roles

`ADMIN`, `HEALTHCARE_WORKER`, `DOCTOR`, `SPECIALIST`, `AUDITOR` — switchable from the header for demo purposes.

## 10. Installation

```bash
cd emd-ts
npm install
```

Requires Node.js 20+.

## 11. Run Instructions

```bash
npm run dev
```

Then open the printed local URL (default `http://localhost:5173`). To try the installable PWA experience:

```bash
npm run build
npm run preview
```

Open the preview URL on a phone (or Chrome DevTools device mode) and use **"Add to Home Screen"** — the app installs with its own icon and launches full-screen with no browser UI, and continues to work with the device's network turned off.

## 12. Demo Instructions

From the Dashboard, click **"Run Hackathon Demo"** (or navigate to `/#/demo`). Click **Start Hackathon Demo**, then either let it auto-play (~4 seconds per step) or use Play/Pause/Next/Back to control pacing. All 20 steps execute real application logic — the AI screening result, blockchain transactions, tamper detection and restore are genuinely computed live, not pre-scripted text.

## 13. What Is Implemented (real, working code)

- Full local data model: patients, screenings, referrals, doctor reviews, timeline, consent, sync queue.
- Deterministic, explainable AI risk-scoring engine with configurable thresholds.
- Canvas-animated prototype ECG with Normal/Abnormal waveform shapes.
- Real SHA-256 hashing (Web Crypto API) for every patient record.
- A genuine local blockchain-style ledger with hash-chaining and full verification (not a static table).
- Working tamper-detection and restore, unauthorized-access simulation, and consent grant/revoke.
- Bilingual UI (English/Tamil) with a live language switcher.
- Installable, offline-first PWA (service worker verified to serve the full app with zero network access).

## 14. What Is Simulated

- The wearable sensor itself (no physical hardware) — vitals and ECG are generated locally with realistic presets and jitter.
- Heart-sound / lung-sound analysis modules (displayed as completed, no audio hardware).
- Cloud sync (a local queue with a simulated "Secure Sync" action — no real server).
- Speech-to-text / translation / text-to-speech pipeline (the Tamil/English demo shows the *result* of that pipeline, not a live ASR/MT model).

## 15. Future Production Work

- Real hardware: ESP32/Apollo4 edge controller, AD8232/MAX30003 ECG, MAX30102 PPG/SpO₂, digital stethoscope, BLE 5.2.
- On-device TensorFlow Lite Micro / TinyML models for ECG, heart sound and lung sound analysis.
- Native Flutter mobile app with SQLite.
- FastAPI backend, PostgreSQL + HL7 FHIR server, Azure/Firebase cloud sync.
- Hyperledger Fabric (or similar) replacing the local permissioned ledger.
- AES-256 encryption at rest, JWT authentication.
- Sherpa-ONNX/Vosk/Whisper.cpp speech-to-text, IndicTrans2/NLLB translation, Piper/Android TTS.
- Clinical validation studies and regulatory review before any clinical claims are made.

## 16. Medical & Security Disclaimer

> EMD-TS is an AI-assisted screening and clinical decision-support prototype. It does not replace a qualified healthcare professional. Demonstration data and simulated signals are used in this hackathon prototype. Clinical claims require appropriate validation and regulatory review.
>
> The blockchain component demonstrates tamper-evident auditability and data-integrity verification. It does not guarantee complete prevention of data theft.

## 17. Testing

Automated Playwright tests live in `test/`:

- `test/smoke.mjs` — loads all 14 routes, asserts zero console errors.
- `test/e2e.mjs` — full functional walkthrough: registration → wearable → AI screening → copilot → referral → doctor review → tamper detection/restore → unauthorized access → blockchain verification → language switch → full 20-step demo mode.
- `test/pwa-offline.mjs` — builds/serves the production bundle, confirms the service worker activates, then goes fully offline and confirms the app still renders and navigates.
- `test/mobile.mjs` — 390×844 mobile viewport check.

Run them against a running dev server (`npm run dev`, separate terminal) with:

```bash
node test/smoke.mjs
node test/e2e.mjs
node test/mobile.mjs
```

For the PWA offline test, build + preview first:

```bash
npm run build && npm run preview -- --port 4173 &
node test/pwa-offline.mjs
```
