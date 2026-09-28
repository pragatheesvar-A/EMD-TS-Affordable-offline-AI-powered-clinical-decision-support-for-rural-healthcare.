"""EMD-TS backend -- FastAPI + SQLite.

Implements the "Backend" layer from the EMD-TS architecture slide
(Python + FastAPI + REST API) that the Flutter mobile app talks to.
Mirrors the exact same business logic already validated in the web
prototype (React/TS): deterministic AI risk scoring, SHA-256 record
hashing, and a local permissioned audit blockchain. Clinical data is
stored off-chain in SQLite; only pseudonymous audit metadata goes on
the chain.

Run: uvicorn app.main:app --reload --port 8080
Docs: http://localhost:8080/docs
"""

from __future__ import annotations

import json
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from . import ai_engine, blockchain
from .crypto_utils import generate_id, sha256_hex
from .database import db_session, init_db
from .demo_data import DEMO_PATIENTS
from .patient_hash import compute_patient_record_hash
from .schemas import (
    AccessRequest,
    ConsentUpdate,
    PatientCreate,
    ReferralRequest,
    ReviewRequest,
    ScreeningRequest,
    ViewRecordRequest,
)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    _seed_demo_if_needed()
    yield


app = FastAPI(
    title="EMD-TS API",
    version="1.0.0",
    description="Edge Medical Diagnostics & Telemedicine System backend",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # demo/hackathon setting -- restrict in production
    allow_methods=["*"],
    allow_headers=["*"],
)


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------------------------------------------------------------- helpers

def _patient_row_to_dict(row) -> dict:
    return {
        "id": row["id"],
        "name": row["name"],
        "age": row["age"],
        "gender": row["gender"],
        "phone": row["phone"],
        "village": row["village"],
        "symptoms": row["symptoms"],
        "duration": row["duration"],
        "knownConditions": row["known_conditions"],
        "medications": row["medications"],
        "allergies": row["allergies"],
        "createdAt": row["created_at"],
        "recordHash": row["record_hash"],
        "isDemo": bool(row["is_demo"]),
        "consent": json.loads(row["consent_json"]),
    }


def _screening_row_to_dict(row) -> dict:
    return {
        "id": row["id"],
        "patientId": row["patient_id"],
        "timestamp": row["timestamp"],
        "riskScore": row["risk_score"],
        "riskLevel": row["risk_level"],
        "findings": json.loads(row["findings_json"]),
        "reasons": json.loads(row["reasons_json"]),
        "vitals": json.loads(row["vitals_json"]),
        "ecgAbnormal": bool(row["ecg_abnormal"]),
        "moduleResults": json.loads(row["module_results_json"]),
        "recommendation": row["recommendation"],
    }


def _referral_row_to_dict(row) -> dict:
    return {
        "id": row["id"],
        "patientId": row["patient_id"],
        "createdAt": row["created_at"],
        "priority": row["priority"],
        "careLevel": row["care_level"],
        "specialist": row["specialist"],
        "reason": row["reason"],
        "note": row["note"],
    }


def _review_row_to_dict(row) -> dict:
    return {
        "id": row["id"],
        "patientId": row["patient_id"],
        "screeningId": row["screening_id"],
        "doctorName": row["doctor_name"],
        "notes": row["notes"],
        "action": row["action"],
        "createdAt": row["created_at"],
    }


def _get_patient(conn, patient_id: str) -> Optional[dict]:
    row = conn.execute("SELECT * FROM patients WHERE id = ?", (patient_id,)).fetchone()
    return _patient_row_to_dict(row) if row else None


def _add_timeline(conn, patient_id: str, ev_type: str, summary: str, data: Optional[dict] = None) -> None:
    conn.execute(
        "INSERT INTO timeline_events (id, patient_id, timestamp, type, summary, data_json) VALUES (?, ?, ?, ?, ?, ?)",
        (generate_id("EVT"), patient_id, now_iso(), ev_type, summary, json.dumps(data) if data else None),
    )


# ---------------------------------------------------------------- lifecycle
# Startup/seed logic runs via the `lifespan` context manager defined above.


