"""Deterministic, fully local rule-engine standing in for the TinyML /
CNN models described in the EMD-TS architecture (ECG AI, heart sound
AI, lung sound AI). This is AI-ASSISTED SCREENING / RISK
PRIORITIZATION -- never an automated diagnosis. Logic mirrors
src/lib/aiEngine.ts in the web prototype exactly, so both
implementations produce the same score for the same inputs."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from .crypto_utils import generate_id

HIGH_RISK_KEYWORDS = [
    "breathing difficulty",
    "breathless",
    "shortness of breath",
    "chest pain",
    "chest discomfort",
    "unconscious",
    "severe",
]
MODERATE_RISK_KEYWORDS = ["fever", "cough", "dizziness", "fatigue", "vomiting", "weakness"]


def _score_spo2(spo2: float) -> tuple[int, Optional[dict], Optional[str]]:
    if spo2 >= 95:
        return 0, None, None
    if spo2 >= 90:
        return (
            25,
            {"code": "SPO2_MODERATE", "label": "Moderately low oxygen saturation (SpO2)", "severity": "MODERATE"},
            "SpO2 below configured normal screening threshold (90-94%)",
        )
    return (
        40,
        {"code": "SPO2_HIGH", "label": "Low oxygen saturation (SpO2 < 90%)", "severity": "HIGH"},
        "SpO2 below configured clinical threshold (<90%)",
    )


def _score_heart_rate(hr: float) -> tuple[int, Optional[dict], Optional[str]]:
    if 60 <= hr <= 100:
        return 0, None, None
    if hr < 60:
        return (
            15,
            {"code": "HR_LOW", "label": "Low heart rate (bradycardia range)", "severity": "MODERATE"},
            "Heart rate below configured normal range (<60 BPM)",
        )
    if hr <= 120:
        return (
            15,
            {"code": "HR_MODERATE", "label": "Elevated heart rate", "severity": "MODERATE"},
            "Heart rate above configured normal range (101-120 BPM)",
        )
    return (
        30,
        {"code": "HR_HIGH", "label": "Significantly elevated heart rate", "severity": "HIGH"},
        "Heart rate significantly elevated (>120 BPM)",
    )


def _score_temperature(temp: float) -> tuple[int, Optional[dict], Optional[str]]:
    if temp < 37.5:
        return 0, None, None
    if temp < 38.5:
        return (
            10,
            {"code": "TEMP_MODERATE", "label": "Elevated body temperature", "severity": "MODERATE"},
            "Elevated body temperature (37.5-38.4C)",
        )
    return (
        20,
        {"code": "TEMP_HIGH", "label": "High fever", "severity": "HIGH"},
        "High body temperature (>=38.5C) - increased priority",
    )


def _score_ecg(abnormal: bool) -> tuple[int, Optional[dict], Optional[str]]:
    if not abnormal:
        return 0, None, None
    return (
        25,
        {"code": "ECG_ABNORMAL", "label": "Abnormal ECG pattern requires clinical review", "severity": "HIGH"},
        "Abnormal ECG pattern requires clinical review",
    )


def _score_symptoms(symptoms: str) -> tuple[int, list[dict], list[str]]:
    lower = symptoms.lower()
    points = 0
    findings: list[dict] = []
    reasons: list[str] = []
    for kw in HIGH_RISK_KEYWORDS:
        if kw in lower:
            points += 15
            label = "Chest discomfort reported" if kw in ("chest pain", "chest discomfort") else "Breathing difficulty reported"
            if not any(f["label"] == label for f in findings):
                findings.append({"code": f"SYMPTOM_{kw.replace(' ', '_').upper()}", "label": label, "severity": "HIGH"})
                reasons.append(f"{label} by patient")
    for kw in MODERATE_RISK_KEYWORDS:
        if kw in lower:
            points += 5
    return min(points, 30), findings, reasons


def _score_trend(trend: Optional[list[float]]) -> tuple[int, Optional[str]]:
    if not trend or len(trend) < 2:
        return 0, None
    first, last = trend[0], trend[-1]
    if first - last >= 5:
        return 10, "Downward SpO2 trend detected across recent visits"
    return 0, None


def compute_risk_level(score: int) -> str:
    if score >= 70:
        return "HIGH"
    if score >= 40:
        return "MODERATE"
    return "LOW"


def run_screening(
    patient_id: str,
    vitals: dict,
    ecg_abnormal: bool,
    symptoms: str,
    previous_spo2_trend: Optional[list[float]] = None,
) -> dict:
    spo2_pts, spo2_finding, spo2_reason = _score_spo2(vitals["spo2"])
    hr_pts, hr_finding, hr_reason = _score_heart_rate(vitals["heartRate"])
    temp_pts, temp_finding, temp_reason = _score_temperature(vitals["temperature"])
    ecg_pts, ecg_finding, ecg_reason = _score_ecg(ecg_abnormal)
    symptom_pts, symptom_findings, symptom_reasons = _score_symptoms(symptoms)
    trend_pts, trend_reason = _score_trend(previous_spo2_trend)

    raw_score = spo2_pts + hr_pts + temp_pts + ecg_pts + symptom_pts + trend_pts
    risk_score = max(0, min(100, raw_score))
    risk_level = compute_risk_level(risk_score)

    findings = [f for f in [spo2_finding, hr_finding, temp_finding, ecg_finding] if f] + symptom_findings
    reasons = [r for r in [spo2_reason, hr_reason, temp_reason, ecg_reason] if r] + symptom_reasons
    if trend_reason:
        reasons.append(trend_reason)
    if not reasons:
        reasons.append("All monitored vital signs are within configured normal ranges")

    if risk_level == "HIGH":
        recommendation = "Urgent clinical assessment recommended according to configured screening protocol."
    elif risk_level == "MODERATE":
        recommendation = "Clinical review recommended within the configured timeframe."
    else:
        recommendation = "Continue routine monitoring according to configured protocol."

    return {
        "id": generate_id("SCR"),
        "patientId": patient_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "riskScore": risk_score,
        "riskLevel": risk_level,
        "findings": findings,
        "reasons": reasons,
        "vitals": vitals,
        "ecgAbnormal": ecg_abnormal,
        "moduleResults": {
            "vitalSignAnalysis": "Completed",
            "ecgAnalysis": "Completed",
            "heartSoundAnalysis": "Completed (simulated - no stethoscope hardware connected)",
            "lungSoundAnalysis": "Completed (simulated - no stethoscope hardware connected)",
            "trendAnalysis": "Completed" if previous_spo2_trend else "No prior visits available",
        },
        "recommendation": recommendation,
    }


def referral_for_risk(risk_level: str) -> dict:
    if risk_level == "HIGH":
        return {
            "careLevel": "District Hospital",
            "specialist": "Cardiology Review",
            "reason": "Abnormal vital signs and/or ECG pattern requiring urgent clinical assessment",
        }
    if risk_level == "MODERATE":
        return {
            "careLevel": "Taluk / Sub-District Hospital",
            "specialist": "General Medicine Review",
            "reason": "Vital signs outside normal range requiring clinical follow-up",
        }
    return {
        "careLevel": "Primary Health Centre (PHC)",
        "specialist": "Routine Follow-up",
        "reason": "Vital signs within normal range - continue routine monitoring",
    }
