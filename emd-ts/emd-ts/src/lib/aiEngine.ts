// ============================================================
// EMD-TS Edge AI Screening Engine
// ------------------------------------------------------------
// Deterministic, fully local rule-engine that stands in for the
// TinyML / CNN models described in the architecture (ECG AI, heart
// sound AI, lung sound AI). This is AI-ASSISTED SCREENING /
// RISK PRIORITIZATION — never an automated diagnosis. All scoring
// logic is transparent and explainable by design.
// ============================================================

import type { RiskLevel, ScreeningFinding, ScreeningResult, VitalsReading } from '../types';

export interface ScreeningInput {
  patientId: string;
  vitals: VitalsReading;
  ecgAbnormal: boolean;
  symptoms: string;
  previousSpo2Trend?: number[]; // most recent last
}

const HIGH_RISK_KEYWORDS = [
  'breathing difficulty',
  'breathless',
  'shortness of breath',
  'chest pain',
  'chest discomfort',
  'unconscious',
  'severe',
];

const MODERATE_RISK_KEYWORDS = ['fever', 'cough', 'dizziness', 'fatigue', 'vomiting', 'weakness'];

function scoreSpo2(spo2: number): { points: number; finding?: ScreeningFinding; reason?: string } {
  if (spo2 >= 95) return { points: 0 };
  if (spo2 >= 90) {
    return {
      points: 25,
      finding: { code: 'SPO2_MODERATE', label: 'Moderately low oxygen saturation (SpO₂)', severity: 'MODERATE' },
      reason: 'SpO₂ below configured normal screening threshold (90–94%)',
    };
  }
  return {
    points: 40,
    finding: { code: 'SPO2_HIGH', label: 'Low oxygen saturation (SpO₂ < 90%)', severity: 'HIGH' },
    reason: 'SpO₂ below configured clinical threshold (<90%)',
  };
}

function scoreHeartRate(hr: number): { points: number; finding?: ScreeningFinding; reason?: string } {
  if (hr >= 60 && hr <= 100) return { points: 0 };
  if (hr < 60) {
    return {
      points: 15,
      finding: { code: 'HR_LOW', label: 'Low heart rate (bradycardia range)', severity: 'MODERATE' },
      reason: 'Heart rate below configured normal range (<60 BPM)',
    };
  }
  if (hr <= 120) {
    return {
      points: 15,
      finding: { code: 'HR_MODERATE', label: 'Elevated heart rate', severity: 'MODERATE' },
      reason: 'Heart rate above configured normal range (101–120 BPM)',
    };
  }
  return {
    points: 30,
    finding: { code: 'HR_HIGH', label: 'Significantly elevated heart rate', severity: 'HIGH' },
    reason: 'Heart rate significantly elevated (>120 BPM)',
  };
}

function scoreTemperature(temp: number): { points: number; finding?: ScreeningFinding; reason?: string } {
  if (temp < 37.5) return { points: 0 };
  if (temp < 38.5) {
    return {
      points: 10,
      finding: { code: 'TEMP_MODERATE', label: 'Elevated body temperature', severity: 'MODERATE' },
      reason: 'Elevated body temperature (37.5–38.4°C)',
    };
  }
  return {
    points: 20,
    finding: { code: 'TEMP_HIGH', label: 'High fever', severity: 'HIGH' },
    reason: 'High body temperature (≥38.5°C) — increased priority',
  };
}

function scoreEcg(abnormal: boolean): { points: number; finding?: ScreeningFinding; reason?: string } {
  if (!abnormal) return { points: 0 };
  return {
    points: 25,
    finding: { code: 'ECG_ABNORMAL', label: 'Abnormal ECG pattern requires clinical review', severity: 'HIGH' },
    reason: 'Abnormal ECG pattern requires clinical review',
  };
}

