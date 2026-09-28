import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  CheckCircle2,
  Bluetooth,
  BrainCircuit,
  Languages,
  Stethoscope,
  Send,
  ClipboardList,
  Link2,
  ShieldCheck,
  ShieldAlert,
  UserX,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, SectionTitle, Button, RiskBadge, Badge, VerifiedPill } from '../components/shared/ui';
import { EcgWaveform } from '../components/wearable/EcgWaveform';
import { runScreening, referralForRisk } from '../lib/aiEngine';
import { MULTILINGUAL_DEMO } from '../i18n/translations';
import { computePatientRecordHash } from '../lib/patientHash';
import { shortHash } from '../lib/crypto';
import { blockchain } from '../lib/blockchain';
import type { ScreeningResult, ReferralRecord, VitalsReading } from '../types';

const DEMO_PATIENT_ID = 'PAT-1001';

const DEMO_VITALS: VitalsReading = {
  timestamp: new Date().toISOString(),
  heartRate: 118,
  spo2: 88,
  temperature: 38.5,
  activity: 'Light Activity',
  mode: 'HIGH_RISK',
};

interface StepDef {
  id: number;
  title: string;
  icon: React.ReactNode;
}

const STEPS: StepDef[] = [
  { id: 1, title: 'Load demo patient — Ravi Kumar, 56, Male', icon: <UserX size={15} className="rotate-0" /> },
  { id: 2, title: 'Connect simulated wearable', icon: <Bluetooth size={15} /> },
  { id: 3, title: 'Live vitals: HR 118 · SpO₂ 88% · Temp 38.5°C', icon: <Bluetooth size={15} /> },
  { id: 4, title: 'Animated ECG (abnormal pattern)', icon: <BrainCircuit size={15} /> },
  { id: 5, title: 'Run Edge AI Screening', icon: <BrainCircuit size={15} /> },
  { id: 6, title: 'Risk result: HIGH PRIORITY', icon: <ShieldAlert size={15} /> },
  { id: 7, title: 'Explainable AI — why flagged?', icon: <ShieldAlert size={15} /> },
  { id: 8, title: 'Tamil multilingual interaction', icon: <Languages size={15} /> },
  { id: 9, title: 'Generate Clinical Copilot summary', icon: <Stethoscope size={15} /> },
  { id: 10, title: 'Generate Smart Referral', icon: <Send size={15} /> },
  { id: 11, title: 'Doctor opens patient record', icon: <ClipboardList size={15} /> },
  { id: 12, title: 'Doctor reviews & takes action', icon: <ClipboardList size={15} /> },
  { id: 13, title: 'Blockchain audit event recorded', icon: <Link2 size={15} /> },
  { id: 14, title: 'Integrity verification — VERIFIED', icon: <ShieldCheck size={15} /> },
  { id: 15, title: 'Simulate unauthorized access', icon: <UserX size={15} /> },
  { id: 16, title: 'ACCESS DENIED', icon: <UserX size={15} /> },
  { id: 17, title: 'Simulate record tampering', icon: <ShieldAlert size={15} /> },
  { id: 18, title: 'INTEGRITY VERIFICATION FAILED', icon: <ShieldAlert size={15} /> },
  { id: 19, title: 'Restore original record', icon: <RotateCcw size={15} /> },
  { id: 20, title: 'INTEGRITY VERIFIED', icon: <ShieldCheck size={15} /> },
];

const AUTOPLAY_MS = 4200;

