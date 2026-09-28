"""Local permissioned audit blockchain -- same design as
src/lib/blockchain.ts in the web prototype: blocks, transactions,
previousHash/currentHash chaining, full verification, tamper
detection. Only pseudonymous metadata is ever written here; raw
clinical data always stays in the `patients`/`screenings` tables.

Every function here takes an open sqlite3 connection (`conn`) rather
than opening its own -- callers are responsible for the transaction
boundary (see database.db_session). This avoids nested/concurrent
writers against the same SQLite file, which otherwise deadlocks with
"database is locked".
"""

from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone

from .crypto_utils import generate_id, sha256_hex
from .database import db_session

GENESIS_PREV_HASH = "0" * 64

TX_TYPES = {
    "PATIENT_CREATED",
    "CONSENT_GRANTED",
    "CONSENT_REVOKED",
    "SCREENING_COMPLETED",
    "RECORD_VIEWED",
    "RECORD_UPDATED",
    "REFERRAL_GENERATED",
    "DOCTOR_REVIEWED",
    "ACCESS_DENIED",
    "RECORD_SYNCED",
}


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _block_payload(index: int, timestamp: str, transactions: list[dict], previous_hash: str, nonce: int) -> str:
    return json.dumps(
        {"index": index, "timestamp": timestamp, "transactions": transactions, "previousHash": previous_hash, "nonce": nonce},
        sort_keys=True,
        separators=(",", ":"),
    )


def compute_block_hash(index: int, timestamp: str, transactions: list[dict], previous_hash: str, nonce: int) -> str:
    return sha256_hex(_block_payload(index, timestamp, transactions, previous_hash, nonce))


def ensure_genesis(conn: sqlite3.Connection) -> None:
    row = conn.execute("SELECT COUNT(*) AS c FROM blockchain_blocks").fetchone()
    if row["c"] > 0:
        return
    ts = datetime(1970, 1, 1, tzinfo=timezone.utc).isoformat()
    current_hash = compute_block_hash(0, ts, [], GENESIS_PREV_HASH, 0)
    conn.execute(
        "INSERT INTO blockchain_blocks (idx, timestamp, transactions_json, previous_hash, current_hash, nonce)"
        " VALUES (?, ?, ?, ?, ?, ?)",
        (0, ts, json.dumps([]), GENESIS_PREV_HASH, current_hash, 0),
    )


def add_transaction(
    conn: sqlite3.Connection,
    tx_type: str,
    patient_id: str,
    user_role: str,
    action: str,
    record_hash: str,
    record_version: int = 1,
) -> dict:
    if tx_type not in TX_TYPES:
        raise ValueError(f"Unknown transaction type: {tx_type}")
    ensure_genesis(conn)
    prev = conn.execute("SELECT * FROM blockchain_blocks ORDER BY idx DESC LIMIT 1").fetchone()
    tx = {
        "txId": generate_id("TX"),
        "type": tx_type,
        "patientId": patient_id,
        "userRole": user_role,
        "action": action,
        "recordHash": record_hash,
        "timestamp": now_iso(),
        "recordVersion": record_version,
    }
    new_index = prev["idx"] + 1
    transactions = [tx]
    current_hash = compute_block_hash(new_index, tx["timestamp"], transactions, prev["current_hash"], 0)
    conn.execute(
        "INSERT INTO blockchain_blocks (idx, timestamp, transactions_json, previous_hash, current_hash, nonce)"
        " VALUES (?, ?, ?, ?, ?, ?)",
        (new_index, tx["timestamp"], json.dumps(transactions), prev["current_hash"], current_hash, 0),
    )
    return {"blockIndex": new_index, "blockHash": current_hash, **tx}


def get_all_transactions(conn: sqlite3.Connection) -> list[dict]:
    ensure_genesis(conn)
    rows = conn.execute("SELECT * FROM blockchain_blocks WHERE idx != 0 ORDER BY idx DESC").fetchall()
    out = []
    for row in rows:
        for tx in json.loads(row["transactions_json"]):
            out.append({**tx, "blockIndex": row["idx"], "blockHash": row["current_hash"]})
    out.sort(key=lambda t: t["timestamp"], reverse=True)
    return out


def get_transactions_for_patient(conn: sqlite3.Connection, patient_id: str) -> list[dict]:
    return [t for t in get_all_transactions(conn) if t["patientId"] == patient_id]


def verify_chain(conn: sqlite3.Connection) -> dict:
    ensure_genesis(conn)
    rows = conn.execute("SELECT * FROM blockchain_blocks ORDER BY idx ASC").fetchall()
    prev_hash = None
    for row in rows:
        transactions = json.loads(row["transactions_json"])
        recomputed = compute_block_hash(row["idx"], row["timestamp"], transactions, row["previous_hash"], row["nonce"])
        if recomputed != row["current_hash"]:
            return {"valid": False, "brokenAtIndex": row["idx"]}
        if prev_hash is not None and row["previous_hash"] != prev_hash:
            return {"valid": False, "brokenAtIndex": row["idx"]}
        prev_hash = row["current_hash"]
    return {"valid": True, "brokenAtIndex": None}


def chain_stats(conn: sqlite3.Connection) -> dict:
    ensure_genesis(conn)
    total_blocks = conn.execute("SELECT COUNT(*) AS c FROM blockchain_blocks").fetchone()["c"]
    txs = get_all_transactions(conn)
    return {
        "totalBlocks": total_blocks,
        "totalTransactions": len(txs),
        "patientsReferenced": len({t["patientId"] for t in txs}),
        "accessDenials": len([t for t in txs if t["type"] == "ACCESS_DENIED"]),
    }


def reset_chain(conn: sqlite3.Connection) -> None:
    conn.execute("DELETE FROM blockchain_blocks")
    ensure_genesis(conn)
