import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, HeartPulse, Wind, Thermometer, CreditCard, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, SectionTitle, Button, RiskBadge, EmptyState, Badge, Field, inputClass } from '../components/shared/ui';
import { EcgWaveform } from '../components/wearable/EcgWaveform';
import type { DoctorAction, Patient, RiskLevel } from '../types';

function PriorityColumn({
  title,
  level,
  patients,
  latestFor,
  onSelect,
  selectedId,
}: {
  title: string;
  level: RiskLevel;
  patients: Patient[];
  latestFor: (id: string) => { riskLevel: RiskLevel; riskScore: number } | undefined;
  onSelect: (id: string) => void;
  selectedId: string | null;
}) {
  const filtered = patients.filter((p) => latestFor(p.id)?.riskLevel === level);
  return (
    <div>
      <div className="flex items-center justify-between mb-2 px-1">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{title}</h3>
        <Badge color="slate">{filtered.length}</Badge>
      </div>
      <div className="space-y-2">
        {filtered.length === 0 && <p className="text-xs text-slate-300 px-1">None</p>}
        {filtered.map((p) => {
          const s = latestFor(p.id);
          return (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              className={`w-full text-left rounded-xl border px-3.5 py-3 transition-colors ${
                selectedId === p.id ? 'border-brand-400 bg-brand-50/60' : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <p className="text-sm font-medium text-slate-900">{p.name}</p>
              <p className="text-xs text-slate-500">{p.age} yrs · {p.id}</p>
              {s && <p className="text-[11px] text-slate-400 mt-1">Score {s.riskScore}/100</p>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const ACTIONS: DoctorAction[] = ['Reviewed', 'Refer', 'Monitor', 'Additional Investigation'];

export function DoctorDashboard() {
  const navigate = useNavigate();
  const {
    patients,
    getScreeningsForPatient,
    getReferralsForPatient,
    getReviewsForPatient,
    getTimelineForPatient,
    addDoctorReview,
    viewRecord,
  } = useApp();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [savedFlash, setSavedFlash] = useState(false);

  const latestFor = (id: string) => {
    const s = getScreeningsForPatient(id);
    return s[0];
  };

  function handleSelect(id: string) {
    setSelectedId(id);
    setNotes('');
    setSavedFlash(false);
    viewRecord(id, 'DOCTOR');
  }

  const patient = patients.find((p) => p.id === selectedId);
  const screening = patient ? getScreeningsForPatient(patient.id)[0] : undefined;
  const referrals = patient ? getReferralsForPatient(patient.id) : [];
  const reviews = patient ? getReviewsForPatient(patient.id) : [];
  const timeline = patient ? getTimelineForPatient(patient.id) : [];

  async function handleAction(action: DoctorAction) {
    if (!patient) return;
    await addDoctorReview(patient.id, notes || `${action} — no additional notes provided.`, action, screening?.id);
    setSavedFlash(true);
    setNotes('');
  }

  return (
    <div className="animate-fade-in">
      <SectionTitle
        title="Doctor Dashboard"
        subtitle="Review AI-flagged patients grouped by priority. The AI never diagnoses or prescribes — you make the final call."
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="lg:col-span-1">
          <div className="space-y-6">
            <PriorityColumn title="High Priority" level="HIGH" patients={patients} latestFor={latestFor} onSelect={handleSelect} selectedId={selectedId} />
            <PriorityColumn title="Moderate Priority" level="MODERATE" patients={patients} latestFor={latestFor} onSelect={handleSelect} selectedId={selectedId} />
            <PriorityColumn title="Low Priority" level="LOW" patients={patients} latestFor={latestFor} onSelect={handleSelect} selectedId={selectedId} />
          </div>
        </Card>

        <div className="lg:col-span-3">
          {!patient ? (
            <Card>
              <EmptyState title="Select a patient" subtitle="Choose a patient from the priority list to review their case." icon={<ClipboardList />} />
            </Card>
          ) : (
            <div className="space-y-4">
              <Card>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">{patient.name}</h3>
                    <p className="text-xs text-slate-500">{patient.age} yrs · {patient.gender} · {patient.village} · {patient.id}</p>
                  </div>
                  {screening && <RiskBadge level={screening.riskLevel} />}
                </div>
                <p className="text-sm text-slate-600 mb-3">{patient.symptoms} ({patient.duration})</p>
                {screening && (
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="rounded-lg bg-slate-50 p-3 text-center">
                      <HeartPulse size={16} className="mx-auto text-red-500 mb-1" />
                      <p className="text-sm font-semibold">{screening.vitals.heartRate} BPM</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3 text-center">
                      <Wind size={16} className="mx-auto text-brand-500 mb-1" />
                      <p className="text-sm font-semibold">{screening.vitals.spo2}%</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3 text-center">
                      <Thermometer size={16} className="mx-auto text-amber-500 mb-1" />
                      <p className="text-sm font-semibold">{screening.vitals.temperature}°C</p>
                    </div>
                  </div>
                )}
                <EcgWaveform
                  running={true}
                  bpm={screening?.vitals.heartRate ?? 78}
                  abnormal={screening?.ecgAbnormal ?? false}
                  height={110}
                  lineColor={screening?.ecgAbnormal ? '#dc2626' : '#16a34a'}
                />
                <p className="text-[10px] text-slate-400 mt-1">Prototype signal — demonstration only.</p>
              </Card>

              {screening && (
                <Card>
                  <h4 className="font-semibold text-slate-900 text-sm mb-2">AI Findings &amp; Risk Explanation</h4>
                  <ul className="space-y-1.5 mb-3">
                    {screening.reasons.map((r, i) => (
                      <li key={i} className="text-sm text-slate-600 flex gap-2">
                        <span className="text-slate-300">•</span>{r}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">{screening.recommendation}</p>
                </Card>
              )}

              <Card>
                <h4 className="font-semibold text-slate-900 text-sm mb-2">Timeline</h4>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {timeline.map((ev) => (
                    <p key={ev.id} className="text-xs text-slate-500">
                      <span className="text-slate-400">{new Date(ev.timestamp).toLocaleString()}</span> — {ev.summary}
                    </p>
                  ))}
                </div>
              </Card>

              {referrals.length > 0 && (
                <Card>
                  <h4 className="font-semibold text-slate-900 text-sm mb-2">Referral</h4>
                  {referrals.map((r) => (
                    <div key={r.id} className="text-sm text-slate-700 flex items-center justify-between border border-slate-100 rounded-lg px-3 py-2 mb-1.5">
                      <span>{r.careLevel} — {r.specialist}</span>
                      <RiskBadge level={r.priority} />
                    </div>
                  ))}
                </Card>
              )}

              <Card>
                <h4 className="font-semibold text-slate-900 text-sm mb-2">Clinical Notes &amp; Final Review</h4>
                <Field label="Notes">
                  <textarea
                    className={`${inputClass} min-h-[90px]`}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add your clinical observations…"
                  />
                </Field>
                <div className="flex flex-wrap gap-2 mt-3">
                  {ACTIONS.map((a) => (
                    <Button key={a} variant={a === 'Refer' ? 'danger' : a === 'Reviewed' ? 'success' : 'secondary'} size="sm" onClick={() => handleAction(a)}>
                      {a}
                    </Button>
                  ))}
                </div>
                {savedFlash && (
                  <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3.5 py-3">
                    <p className="text-xs text-emerald-700 flex-1">
                      Saved — DOCTOR_REVIEWED transaction recorded on audit blockchain.
                    </p>
                    <Button size="sm" onClick={() => navigate('/consultation-payment')}>
                      <CreditCard size={14} /> Proceed to Consultation & Payment <ArrowRight size={14} />
                    </Button>
                  </div>
                )}

                {reviews.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                    <p className="text-xs font-semibold text-slate-500">Review History</p>
                    {reviews.slice().reverse().map((r) => (
                      <div key={r.id} className="text-xs text-slate-600 flex justify-between border border-slate-100 rounded-lg px-3 py-2">
                        <span>{r.action} — {r.notes}</span>
                        <span className="text-slate-400 shrink-0 ml-2">{new Date(r.createdAt).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
