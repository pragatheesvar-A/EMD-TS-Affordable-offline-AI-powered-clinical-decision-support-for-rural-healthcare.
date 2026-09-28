"""SQLite persistence layer. Mirrors the local-first design of the web
prototype (src/lib/storage.ts) -- every write lands in a single local
file, no external database server required, matching the offline-first
requirement in the EMD-TS brief."""

from __future__ import annotations

import os
import sqlite3
from contextlib import contextmanager

DB_PATH = os.environ.get("EMDTS_DB_PATH", os.path.join(os.path.dirname(__file__), "..", "emdts.db"))


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


@contextmanager
def db_session():
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


SCHEMA = """
CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    age INTEGER NOT NULL,
    gender TEXT NOT NULL,
    phone TEXT NOT NULL,
    village TEXT NOT NULL,
    symptoms TEXT NOT NULL,
    duration TEXT NOT NULL,
    known_conditions TEXT NOT NULL,
    medications TEXT NOT NULL,
    allergies TEXT NOT NULL,
    created_at TEXT NOT NULL,
    record_hash TEXT NOT NULL,
    is_demo INTEGER NOT NULL DEFAULT 0,
    consent_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS screenings (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL REFERENCES patients(id),
    timestamp TEXT NOT NULL,
    risk_score INTEGER NOT NULL,
    risk_level TEXT NOT NULL,
    findings_json TEXT NOT NULL,
    reasons_json TEXT NOT NULL,
    vitals_json TEXT NOT NULL,
    ecg_abnormal INTEGER NOT NULL,
    module_results_json TEXT NOT NULL,
    recommendation TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS referrals (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL REFERENCES patients(id),
    created_at TEXT NOT NULL,
    priority TEXT NOT NULL,
    care_level TEXT NOT NULL,
    specialist TEXT NOT NULL,
    reason TEXT NOT NULL,
    note TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL REFERENCES patients(id),
    screening_id TEXT,
    doctor_name TEXT NOT NULL,
    notes TEXT NOT NULL,
    action TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS timeline_events (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL REFERENCES patients(id),
    timestamp TEXT NOT NULL,
    type TEXT NOT NULL,
    summary TEXT NOT NULL,
    data_json TEXT
);

CREATE TABLE IF NOT EXISTS blockchain_blocks (
    idx INTEGER PRIMARY KEY,
    timestamp TEXT NOT NULL,
    transactions_json TEXT NOT NULL,
    previous_hash TEXT NOT NULL,
    current_hash TEXT NOT NULL,
    nonce INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sync_queue (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL REFERENCES patients(id),
    description TEXT NOT NULL,
    created_at TEXT NOT NULL,
    synced INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS access_audit (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    user TEXT NOT NULL,
    patient_id TEXT NOT NULL,
    action TEXT NOT NULL,
    result TEXT NOT NULL,
    reason TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tamper_backups (
    patient_id TEXT PRIMARY KEY,
    original_json TEXT NOT NULL
);
"""


def init_db(reset: bool = False) -> None:
    if reset and os.path.exists(DB_PATH):
        os.remove(DB_PATH)
    with db_session() as conn:
        conn.executescript(SCHEMA)
