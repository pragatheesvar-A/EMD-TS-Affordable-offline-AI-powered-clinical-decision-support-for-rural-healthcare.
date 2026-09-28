"""SHA-256 hashing helpers used for patient record integrity and the
blockchain ledger. Pure stdlib (hashlib) -- no external dependency,
mirrors src/lib/crypto.ts in the web prototype exactly so hashes are
computed the same way across both implementations."""

from __future__ import annotations

import hashlib
import json
import random
import string
import time


def sha256_hex(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def canonicalize(obj: dict) -> str:
    """Deterministic JSON (sorted keys) so hashes are reproducible."""
    return json.dumps(obj, sort_keys=True, separators=(",", ":"))


def short_hash(value: str, length: int = 16) -> str:
    if not value:
        return ""
    return f"{value[:length]}..."


def generate_id(prefix: str) -> str:
    rand = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
    time_part = format(int(time.time() * 1000), "x").upper()[-4:]
    return f"{prefix}-{time_part}{rand}"