function scoreSymptoms(symptoms: string): { points: number; findings: ScreeningFinding[]; reasons: string[] } {
  const lower = symptoms.toLowerCase();
  let points = 0;
  const findings: ScreeningFinding[] = [];
  const reasons: string[] = [];

  for (const kw of HIGH_RISK_KEYWORDS) {
    if (lower.includes(kw)) {
      points += 15;
      const label = kw === 'chest pain' || kw === 'chest discomfort'
        ? 'Chest discomfort reported'
        : 'Breathing difficulty reported';
      if (!findings.find((f) => f.label === label)) {
        findings.push({ code: `SYMPTOM_${kw.replace(/\s+/g, '_').toUpperCase()}`, label, severity: 'HIGH' });
        reasons.push(`${label} by patient`);
      }
    }
  }
  for (const kw of MODERATE_RISK_KEYWORDS) {
    if (lower.includes(kw)) {
      points += 5;
    }
  }
  return { points: Math.min(points, 30), findings, reasons };
}

function scoreTrend(trend?: number[]): { points: number; reason?: string } {
  if (!trend || trend.length < 2) return { points: 0 };
  const first = trend[0];
  const last = trend[trend.length - 1];
  if (first - last >= 5) {
    return { points: 10, reason: 'Downward SpO₂ trend detected across recent visits' };
  }
  return { points: 0 };
}

export function computeRiskLevel(score: number): RiskLevel {
  if (score >= 70) return 'HIGH';
  if (score >= 40) return 'MODERATE';
  return 'LOW';
}

export function runScreening(input: ScreeningInput): ScreeningResult {
  const { vitals, ecgAbnormal, symptoms, previousSpo2Trend } = input;

  const spo2Res = scoreSpo2(vitals.spo2);
  const hrRes = scoreHeartRate(vitals.heartRate);
  const tempRes = scoreTemperature(vitals.temperature);
  const ecgRes = scoreEcg(ecgAbnormal);
  const symptomRes = scoreSymptoms(symptoms);
  const trendRes = scoreTrend(previousSpo2Trend);

  const rawScore =
    spo2Res.points + hrRes.points + tempRes.points + ecgRes.points + symptomRes.points + trendRes.points;
  const riskScore = Math.max(0, Math.min(100, rawScore));
  const riskLevel = computeRiskLevel(riskScore);

  const findings: ScreeningFinding[] = [
    spo2Res.finding,
    hrRes.finding,
    tempRes.finding,
    ecgRes.finding,
    ...symptomRes.findings,
  ].filter((f): f is ScreeningFinding => Boolean(f));

  const reasons: string[] = [
    spo2Res.reason,
    hrRes.reason,
    tempRes.reason,
    ecgRes.reason,
    ...symptomRes.reasons,
    trendRes.reason,
  ].filter((r): r is string => Boolean(r));

  if (reasons.length === 0) {
    reasons.push('All monitored vital signs are within configured normal ranges');
  }

  const recommendation =
    riskLevel === 'HIGH'
      ? 'Urgent clinical assessment recommended according to configured screening protocol.'
      : riskLevel === 'MODERATE'
      ? 'Clinical review recommended within the configured timeframe.'
      : 'Continue routine monitoring according to configured protocol.';

  return {
    id: `SCR-${Date.now()}`,
    patientId: input.patientId,
    timestamp: new Date().toISOString(),
    riskScore,
    riskLevel,
    findings,
    reasons,
    vitals,
    ecgAbnormal,
    moduleResults: {
      vitalSignAnalysis: 'Completed',
      ecgAnalysis: 'Completed',
      heartSoundAnalysis: 'Completed (simulated — no stethoscope hardware connected)',
      lungSoundAnalysis: 'Completed (simulated — no stethoscope hardware connected)',
      trendAnalysis: previousSpo2Trend ? 'Completed' : 'No prior visits available',
    },
    recommendation,
  };
}

export function referralForRisk(riskLevel: RiskLevel): {
  careLevel: string;
  specialist: string;
  reason: string;
} {
  if (riskLevel === 'HIGH') {
    return {
      careLevel: 'District Hospital',
      specialist: 'Cardiology Review',
      reason: 'Abnormal vital signs and/or ECG pattern requiring urgent clinical assessment',
    };
  }
  if (riskLevel === 'MODERATE') {
    return {
      careLevel: 'Taluk / Sub-District Hospital',
      specialist: 'General Medicine Review',
      reason: 'Vital signs outside normal range requiring clinical follow-up',
    };
  }
  return {
    careLevel: 'Primary Health Centre (PHC)',
    specialist: 'Routine Follow-up',
    reason: 'Vital signs within normal range — continue routine monitoring',
  };
}