def _seed_demo_if_needed() -> None:
    with db_session() as conn:
        count = conn.execute("SELECT COUNT(*) AS c FROM patients").fetchone()["c"]
        if count > 0:
            return
        for seed in DEMO_PATIENTS:
            created_at = now_iso()
            draft = {
                "id": seed["id"],
                "name": seed["name"],
                "age": seed["age"],
                "gender": seed["gender"],
                "phone": seed["phone"],
                "village": seed["village"],
                "symptoms": seed["symptoms"],
                "duration": seed["duration"],
                "known_conditions": seed["known_conditions"],
                "medications": seed["medications"],
                "allergies": seed["allergies"],
                "created_at": created_at,
            }
            record_hash = compute_patient_record_hash(draft)
            consent = {
                "clinicalScreening": True,
                "doctorReview": True,
                "telemedicineSharing": seed["id"] != "PAT-1003",
                "dataStorage": True,
                "updatedAt": created_at,
            }
            conn.execute(
                """INSERT INTO patients
                   (id, name, age, gender, phone, village, symptoms, duration, known_conditions,
                    medications, allergies, created_at, record_hash, is_demo, consent_json)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)""",
                (
                    seed["id"], seed["name"], seed["age"], seed["gender"], seed["phone"], seed["village"],
                    seed["symptoms"], seed["duration"], seed["known_conditions"], seed["medications"],
                    seed["allergies"], created_at, record_hash, json.dumps(consent),
                ),
            )
            _add_timeline(conn, seed["id"], "REGISTRATION", f"Patient {seed['name']} registered (demo data)")
            blockchain.add_transaction(conn, "PATIENT_CREATED", seed["id"], "HEALTHCARE_WORKER", "Created patient record (demo)", record_hash)

            result = ai_engine.run_screening(seed["id"], seed["vitals"], seed["ecg_abnormal"], seed["symptoms"], seed["spo2_trend"])
            conn.execute(
                """INSERT INTO screenings
                   (id, patient_id, timestamp, risk_score, risk_level, findings_json, reasons_json,
                    vitals_json, ecg_abnormal, module_results_json, recommendation)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    result["id"], seed["id"], result["timestamp"], result["riskScore"], result["riskLevel"],
                    json.dumps(result["findings"]), json.dumps(result["reasons"]), json.dumps(result["vitals"]),
                    int(result["ecgAbnormal"]), json.dumps(result["moduleResults"]), result["recommendation"],
                ),
            )
            _add_timeline(conn, seed["id"], "SCREENING", f"AI screening completed - {result['riskLevel']} priority (score {result['riskScore']})")
            blockchain.add_transaction(conn, "SCREENING_COMPLETED", seed["id"], "AI_ENGINE", f"Screening completed - risk {result['riskLevel']}", record_hash)

            if result["riskLevel"] != "LOW":
                details = ai_engine.referral_for_risk(result["riskLevel"])
                ref_id = generate_id("REF")
                ref_created = now_iso()
                conn.execute(
                    "INSERT INTO referrals (id, patient_id, created_at, priority, care_level, specialist, reason, note)"
                    " VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    (ref_id, seed["id"], ref_created, result["riskLevel"], details["careLevel"], details["specialist"],
                     details["reason"], f"Auto-generated referral note for {seed['name']} based on AI-assisted screening."),
                )
                blockchain.add_transaction(conn, "REFERRAL_GENERATED", seed["id"], "HEALTHCARE_WORKER", f"Referral generated - {details['careLevel']}", record_hash)

            conn.execute(
                "INSERT INTO sync_queue (id, patient_id, description, created_at, synced) VALUES (?, ?, ?, ?, 0)",
                (generate_id("SYNC"), seed["id"], "New patient record (demo)", created_at),
            )


# ---------------------------------------------------------------- health

@app.get("/health")
def health():
    return {"status": "ok", "service": "EMD-TS API", "time": now_iso()}


# ---------------------------------------------------------------- patients

@app.get("/patients")
def list_patients():
    with db_session() as conn:
        rows = conn.execute("SELECT * FROM patients ORDER BY created_at DESC").fetchall()
        return [_patient_row_to_dict(r) for r in rows]


@app.get("/patients/{patient_id}")
def get_patient(patient_id: str):
    with db_session() as conn:
        patient = _get_patient(conn, patient_id)
        if not patient:
            raise HTTPException(404, "Patient not found")
        return patient


@app.post("/patients", status_code=201)
def create_patient(payload: PatientCreate):
    with db_session() as conn:
        patient_id = generate_id("PAT")
        created_at = now_iso()
        draft = {
            "id": patient_id, "name": payload.name, "age": payload.age, "gender": payload.gender,
            "phone": payload.phone, "village": payload.village, "symptoms": payload.symptoms,
            "duration": payload.duration, "known_conditions": payload.knownConditions,
            "medications": payload.medications, "allergies": payload.allergies, "created_at": created_at,
        }
        record_hash = compute_patient_record_hash(draft)
        consent = {"clinicalScreening": True, "doctorReview": False, "telemedicineSharing": False, "dataStorage": True, "updatedAt": created_at}
        conn.execute(
            """INSERT INTO patients
               (id, name, age, gender, phone, village, symptoms, duration, known_conditions,
                medications, allergies, created_at, record_hash, is_demo, consent_json)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)""",
            (patient_id, payload.name, payload.age, payload.gender, payload.phone, payload.village,
             payload.symptoms, payload.duration, payload.knownConditions, payload.medications,
             payload.allergies, created_at, record_hash, json.dumps(consent)),
        )
        _add_timeline(conn, patient_id, "REGISTRATION", f"Patient {payload.name} registered at PHC")
        blockchain.add_transaction(conn, "PATIENT_CREATED", patient_id, payload.userRole, "Created patient record", record_hash)
        conn.execute(
            "INSERT INTO sync_queue (id, patient_id, description, created_at, synced) VALUES (?, ?, ?, ?, 0)",
            (generate_id("SYNC"), patient_id, "New patient record", created_at),
        )
        return _get_patient(conn, patient_id)


@app.patch("/patients/{patient_id}/consent")
def update_consent(patient_id: str, payload: ConsentUpdate):
    with db_session() as conn:
        patient = _get_patient(conn, patient_id)
        if not patient:
            raise HTTPException(404, "Patient not found")
        if payload.type not in ("clinicalScreening", "doctorReview", "telemedicineSharing", "dataStorage"):
            raise HTTPException(400, "Invalid consent type")
        consent = patient["consent"]
        consent[payload.type] = payload.value
        consent["updatedAt"] = now_iso()
        conn.execute("UPDATE patients SET consent_json = ? WHERE id = ?", (json.dumps(consent), patient_id))
        _add_timeline(conn, patient_id, "CONSENT", f"Consent {'granted' if payload.value else 'revoked'} for {payload.type}")
        blockchain.add_transaction(conn, 
            "CONSENT_GRANTED" if payload.value else "CONSENT_REVOKED",
            patient_id, payload.userRole, f"{'Granted' if payload.value else 'Revoked'} consent: {payload.type}", patient["recordHash"],
        )
        return _get_patient(conn, patient_id)


@app.post("/patients/{patient_id}/view")
def view_record(patient_id: str, payload: ViewRecordRequest):
    """Records an authorized RECORD_VIEWED audit event (e.g. doctor opens a case)."""
    with db_session() as conn:
        patient = _get_patient(conn, patient_id)
        if not patient:
            raise HTTPException(404, "Patient not found")
        blockchain.add_transaction(conn, "RECORD_VIEWED", patient_id, payload.userRole, "Viewed patient record", patient["recordHash"])
        conn.execute(
            "INSERT INTO access_audit (id, timestamp, user, patient_id, action, result, reason) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (generate_id("ACC"), now_iso(), payload.userRole, patient_id, "VIEW_RECORD", "GRANTED", "Authorized role"),
        )
        return {"ok": True}


# ---------------------------------------------------------------- screenings

@app.get("/patients/{patient_id}/screenings")
def list_screenings(patient_id: str):
    with db_session() as conn:
        rows = conn.execute(
            "SELECT * FROM screenings WHERE patient_id = ? ORDER BY timestamp DESC", (patient_id,)
        ).fetchall()
        return [_screening_row_to_dict(r) for r in rows]


@app.post("/patients/{patient_id}/screenings", status_code=201)
def run_screening(patient_id: str, payload: ScreeningRequest):
    with db_session() as conn:
        patient = _get_patient(conn, patient_id)
        if not patient:
            raise HTTPException(404, "Patient not found")

        prior = conn.execute(
            "SELECT vitals_json FROM screenings WHERE patient_id = ? ORDER BY timestamp ASC", (patient_id,)
        ).fetchall()
        trend = [json.loads(r["vitals_json"])["spo2"] for r in prior]
        trend.append(payload.vitals.spo2)

        result = ai_engine.run_screening(
            patient_id,
            payload.vitals.model_dump(),
            payload.ecgAbnormal,
            patient["symptoms"],
            trend if len(trend) > 1 else None,
        )
        conn.execute(
            """INSERT INTO screenings
               (id, patient_id, timestamp, risk_score, risk_level, findings_json, reasons_json,
                vitals_json, ecg_abnormal, module_results_json, recommendation)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                result["id"], patient_id, result["timestamp"], result["riskScore"], result["riskLevel"],
                json.dumps(result["findings"]), json.dumps(result["reasons"]), json.dumps(result["vitals"]),
                int(result["ecgAbnormal"]), json.dumps(result["moduleResults"]), result["recommendation"],
            ),
        )
        _add_timeline(conn, patient_id, "SCREENING", f"AI screening completed - {result['riskLevel']} priority (score {result['riskScore']})")
        blockchain.add_transaction(conn, "SCREENING_COMPLETED", patient_id, "AI_ENGINE", f"Screening completed - risk {result['riskLevel']}", patient["recordHash"])
        return result


