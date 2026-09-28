from __future__ import annotations

from .crypto_utils import canonicalize, sha256_hex


def patient_hash_payload(p: dict) -> dict:
    return {
        "id": p["id"],
        "name": p["name"],
        "age": p["age"],
        "gender": p["gender"],
        "phone": p["phone"],
        "village": p["village"],
        "symptoms": p["symptoms"],
        "duration": p["duration"],
        "knownConditions": p["known_conditions"] if "known_conditions" in p else p.get("knownConditions"),
        "medications": p["medications"],
        "allergies": p["allergies"],
        "createdAt": p["created_at"] if "created_at" in p else p.get("createdAt"),
    }


def compute_patient_record_hash(p: dict) -> str:
    return sha256_hex(canonicalize(patient_hash_payload(p)))