export function DemoRunner() {
  const app = useApp();
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(0); // 0-based, -1 = not started
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const executedRef = useRef<Set<number>>(new Set());

  const [screening, setScreening] = useState<ScreeningResult | null>(null);
  const [referral, setReferral] = useState<ReferralRecord | null>(null);
  const [originalHash, setOriginalHash] = useState('');
  const [currentHash, setCurrentHash] = useState('');
  const [accessDenied, setAccessDenied] = useState(false);
  const [tampered, setTampered] = useState(false);
  const [restored, setRestored] = useState(false);

  const patient = app.patients.find((p) => p.id === DEMO_PATIENT_ID);

  const refreshHash = useCallback(async () => {
    const p = app.patients.find((pp) => pp.id === DEMO_PATIENT_ID);
    if (!p) return;
    const h = await computePatientRecordHash(p);
    setCurrentHash(h);
    if (!originalHash) setOriginalHash(p.recordHash);
  }, [app.patients, originalHash]);

  const runStep = useCallback(
    async (idx: number) => {
      if (executedRef.current.has(idx)) return;
      executedRef.current.add(idx);
      const step = STEPS[idx];
      if (!patient && step.id > 1) return;

      switch (step.id) {
        case 1: {
          app.setActivePatientId(DEMO_PATIENT_ID);
          break;
        }
        case 2: {
          app.setWearableConnected(true);
          break;
        }
        case 3: {
          app.setLiveVitals(DEMO_VITALS);
          break;
        }
        case 4: {
          app.setLiveEcgAbnormal(true);
          break;
        }
        case 5: {
          break; // visual only, computed at step 6
        }
        case 6: {
          if (!patient) break;
          const result = runScreening({
            patientId: patient.id,
            vitals: DEMO_VITALS,
            ecgAbnormal: true,
            symptoms: patient.symptoms,
            previousSpo2Trend: [98, 96, 94, 91, 88],
          });
          await app.addScreening(result);
          setScreening(result);
          await refreshHash();
          break;
        }
        case 7:
          break; // reasons already available on `screening`
        case 8:
          break; // static multilingual demo
        case 9:
          break; // copilot summary derived from `screening`
        case 10: {
          if (!patient || !screening) break;
          const ref = await app.addReferral(patient.id, screening, 'Auto-generated during hackathon demo run.');
          setReferral(ref);
          await refreshHash();
          break;
        }
        case 11: {
          await app.viewRecord(DEMO_PATIENT_ID, 'DOCTOR');
          break;
        }
        case 12: {
          await app.addDoctorReview(
            DEMO_PATIENT_ID,
            'Vitals and ECG consistent with AI flag. Referring for urgent cardiology assessment.',
            'Refer',
            screening?.id
          );
          await refreshHash();
          break;
        }
        case 13:
          await refreshHash();
          break;
        case 14:
          await refreshHash();
          break;
        case 15: {
          await app.simulateUnauthorizedAccess(DEMO_PATIENT_ID);
          setAccessDenied(true);
          break;
        }
        case 16:
          break;
        case 17: {
          await app.tamperPatientRecord(DEMO_PATIENT_ID);
          setTampered(true);
          await refreshHash();
          break;
        }
        case 18:
          await refreshHash();
          break;
        case 19: {
          await app.restorePatientRecord(DEMO_PATIENT_ID);
          setRestored(true);
          setTampered(false);
          await refreshHash();
          break;
        }
        case 20:
          await refreshHash();
          break;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [patient, screening]
  );

  useEffect(() => {
    if (started) runStep(stepIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex, started]);

  useEffect(() => {
    if (!playing) return;
    if (stepIndex >= STEPS.length - 1) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setStepIndex((i) => Math.min(i + 1, STEPS.length - 1)), AUTOPLAY_MS);
    return () => clearTimeout(t);
  }, [playing, stepIndex]);

  function handleStart() {
    setStarted(true);
    setPlaying(true);
    setStepIndex(0);
  }
  function handleRestart() {
    executedRef.current = new Set();
    setScreening(null);
    setReferral(null);
    setAccessDenied(false);
    setTampered(false);
    setRestored(false);
    setOriginalHash('');
    setCurrentHash('');
    setStarted(true);
    setPlaying(true);
    setStepIndex(0);
  }

  const step = STEPS[stepIndex];
  const details = screening ? referralForRisk(screening.riskLevel) : null;

  return (
    <div className="animate-fade-in">
      <SectionTitle
        title="Complete Hackathon Demo Mode"
        subtitle="A guided, end-to-end walkthrough of EMD-TS — approximately 3–5 minutes."
        action={
          !started ? (
            <Button size="lg" onClick={handleStart}>
              <Play size={16} /> Start Hackathon Demo
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setStepIndex((i) => Math.max(0, i - 1))} disabled={stepIndex === 0}>
                <SkipBack size={14} />
              </Button>
              <Button variant={playing ? 'secondary' : 'primary'} size="sm" onClick={() => setPlaying((p) => !p)}>
                {playing ? <Pause size={14} /> : <Play size={14} />} {playing ? 'Pause' : 'Play'}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setStepIndex((i) => Math.min(STEPS.length - 1, i + 1))}
                disabled={stepIndex === STEPS.length - 1}
              >
                <SkipForward size={14} />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleRestart}>
                <RotateCcw size={14} /> Restart
              </Button>
            </div>
          )
        }
      />

      {!started ? (
        <Card>
          <p className="text-sm text-slate-600 mb-4">
            This runs the full EMD-TS demonstration flow using demo patient <strong>Ravi Kumar (PAT-1001)</strong>:
            wearable connection, live vitals, ECG, AI screening, explainable risk, Tamil interaction, clinical
            copilot summary, smart referral, doctor review, blockchain audit, integrity verification, unauthorized
            access simulation, tamper detection, and restore.
          </p>
          <Button onClick={handleStart} size="lg">
            <Play size={16} /> Start Hackathon Demo
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <Card className="lg:col-span-1" padded={false}>
            <div className="p-4 pb-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Step {stepIndex + 1} of {STEPS.length}
              </p>
              <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-brand-600 transition-all"
                  style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}
                />
              </div>
            </div>
            <div className="max-h-[520px] overflow-y-auto px-2 pb-3">
              {STEPS.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setStepIndex(i)}
                  className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-xs mb-0.5 ${
                    i === stepIndex
                      ? 'bg-brand-50 text-brand-700 font-semibold'
                      : i < stepIndex
                      ? 'text-slate-400'
                      : 'text-slate-500'
                  }`}
                >
                  {i < stepIndex ? <CheckCircle2 size={13} className="text-emerald-500 shrink-0" /> : <span className="w-[13px] shrink-0">{s.icon}</span>}
                  <span className="truncate">{s.title}</span>
                </button>
              ))}
            </div>
          </Card>

          <Card className="lg:col-span-3">
            <p className="text-xs font-semibold text-brand-600 uppercase tracking-wide mb-1">Step {step.id}</p>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">{step.title}</h2>

            {step.id === 1 && patient && (
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center font-bold text-lg">
                  RK
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{patient.name}</p>
                  <p className="text-sm text-slate-500">{patient.age} yrs · {patient.gender} · {patient.village} · {patient.id}</p>
                  <p className="text-sm text-slate-500 mt-1">{patient.symptoms}</p>
                </div>
              </div>
            )}

            {step.id === 2 && (
              <div className="flex items-center gap-2 text-brand-700 bg-brand-50 rounded-xl px-4 py-3 text-sm">
                <Bluetooth size={18} /> BLE SIMULATION — CONNECTED (no real hardware attached)
              </div>
            )}

            {step.id === 3 && (
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-red-50 p-4 text-center"><p className="text-xs text-slate-500">Heart Rate</p><p className="text-2xl font-bold text-red-600">118</p><p className="text-xs text-slate-400">BPM</p></div>
                <div className="rounded-xl bg-red-50 p-4 text-center"><p className="text-xs text-slate-500">SpO₂</p><p className="text-2xl font-bold text-red-600">88%</p></div>
                <div className="rounded-xl bg-amber-50 p-4 text-center"><p className="text-xs text-slate-500">Temperature</p><p className="text-2xl font-bold text-amber-600">38.5°C</p></div>
              </div>
            )}

            {step.id === 4 && (
              <div>
                <EcgWaveform running bpm={118} abnormal height={150} lineColor="#dc2626" />
                <p className="text-[11px] text-slate-400 mt-1">Prototype signal — demonstration only.</p>
              </div>
            )}

            {step.id === 5 && (
              <div className="flex items-center gap-2 text-slate-600 text-sm">
                <BrainCircuit size={18} className="text-brand-600" /> Running vital sign, ECG, heart sound, lung
                sound and trend analysis modules locally…
              </div>
            )}

            {step.id === 6 && screening && (
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-4xl font-bold text-red-600">{screening.riskScore}</p>
                  <p className="text-xs text-slate-400">/ 100</p>
                </div>
                <RiskBadge level={screening.riskLevel} />
              </div>
            )}

            {step.id === 7 && screening && (
              <ul className="space-y-1.5">
                {screening.reasons.map((r, i) => (
                  <li key={i} className="text-sm text-slate-600 flex gap-2"><span className="text-slate-300">•</span>{r}</li>
                ))}
              </ul>
            )}

            {step.id === 8 && (
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 space-y-2">
                <p className="text-sm text-slate-800 italic">"{MULTILINGUAL_DEMO.tamil}"</p>
                <p className="text-xs text-slate-400">"{MULTILINGUAL_DEMO.transliteration}"</p>
                <div className="flex gap-2 pt-1">
                  <Badge color="blue">Symptom: {MULTILINGUAL_DEMO.extraction.symptom}</Badge>
                  <Badge color="amber">Duration: {MULTILINGUAL_DEMO.extraction.duration}</Badge>
                </div>
              </div>
            )}

            {step.id === 9 && screening && patient && (
              <div className="text-sm text-slate-700 space-y-2">
                <p>{patient.age}-year-old {patient.gender.toLowerCase()} — {patient.symptoms}.</p>
                <p>Vitals: HR {screening.vitals.heartRate} BPM · SpO₂ {screening.vitals.spo2}% · Temperature {screening.vitals.temperature}°C</p>
                <p>Findings: {screening.findings.map((f) => f.label).join('; ')}</p>
                <p className="font-semibold">Priority: {screening.riskLevel}</p>
                <p className="text-slate-500">Suggested next step: {screening.recommendation}</p>
              </div>
            )}

            {step.id === 10 && details && (
              <div className="text-sm text-slate-700 space-y-1">
                <p><span className="text-slate-500">Priority:</span> {screening?.riskLevel}</p>
                <p><span className="text-slate-500">Care Level:</span> {details.careLevel}</p>
                <p><span className="text-slate-500">Suggested Specialist:</span> {details.specialist}</p>
                <p><span className="text-slate-500">Reason:</span> {details.reason}</p>
                {referral && <p className="text-emerald-600 text-xs mt-2">✓ REFERRAL_GENERATED transaction recorded.</p>}
              </div>
            )}

            {step.id === 11 && (
              <div className="flex items-center gap-2 text-slate-700 text-sm">
                <ClipboardList size={18} className="text-brand-600" /> Dr. Kavitha Subramaniam opened {patient?.name}'s record. RECORD_VIEWED transaction recorded.
              </div>
            )}

            {step.id === 12 && (
              <div className="text-sm text-slate-700">
                <p className="italic bg-slate-50 rounded-lg p-3">
                  "Vitals and ECG consistent with AI flag. Referring for urgent cardiology assessment."
                </p>
                <p className="mt-2 font-semibold text-red-600">Action: Refer</p>
              </div>
            )}

            {step.id === 13 && (
              <div className="text-sm text-slate-600">
                <p>DOCTOR_REVIEWED transaction appended to the local audit blockchain.</p>
                <Button variant="secondary" size="sm" className="mt-3" onClick={() => navigate('/blockchain')}>
                  View Blockchain Audit Trail →
                </Button>
              </div>
            )}

            {step.id === 14 && (
              <div className="flex items-center justify-between bg-emerald-50 rounded-xl px-4 py-3">
                <span className="text-emerald-700 font-semibold text-sm">✓ INTEGRITY VERIFIED</span>
                <VerifiedPill ok={true} />
              </div>
            )}

            {step.id === 15 && (
              <p className="text-sm text-slate-600">
                Simulating an unrecognized user (<span className="font-mono">Unknown_User</span>) attempting to
                view {patient?.id}'s record without authorization…
              </p>
            )}

            {step.id === 16 && accessDenied && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm">
                <p><span className="text-slate-500">User:</span> <span className="font-mono">Unknown_User</span></p>
                <p><span className="text-slate-500">Patient:</span> <span className="font-mono">{DEMO_PATIENT_ID}</span></p>
                <p><span className="text-slate-500">Action:</span> VIEW_RECORD</p>
                <p className="font-semibold text-red-600 mt-1">❌ ACCESS DENIED — Insufficient permissions</p>
              </div>
            )}

            {step.id === 17 && (
              <p className="text-sm text-slate-600">
                Simulating unauthorized modification of {patient?.name}'s record (bypassing the normal app flow)…
              </p>
            )}

            {step.id === 18 && (
              <div>
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm mb-3">
                  <p className="font-semibold text-red-600">❌ INTEGRITY VERIFICATION FAILED</p>
                  <p className="text-xs text-slate-500 mt-1">Potential unauthorized modification detected.</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className="bg-slate-50 rounded-lg p-3"><p className="text-slate-400 font-sans mb-1">Original Hash</p><p className="break-all">{shortHash(originalHash, 28)}</p></div>
                  <div className="bg-slate-50 rounded-lg p-3"><p className="text-slate-400 font-sans mb-1">Current Hash</p><p className="break-all text-red-600">{shortHash(currentHash, 28)}</p></div>
                </div>
              </div>
            )}

            {step.id === 19 && (
              <p className="text-sm text-slate-600">Restoring {patient?.name}'s original record from the pristine snapshot…</p>
            )}

            {step.id === 20 && (
              <div className="flex items-center justify-between bg-emerald-50 rounded-xl px-4 py-3">
                <span className="text-emerald-700 font-semibold text-sm">✓ INTEGRITY VERIFIED</span>
                <VerifiedPill ok={true} />
              </div>
            )}

            {step.id === 20 && restored && (
              <div className="mt-6 text-center">
                <p className="text-sm text-slate-500 mb-3">Demo complete. Explore any page for full detail, or restart.</p>
                <div className="flex justify-center gap-2">
                  <Button onClick={() => navigate('/')}>Back to Dashboard</Button>
                  <Button variant="secondary" onClick={handleRestart}>
                    <RotateCcw size={14} /> Run Again
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