# ---------------------------------------------------------------- referrals

@app.get("/patients/{patient_id}/referrals")
def list_referrals(patient_id: str):
    with db_session() as conn:
        rows = conn.execute(
            "SELECT * FROM referrals WHERE patient_id = ? ORDER BY created_at DESC", (patient_id,)
        ).fetchall()
        return [_referral_row_to_dict(r) for r in rows]


@app.post("/patients/{patient_id}/referrals", status_code=201)
def create_referral(patient_id: str, payload: ReferralRequest):
    with db_session() as conn:
        patient = _get_patient(conn, patient_id)
        if not patient:
            raise HTTPException(404, "Patient not found")
        screening = conn.execute("SELECT * FROM screenings WHERE id = ?", (payload.screeningId,)).fetchone()
        if not screening:
            raise HTTPException(404, "Screening not found")
        details = ai_engine.referral_for_risk(screening["risk_level"])
        ref_id = generate_id("REF")
        created_at = now_iso()
        conn.execute(
            "INSERT INTO referrals (id, patient_id, created_at, priority, care_level, specialist, reason, note)"
            " VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (ref_id, patient_id, created_at, screening["risk_level"], details["careLevel"], details["specialist"], details["reason"], payload.note),
        )
        _add_timeline(conn, patient_id, "REFERRAL", f"Referral generated - {details['careLevel']} ({details['specialist']})")
        blockchain.add_transaction(conn, "REFERRAL_GENERATED", patient_id, payload.userRole, f"Referral generated - {details['careLevel']}", patient["recordHash"])
        row = conn.execute("SELECT * FROM referrals WHERE id = ?", (ref_id,)).fetchone()
        return _referral_row_to_dict(row)


