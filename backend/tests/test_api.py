"""End-to-end API tests for the EMD-TS FastAPI backend. Run with:
    pytest -q
These exercise the full demo flow: seeded patients, registration,
screening/risk scoring, referral, doctor review, blockchain audit,
tamper detection + restore, and unauthorized access simulation.
"""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from fastapi.testclient import TestClient

os.environ["EMDTS_DB_PATH"] = os.path.join(os.path.dirname(__file__), "test_emdts.db")

from app.main import app  # noqa: E402

# Using the TestClient as a context manager ensures the ASGI lifespan
# (startup/shutdown) runs exactly once for the whole test session,
# instead of potentially once per request -- which previously caused
# the demo-data seeding routine to race against itself.
_client_cm = TestClient(app)
client = _client_cm.__enter__()


def _close_client():
    _client_cm.__exit__(None, None, None)


@pytest.fixture(autouse=True, scope="module")
def reset_db():
    resp = client.post("/admin/reset")
    assert resp.status_code == 200
    yield
    _close_client()


def test_health():
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_demo_patients_seeded():
    resp = client.get("/patients")
    assert resp.status_code == 200
    patients = resp.json()
    ids = {p["id"] for p in patients}
    assert {"PAT-1001", "PAT-1002", "PAT-1003"}.issubset(ids)


def test_ravi_kumar_is_high_priority():
    resp = client.get("/patients/PAT-1001/screenings")
    assert resp.status_code == 200
    screenings = resp.json()
    assert len(screenings) >= 1
    assert screenings[0]["riskLevel"] == "HIGH"
    assert screenings[0]["riskScore"] >= 70


def test_meena_is_moderate_priority():
    resp = client.get("/patients/PAT-1002/screenings")
    screenings = resp.json()
    assert screenings[0]["riskLevel"] == "MODERATE"


def test_arun_is_low_priority():
    resp = client.get("/patients/PAT-1003/screenings")
    screenings = resp.json()
    assert screenings[0]["riskLevel"] == "LOW"


def test_register_new_patient_creates_hash_and_blockchain_tx():
    resp = client.post(
        "/patients",
        json={
            "name": "Test Patient",
            "age": 30,
            "gender": "Female",
            "phone": "+91 90000 00001",
            "village": "Test Village",
            "symptoms": "Mild headache",
        },
    )
    assert resp.status_code == 201
    patient = resp.json()
    assert patient["recordHash"]
    assert len(patient["recordHash"]) == 64  # sha256 hex length

    txs = client.get("/blockchain/transactions", params={"patient_id": patient["id"]}).json()
    assert any(t["type"] == "PATIENT_CREATED" for t in txs)


def test_run_screening_and_generate_referral():
    patient = client.post(
        "/patients",
        json={"name": "Referral Test", "age": 60, "gender": "Male", "phone": "1", "village": "V", "symptoms": "chest pain and breathing difficulty"},
    ).json()

    screening_resp = client.post(
        f"/patients/{patient['id']}/screenings",
        json={"vitals": {"heartRate": 122, "spo2": 85, "temperature": 39.0}, "ecgAbnormal": True},
    )
    assert screening_resp.status_code == 201
    screening = screening_resp.json()
    assert screening["riskLevel"] == "HIGH"
    assert len(screening["reasons"]) > 0

    referral_resp = client.post(
        f"/patients/{patient['id']}/referrals",
        json={"screeningId": screening["id"], "note": "test referral"},
    )
    assert referral_resp.status_code == 201
    referral = referral_resp.json()
    assert referral["careLevel"] == "District Hospital"

    txs = client.get("/blockchain/transactions", params={"patient_id": patient["id"]}).json()
    assert any(t["type"] == "REFERRAL_GENERATED" for t in txs)


def test_doctor_review_flow():
    resp = client.post(
        "/patients/PAT-1001/reviews",
        json={"notes": "Refer for cardiology assessment", "action": "Refer"},
    )
    assert resp.status_code == 201
    review = resp.json()
    assert review["action"] == "Refer"

    txs = client.get("/blockchain/transactions", params={"patient_id": "PAT-1001"}).json()
    assert any(t["type"] == "DOCTOR_REVIEWED" for t in txs)


def test_blockchain_chain_is_valid():
    resp = client.get("/blockchain/verify")
    assert resp.status_code == 200
    assert resp.json()["valid"] is True


def test_tamper_detection_and_restore():
    integrity_before = client.get("/security/integrity/PAT-1003").json()
    assert integrity_before["verified"] is True

    tamper_resp = client.post("/security/tamper/PAT-1003")
    assert tamper_resp.status_code == 200

    integrity_after = client.get("/security/integrity/PAT-1003").json()
    assert integrity_after["verified"] is False
    assert integrity_after["originalHash"] != integrity_after["currentHash"]

    restore_resp = client.post("/security/restore/PAT-1003")
    assert restore_resp.status_code == 200

    integrity_restored = client.get("/security/integrity/PAT-1003").json()
    assert integrity_restored["verified"] is True


def test_unauthorized_access_denied():
    resp = client.post("/security/unauthorized-access/PAT-1001", json={"user": "Unknown_User", "action": "VIEW_RECORD"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["result"] == "DENIED"

    txs = client.get("/blockchain/transactions", params={"patient_id": "PAT-1001"}).json()
    assert any(t["type"] == "ACCESS_DENIED" for t in txs)


def test_consent_update():
    resp = client.patch("/patients/PAT-1002/consent", json={"type": "doctorReview", "value": True})
    assert resp.status_code == 200
    assert resp.json()["consent"]["doctorReview"] is True

    txs = client.get("/blockchain/transactions", params={"patient_id": "PAT-1002"}).json()
    assert any(t["type"] == "CONSENT_GRANTED" for t in txs)


def test_sync_queue_and_run():
    queue_before = client.get("/sync/queue").json()
    pending_before = [i for i in queue_before if not i["synced"]]
    assert len(pending_before) > 0

    sync_resp = client.post("/sync/run")
    assert sync_resp.status_code == 200
    assert sync_resp.json()["synced"] == len(pending_before)

    queue_after = client.get("/sync/queue").json()
    assert all(i["synced"] for i in queue_after)


def test_dashboard_summary():
    resp = client.get("/dashboard/summary")
    assert resp.status_code == 200
    body = resp.json()
    assert body["activeMonitoring"] >= 3
    assert body["highPriority"] >= 1
    ravi = next((p for p in body["recentPatients"] if p["id"] == "PAT-1001"), None)
    assert ravi is not None
    assert ravi["latestRiskLevel"] == "HIGH"


def test_timeline_has_events():
    resp = client.get("/patients/PAT-1001/timeline")
    assert resp.status_code == 200
    events = resp.json()
    assert len(events) > 0
    types = {e["type"] for e in events}
    assert "REGISTRATION" in types
    assert "SCREENING" in types
