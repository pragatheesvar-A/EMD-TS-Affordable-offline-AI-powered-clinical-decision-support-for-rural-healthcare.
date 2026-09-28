import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrainCircuit, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, SectionTitle, Button, EmptyState, RiskBadge } from '../components/shared/ui';
import { runScreening } from '../lib/aiEngine';
import type { ScreeningResult, VitalsReading } from '../types';

const MODULES = [
  { key: 'vitalSignAnalysis', label: 'Vital Sign Analysis' },
  { key: 'ecgAnalysis', label: 'ECG Analysis' },
  { key: 'heartSoundAnalysis', label: 'Heart Sound Analysis' },
  { key: 'lungSoundAnalysis', label: 'Lung Sound Analysis' },
  { key: 'trendAnalysis', label: 'Trend Analysis' },
] as const;

function RiskGauge({ score, level }: { score: number; level: 'LOW' | 'MODERATE' | 'HIGH' }) {
  const color = level === 'HIGH' ? '#dc2626' : level === 'MODERATE' ? '#d97706' : '#16a34a';
  const circumference = 2 * Math.PI * 54;
  const offset = circumference * (1 - score / 100);
  return (
    <div className="relative w-40 h-40 mx-auto">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <circle cx="60" cy="60" r="54" fill="none" stroke="#eef2f6" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r="54"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-slate-900">{score}</span>
        <span className="text-[11px] text-slate-400">/ 100</span>
      </div>
    </div>
  );
}

export function AIScreening() {
  const { patients, activePatientId, liveVitals, liveEcgAbnormal, wearableConnected, addScreening, getScreeningsForPatient } =
    useApp();
  const navigate = useNavigate();
  const patient = patients.find((p) => p.id === activePatientId);

  const [running, setRunning] = useState(false);
  const [moduleIndex, setModuleIndex] = useState(-1);
  const [result, setResult] = useState<ScreeningResult | null>(null);

  const existing = patient ? getScreeningsForPatient(patient.id) : [];

  useEffect(() => {
    if (existing.length > 0 && !result) {
      setResult(existing[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient?.id]);

  const vitalsToUse: VitalsReading | null = useMemo(() => {
    if (wearableConnected && liveVitals) return liveVitals;
    return existing[0]?.vitals ?? null;
  }, [wearableConnected, liveVitals, existing]);

  async function handleRun() {
    if (!patient || !vitalsToUse) return;
    setRunning(true);
    setResult(null);
    setModuleIndex(0);
    for (let i = 0; i < MODULES.length; i++) {
      setModuleIndex(i);
      await new Promise((r) => setTimeout(r, 450));
    }
    const spo2Trend = existing
      .slice()
      .reverse()
      .map((s) => s.vitals.spo2)
      .concat(vitalsToUse.spo2);

    const screening = runScreening({
      patientId: patient.id,
      vitals: vitalsToUse,
      ecgAbnormal: liveEcgAbnormal,
      symptoms: patient.symptoms,
      previousSpo2Trend: spo2Trend.length > 1 ? spo2Trend : undefined,
    });
    await addScreening(screening);
    setResult(screening);
    setModuleIndex(MODULES.length);
    setRunning(false);
  }

  if (!patient) {
    return (
      <div className="animate-fade-in">
        <SectionTitle title="EMD-TS Edge AI Screening" subtitle="AI-assisted screening / risk prioritization." />
        <Card>
          <EmptyState title="No patient selected" subtitle="Select a patient from the Dashboard or register a new one." />
          <div className="flex justify-center mt-2">
            <Button onClick={() => navigate('/registration')}>Register a Patient</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <SectionTitle
        title="EMD-TS Edge AI Screening"
        subtitle={`${patient.name} (${patient.id}) — AI-assisted screening / risk prioritization, not a diagnosis.`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-3">
            <BrainCircuit size={22} />
          </div>
          <h3 className="font-semibold text-slate-900">Local Edge AI Engine</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Deterministic rule-engine standing in for on-device TinyML models. Runs fully offline.
          </p>
          {!vitalsToUse && (
            <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mb-3">
              Connect the wearable on Live Monitoring first, or rely on the most recent recorded vitals.
            </p>
          )}
          <Button onClick={handleRun} disabled={running || !vitalsToUse} size="lg" className="w-full">
            {running ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Analyzing…
              </>
            ) : (
              'Run AI Screening'
            )}
          </Button>
          {vitalsToUse && !wearableConnected && (
            <p className="text-[11px] text-slate-400 mt-2">Using most recent recorded vitals for this patient.</p>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <h3 className="font-semibold text-slate-900 text-sm mb-3">Screening Modules</h3>
          <div className="space-y-2">
            {MODULES.map((m, i) => {
              const state = !running && !result ? 'idle' : i < moduleIndex ? 'done' : i === moduleIndex && running ? 'active' : result ? 'done' : 'idle';
              return (
                <div
                  key={m.key}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg border ${
                    state === 'active' ? 'border-brand-200 bg-brand-50' : 'border-slate-100'
                  }`}
                >
                  <span className="text-sm text-slate-700">{m.label}</span>
                  {state === 'done' && (
                    <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                      <CheckCircle2 size={14} /> Completed
                    </span>
                  )}
                  {state === 'active' && (
                    <span className="flex items-center gap-1 text-xs font-medium text-brand-600">
                      <Loader2 size={14} className="animate-spin" /> Analyzing…
                    </span>
                  )}
                  {state === 'idle' && <span className="text-xs text-slate-300">Pending</span>}
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {result && (
        <Card className="mt-4 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="text-center">
              <RiskGauge score={result.riskScore} level={result.riskLevel} />
              <div className="mt-3">
                <RiskBadge level={result.riskLevel} />
              </div>
              <p className="text-[11px] text-slate-400 mt-2">Risk score computed {new Date(result.timestamp).toLocaleTimeString()}</p>
            </div>
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={16} className="text-slate-500" />
                <h3 className="font-semibold text-slate-900 text-sm">Why was this patient flagged?</h3>
              </div>
              <ul className="space-y-1.5 mb-4">
                {result.reasons.map((r, i) => (
                  <li key={i} className="text-sm text-slate-600 flex gap-2">
                    <span className="text-slate-300">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
              <div className="bg-brand-50/70 border border-brand-100 rounded-xl p-3.5">
                <p className="text-xs font-semibold text-brand-700 uppercase tracking-wide mb-1">
                  AI-Assisted Recommendation
                </p>
                <p className="text-sm text-slate-700">{result.recommendation}</p>
              </div>
              <p className="text-[11px] text-slate-400 mt-3">
                This is AI-assisted screening / risk prioritization, not a diagnosis. Final diagnosis and treatment
                decision must be made by a qualified clinician.
              </p>
              <div className="flex gap-2 mt-4">
                <Button onClick={() => navigate('/copilot')}>Open Clinical Copilot →</Button>
                <Button variant="secondary" onClick={() => navigate('/referral')}>
                  Go to Smart Referral
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
