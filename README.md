# EMD-TS — Edge Medical Diagnostics & Telemedicine System

**Affordable, offline-first, AI-powered clinical decision support for rural healthcare.**

*Better Information. Faster Screening. Connected Care.*

EMD-TS helps health workers at rural and semi-urban Primary Health Centres (PHCs) screen patients quickly, even without specialists, ECG machines or reliable internet. It links a (simulated) wearable sensor to a full clinical workflow:

**live vitals → ECG → edge AI screening → explainable risk score → clinical copilot → smart referral → doctor review → tamper-evident audit trail → offline sync**

> **Disclaimer:** EMD-TS is a hackathon prototype. It is **not** a certified medical device and has **not** been clinically validated. AI output supports screening and referral only. A qualified clinician always makes the final diagnosis and treatment decision.

---

## The Problem

A patient arrives at a rural PHC with chest discomfort and breathing difficulty. There is no ECG equipment, no cardiologist on site, and the internet connection is unreliable. Deciding whether the patient needs an urgent referral becomes slow and error-prone. Existing wearables, telemedicine apps and digital records each solve only *part* of this problem.

## The Solution

EMD-TS connects sensing, screening, referral and doctor review in **one offline-first system**:

- **Wearable monitoring** – heart rate, SpO₂, temperature, activity and a live ECG waveform (simulated sensor with *Normal* and *High-Risk* demo modes).
- **Edge AI screening** – a transparent, deterministic rule engine produces a 0–100 risk score and a LOW / MODERATE / HIGH priority.
- **Explainable AI** – every flag shows *why* (e.g. "SpO₂ below threshold", "Elevated heart rate").
- **Clinical Copilot** – auto-generated structured patient summary with Tamil ↔ English symptom support.
- **Smart Referral** – maps priority to care level and specialist, and generates a printable referral note.
- **Doctor Dashboard** – patients grouped by priority, with review actions (Reviewed / Refer / Monitor / Additional Investigation).
- **Patient Timeline** – visit history and vital-sign trend charts with automatic SpO₂-decline detection.
- **Security & Audit** – SHA-256 record hashing, role-based access, patient consent management, and a local permissioned blockchain audit trail with tamper detection.
- **Offline-first** – works with no network and syncs when a connection is available.
- **Guided Demo Mode** – a scripted, end-to-end walkthrough using three demo patients.

---

## Repository Structure

```
.
├── frontend/        Web app — React 19 + TypeScript + Vite, installable PWA (Capacitor Android wrapper included)
├── backend/         REST API — Python, FastAPI + SQLite
├── mobile/          Mobile app — Flutter (Dart)
└── docs/            Hackathon pitch deck
```

| Component | Tech stack | Default port |
|---|---|---|
| Backend API | Python 3.10+, FastAPI, Uvicorn, SQLite, Pydantic | `8080` |
| Web app | React 19, TypeScript, Vite, Tailwind CSS v4, Recharts, vite-plugin-pwa | `3000` |
| Mobile app | Flutter / Dart (SDK ≥ 3.3) | — |

---

## Getting Started

### Prerequisites

- **Python** 3.10 or newer
- **Node.js** 20.19 or newer and npm
- **Flutter SDK** 3.x (only needed for the mobile app)

### 1. Backend (FastAPI)

```bash
cd backend
python -m venv .venv
# Windows:        .venv\Scripts\activate
# macOS / Linux:  source .venv/bin/activate
pip install -r requirements.txt
python run.py
```

- API: <http://localhost:8080>
- Interactive API docs (Swagger UI): <http://localhost:8080/docs>
- On first start, a local SQLite database (`emdts.db`) is created and seeded with three demo patients.
- Change the port with the `PORT` environment variable.

### 2. Web app (React + Vite)

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:3000>.

The web app calls the backend through the Vite dev-server proxy (`/api` → `http://127.0.0.1:8080`). At startup it checks whether the backend is reachable:

- **Backend running** – all patients, screenings, referrals, reviews and timelines are loaded from and saved to the backend.
- **Backend not running** – the app keeps working fully offline using browser storage.

To use a backend on another machine, set `VITE_API_URL`, for example `VITE_API_URL=http://192.168.1.20:8080`.

### 3. Mobile app (Flutter)

```bash
cd mobile
flutter pub get
flutter run
```

Default backend address:

- Android emulator: `http://10.0.2.2:8080`
- Desktop / web / iOS simulator: `http://localhost:8080`
- Physical phone: open **Settings → Backend Server** in the app and enter your computer's LAN IP, for example `http://192.168.1.20:8080`. Start the backend with `python run.py`, which listens on all network interfaces.

---

## Running Tests

```bash
# Backend
cd backend
pytest

# Web app — type check and production build
cd frontend
npm run build
```

---

## API Overview

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/health` | Service health check |
| `GET` / `POST` | `/patients` | List / register patients |
| `PATCH` | `/patients/{id}/consent` | Grant or revoke consent |
| `GET` / `POST` | `/patients/{id}/screenings` | List / run AI screening |
| `GET` / `POST` | `/patients/{id}/referrals` | List / create referrals |
| `GET` / `POST` | `/patients/{id}/reviews` | List / add doctor reviews |
| `GET` | `/patients/{id}/timeline` | Patient event timeline |
| `GET` | `/blockchain/transactions`, `/blockchain/verify` | Audit trail and chain verification |
| `GET` | `/dashboard/summary` | Dashboard statistics |
| `POST` | `/admin/reset` | Reset the database to demo data |

See <http://localhost:8080/docs> for the complete, interactive reference.

---

## Security Design

- **Clinical data** is stored **off-chain** in local storage (SQLite on the server, browser storage on the web app).
- **Audit data only** goes on the local permissioned blockchain: pseudonymous patient IDs, SHA-256 record hashes, roles, actions and timestamps. Names, phone numbers and sensor readings are **never** written to the chain.
- Any change to a patient record changes its SHA-256 hash, so tampering is detected immediately.

---

## Prototype Scope & Roadmap

| Area | Current prototype | Future production |
|---|---|---|
| Wearable | Software-simulated sensor | ESP32 / Ambiq Apollo4 with real ECG, SpO₂ and temperature sensors |
| AI | Deterministic, explainable rule engine | TinyML models (TensorFlow Lite Micro) on the device |
| Blockchain | Local hash-chained ledger | Hyperledger Fabric or a similar permissioned network |
| Sync | Simulated cloud sync | Secure, encrypted cloud sync |

---

## Documentation

- [Backend README](backend/README.md)
- [Web app README](frontend/README.md)
- [Mobile app README](mobile/README.md)
- [Hackathon pitch deck](docs/EMD-TS-Hackathon-Deck.pptx)

## Author

[@pragatheesvar-A](https://github.com/pragatheesvar-A)
