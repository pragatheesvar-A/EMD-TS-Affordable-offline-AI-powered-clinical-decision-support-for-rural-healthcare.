# EMD-TS Backend (Python / FastAPI)

The server-side half of EMD-TS: patient records, the explainable AI
risk-screening engine, referrals, doctor reviews, consent, RBAC-gated
security simulations, and the local permissioned blockchain audit
trail. SQLite-backed, zero external services required.

This is the **single source of truth** the Flutter mobile app (in the
companion `emd_ts_flutter/` project) talks to over plain HTTP/JSON.
The mobile app also works fully offline against its own local cache,
and re-syncs with this server whenever it's reachable.

## Requirements

- Python 3.10+ (3.11/3.12 both tested)
- pip

## Setup

```bash
cd emd-ts-backend
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

## Run

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8080
```

- `--host 0.0.0.0` is important if the Flutter app will run on a
  physical phone or the Android emulator — `127.0.0.1` only accepts
  connections from the same machine.
- On first boot the server creates `emdts.db` (SQLite) next to `app/`
  and seeds three demo patients (Ravi Kumar / HIGH risk, Meena /
  MODERATE risk, Arun / LOW risk) plus their screenings — this is what
  the Flutter Demo Mode screen walks through.
- API docs (interactive Swagger UI) are auto-served at
  `http://localhost:8080/docs` once running.

## Finding your LAN IP (for a physical phone)

The Flutter app's default backend URL is `http://10.0.2.2:8080`
(Android emulator only) or `http://localhost:8080` (iOS
simulator/desktop). A real phone on the same Wi-Fi needs your
computer's LAN IP instead:

- Windows: `ipconfig` → look for "IPv4 Address" under your active
  adapter (e.g. `192.168.1.20`)
- macOS/Linux: `ifconfig` or `ip addr`

Then in the Flutter app, go to **Settings → Backend Server** and enter
`http://192.168.1.20:8080` (replace with your actual IP), tap **Save**,
then **Test Connection**.

## Tests

```bash
pytest -q
```

15 tests cover the full demo flow: seeded patients, registration,
risk scoring for all three demo patients, referral generation, doctor
review, blockchain chain validity, tamper detection + restore,
unauthorized access denial, consent updates, sync queue, dashboard
summary, and patient timeline.

## Resetting demo data

```bash
curl -X POST http://localhost:8080/admin/reset
```

or use the **Reset All Data** button in the Flutter app's Settings
screen. This re-seeds the three demo patients and clears everything
else (fresh blockchain, no extra registrations).

## API surface

| Area | Endpoints |
|---|---|
| Patients | `GET/POST /patients`, `GET /patients/{id}`, `PATCH /patients/{id}/consent`, `POST /patients/{id}/view` |
| Screening | `GET/POST /patients/{id}/screenings` |
| Referrals | `GET/POST /patients/{id}/referrals` |
| Doctor reviews | `GET/POST /patients/{id}/reviews` |
| Timeline | `GET /patients/{id}/timeline` |
| Blockchain | `GET /blockchain/transactions`, `GET /blockchain/verify`, `GET /blockchain/stats` |
| Security | `GET /security/integrity/{id}`, `POST /security/tamper/{id}`, `POST /security/restore/{id}`, `POST /security/unauthorized-access/{id}` |
| Sync | `GET /sync/queue`, `POST /sync/run` |
| Dashboard | `GET /dashboard/summary` |
| Admin | `POST /admin/reset`, `GET /health` |

## Architecture notes

- `app/blockchain.py` threads a single `sqlite3.Connection` through
  every function (never opens a nested session) — this avoids SQLite's
  "database is locked" error under concurrent writes.
- `app/ai_engine.py` is a deterministic, explainable rule engine — the
  same thresholds validated in the original web prototype (HR/SpO2/
  temperature ranges, ECG abnormality, symptom keywords in English and
  Tamil, short-term trend deltas). Every score returns a plain-language
  `reasons` list.
- `app/crypto_utils.py` computes SHA-256 hashes over canonicalized
  (sorted-key) JSON, matching the hashing the Flutter app can also
  compute client-side for display.
