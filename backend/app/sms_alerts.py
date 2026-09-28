"""Offline SMS fallback for urgent HIGH-priority cases -- EMD-TS spec
section 21, "Offline Communication + SMS Fallback".

The SMS body is deliberately minimal: a pseudonymous patient reference,
a priority level, and an opaque lookup reference. It must NEVER contain
vitals, ECG data, symptoms, diagnosis, or any other clinical detail --
SMS is explicitly not an encrypted medical-data channel, so nothing
sensitive is allowed to travel through it.

In the real mobile app this queue is populated and drained primarily
*on-device* while offline (see StorageService / AppState in the Flutter
app, which keep their own local, encrypted copy of this same queue).
This server-side mirror exists so that once connectivity returns, the
alert is durably logged here too and shows up in the blockchain audit
trail, the same way every other clinical workflow event does.

Every function here takes an open sqlite3 connection (`conn`), matching
the convention in blockchain.py, so callers control the transaction
boundary and nested/concurrent writers never fight over the same
SQLite file.
"""

from __future__ import annotations

import sqlite3
from datetime import datetime, timezone
from typing import Optional

from .blockchain import add_transaction
from .crypto_utils import generate_id, sha256_hex, short_ref

VALID_STATUSES = {"PENDING", "SENT", "SYNCED"}


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _row_to_dict(row: sqlite3.Row) -> dict:
    return {
        "id": row["id"],
        "patientId": row["patient_id"],
        "screeningId": row["screening_id"],
        "priority": row["priority"],
        "reference": row["reference"],
        "message": row["message"],
        "status": row["status"],
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"],
    }


def build_minimal_message(patient_id: str, priority: str, reference: str) -> str:
    """The ONLY text ever sent over SMS. No vitals, no ECG, no symptoms,
    no diagnosis -- matches the spec's example format exactly:

        EMD-TS ALERT
        Patient Ref: PAT-1001
        Priority: HIGH
        Clinical review required.
        Reference: EMD-XXXX
    """
    return (
        "EMD-TS ALERT\n"
        f"Patient Ref: {patient_id}\n"
        f"Priority: {priority}\n"
        "Clinical review required.\n"
        f"Reference: {reference}"
    )


def create_sms_alert(
    conn: sqlite3.Connection,
    patient_id: str,
    priority: str,
    user_role: str,
    screening_id: Optional[str] = None,
) -> dict:
    reference = short_ref("EMD")
    message = build_minimal_message(patient_id, priority, reference)
    alert_id = generate_id("SMS")
    created_at = now_iso()
    conn.execute(
        """INSERT INTO sms_alerts
           (id, patient_id, screening_id, priority, reference, message, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?, ?)""",
        (alert_id, patient_id, screening_id, priority, reference, message, created_at, created_at),
    )
    add_transaction(
        conn,
        "SMS_ALERT_QUEUED",
        patient_id,
        user_role,
        f"SMS fallback alert queued ({priority} priority, ref {reference})",
        sha256_hex(message),  # hash of the minimal SMS text only -- never the full clinical record
    )
    row = conn.execute("SELECT * FROM sms_alerts WHERE id = ?", (alert_id,)).fetchone()
    return _row_to_dict(row)


def update_sms_alert_status(
    conn: sqlite3.Connection,
    alert_id: str,
    status: str,
    user_role: str,
) -> Optional[dict]:
    if status not in VALID_STATUSES:
        raise ValueError(f"Invalid SMS alert status: {status}")
    row = conn.execute("SELECT * FROM sms_alerts WHERE id = ?", (alert_id,)).fetchone()
    if not row:
        return None
    conn.execute(
        "UPDATE sms_alerts SET status = ?, updated_at = ? WHERE id = ?",
        (status, now_iso(), alert_id),
    )
    if status == "SENT":
        add_transaction(
            conn,
            "SMS_ALERT_SENT",
            row["patient_id"],
            user_role,
            f"SMS fallback alert sent via offline channel (ref {row['reference']})",
            sha256_hex(row["message"]),
        )
    row = conn.execute("SELECT * FROM sms_alerts WHERE id = ?", (alert_id,)).fetchone()
    return _row_to_dict(row)


def list_sms_alerts(conn: sqlite3.Connection, patient_id: Optional[str] = None) -> list[dict]:
    if patient_id:
        rows = conn.execute(
            "SELECT * FROM sms_alerts WHERE patient_id = ? ORDER BY created_at DESC", (patient_id,)
        ).fetchall()
    else:
        rows = conn.execute("SELECT * FROM sms_alerts ORDER BY created_at DESC").fetchall()
    return [_row_to_dict(r) for r in rows]