# ---------------------------------------------------------------- doctor reviews

@app.get("/patients/{patient_id}/reviews")
def list_reviews(patient_id: str):
    with db_session() as conn:
        rows = conn.execute(
            "SELECT * FROM reviews WHERE patient_id = ? ORDER BY created_at DESC", (patient_id,)
        ).fetchall()
        return [_review_row_to_dict(r) for r in rows]


@app.post("/patients/{patient_id}/reviews", status_code=201)
def create_review(patient_id: str, payload: ReviewRequest):
    with db_session() as conn:
        patient = _get_patient(conn, patient_id)
        if not patient:
            raise HTTPException(404, "Patient not found")
        review_id = generate_id("REV")
        created_at = now_iso()
        conn.execute(
            "INSERT INTO reviews (id, patient_id, screening_id, doctor_name, notes, action, created_at)"
            " VALUES (?, ?, ?, ?, ?, ?, ?)",
            (review_id, patient_id, payload.screeningId, payload.doctorName, payload.notes, payload.action, created_at),
        )
        _add_timeline(conn, patient_id, "DOCTOR_REVIEW", f"Doctor review: {payload.action} - {payload.notes[:80]}")
        blockchain.add_transaction(conn, "DOCTOR_REVIEWED", patient_id, payload.userRole, f"Doctor action: {payload.action}", patient["recordHash"])
        row = conn.execute("SELECT * FROM reviews WHERE id = ?", (review_id,)).fetchone()
        return _review_row_to_dict(row)


# ---------------------------------------------------------------- timeline

@app.get("/patients/{patient_id}/timeline")
def get_timeline(patient_id: str):
    with db_session() as conn:
        rows = conn.execute(
            "SELECT * FROM timeline_events WHERE patient_id = ? ORDER BY timestamp ASC", (patient_id,)
        ).fetchall()
        return [
            {
                "id": r["id"], "patientId": r["patient_id"], "timestamp": r["timestamp"], "type": r["type"],
                "summary": r["summary"], "data": json.loads(r["data_json"]) if r["data_json"] else None,
            }
            for r in rows
        ]


# ---------------------------------------------------------------- blockchain / security

@app.get("/blockchain/transactions")
def blockchain_transactions(patient_id: Optional[str] = None):
    with db_session() as conn:
        if patient_id:
            return blockchain.get_transactions_for_patient(conn, patient_id)
        return blockchain.get_all_transactions(conn)


@app.get("/blockchain/verify")
def blockchain_verify():
    with db_session() as conn:
        return blockchain.verify_chain(conn)


@app.get("/blockchain/stats")
def blockchain_stats():
    with db_session() as conn:
        return blockchain.chain_stats(conn)


@app.post("/security/tamper/{patient_id}")
def simulate_tamper(patient_id: str):
    """Directly mutates a patient's stored symptoms (bypassing the normal
    write path) to simulate an attacker, backing up the pristine version
    first so it can be restored."""
    with db_session() as conn:
        patient = _get_patient(conn, patient_id)
        if not patient:
            raise HTTPException(404, "Patient not found")
        existing_backup = conn.execute("SELECT 1 FROM tamper_backups WHERE patient_id = ?", (patient_id,)).fetchone()
        if not existing_backup:
            row = conn.execute("SELECT * FROM patients WHERE id = ?", (patient_id,)).fetchone()
            conn.execute(
                "INSERT INTO tamper_backups (patient_id, original_json) VALUES (?, ?)",
                (patient_id, json.dumps({k: row[k] for k in row.keys()})),
            )
        tampered_symptoms = f"{patient['symptoms']} [UNAUTHORIZED EDIT]"
        conn.execute("UPDATE patients SET symptoms = ? WHERE id = ?", (tampered_symptoms, patient_id))
        return {"ok": True, "patientId": patient_id}


@app.post("/security/restore/{patient_id}")
def restore_tampered(patient_id: str):
    with db_session() as conn:
        backup = conn.execute("SELECT original_json FROM tamper_backups WHERE patient_id = ?", (patient_id,)).fetchone()
        if not backup:
            raise HTTPException(404, "No backup found for this patient")
        original = json.loads(backup["original_json"])
        conn.execute(
            """UPDATE patients SET name=?, age=?, gender=?, phone=?, village=?, symptoms=?, duration=?,
               known_conditions=?, medications=?, allergies=?, record_hash=? WHERE id = ?""",
            (
                original["name"], original["age"], original["gender"], original["phone"], original["village"],
                original["symptoms"], original["duration"], original["known_conditions"], original["medications"],
                original["allergies"], original["record_hash"], patient_id,
            ),
        )
        conn.execute("DELETE FROM tamper_backups WHERE patient_id = ?", (patient_id,))
        return {"ok": True, "patientId": patient_id}


@app.get("/security/integrity/{patient_id}")
def check_integrity(patient_id: str):
    with db_session() as conn:
        patient = _get_patient(conn, patient_id)
        if not patient:
            raise HTTPException(404, "Patient not found")
        row = conn.execute("SELECT * FROM patients WHERE id = ?", (patient_id,)).fetchone()
        current_payload = {
            "id": row["id"], "name": row["name"], "age": row["age"], "gender": row["gender"],
            "phone": row["phone"], "village": row["village"], "symptoms": row["symptoms"],
            "duration": row["duration"], "known_conditions": row["known_conditions"],
            "medications": row["medications"], "allergies": row["allergies"], "created_at": row["created_at"],
        }
        current_hash = compute_patient_record_hash(current_payload)
        is_tampered = bool(conn.execute("SELECT 1 FROM tamper_backups WHERE patient_id = ?", (patient_id,)).fetchone())
        return {
            "patientId": patient_id,
            "originalHash": patient["recordHash"],
            "currentHash": current_hash,
            "verified": current_hash == patient["recordHash"],
            "tampered": is_tampered,
        }


@app.post("/security/unauthorized-access/{patient_id}")
def simulate_unauthorized_access(patient_id: str, payload: AccessRequest = AccessRequest()):
    with db_session() as conn:
        patient = _get_patient(conn, patient_id)
        if not patient:
            raise HTTPException(404, "Patient not found")
        blockchain.add_transaction(conn, "ACCESS_DENIED", patient_id, "AUDITOR", "Unauthorized VIEW_RECORD attempt blocked", patient["recordHash"])
        conn.execute(
            "INSERT INTO access_audit (id, timestamp, user, patient_id, action, result, reason) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (generate_id("ACC"), now_iso(), payload.user, patient_id, payload.action, "DENIED", "Insufficient permissions"),
        )
        return {"user": payload.user, "patientId": patient_id, "action": payload.action, "result": "DENIED", "reason": "Insufficient permissions"}


@app.get("/security/access-audit")
def access_audit_log():
    with db_session() as conn:
        rows = conn.execute("SELECT * FROM access_audit ORDER BY timestamp DESC").fetchall()
        return [dict(r) for r in rows]


# ---------------------------------------------------------------- sync

@app.get("/sync/queue")
def sync_queue():
    with db_session() as conn:
        rows = conn.execute("SELECT * FROM sync_queue ORDER BY created_at DESC").fetchall()
        return [
            {"id": r["id"], "patientId": r["patient_id"], "description": r["description"], "createdAt": r["created_at"], "synced": bool(r["synced"])}
            for r in rows
        ]


@app.post("/sync/run")
def sync_run():
    with db_session() as conn:
        pending = conn.execute("SELECT * FROM sync_queue WHERE synced = 0").fetchall()
        for item in pending:
            patient = _get_patient(conn, item["patient_id"])
            record_hash = patient["recordHash"] if patient else ""
            blockchain.add_transaction(conn, "RECORD_SYNCED", item["patient_id"], "SYSTEM", "Record synced to cloud (simulated)", record_hash)
        conn.execute("UPDATE sync_queue SET synced = 1 WHERE synced = 0")
        return {"synced": len(pending)}


# ---------------------------------------------------------------- dashboard

@app.get("/dashboard/summary")
def dashboard_summary():
    """Aggregated view for the Dashboard screen: avoids the mobile app
    having to fetch every patient's full screening history just to show
    counts and the latest risk badge per patient."""
    with db_session() as conn:
        patients = [_patient_row_to_dict(r) for r in conn.execute("SELECT * FROM patients ORDER BY created_at DESC").fetchall()]
        today = now_iso()[:10]
        patients_today = len([p for p in patients if p["createdAt"][:10] == today])

        high_priority = 0
        recent = []
        for p in patients:
            latest_row = conn.execute(
                "SELECT * FROM screenings WHERE patient_id = ? ORDER BY timestamp DESC LIMIT 1", (p["id"],)
            ).fetchone()
            latest_risk = latest_row["risk_level"] if latest_row else None
            if latest_risk == "HIGH":
                high_priority += 1
            recent.append({**p, "latestRiskLevel": latest_risk})

        pending_referrals = conn.execute("SELECT COUNT(*) AS c FROM referrals").fetchone()["c"]

        return {
            "patientsToday": patients_today,
            "activeMonitoring": len(patients),
            "highPriority": high_priority,
            "pendingReferrals": pending_referrals,
            "recentPatients": recent[:8],
        }


# ---------------------------------------------------------------- admin / demo

@app.post("/admin/reset")
def admin_reset():
    """Wipes all local data and reseeds the three demo patients. Used by
    the 'Reset Demo Data' action and by the automated test suite."""
    init_db(reset=True)
    _seed_demo_if_needed()
    return {"ok": True}
