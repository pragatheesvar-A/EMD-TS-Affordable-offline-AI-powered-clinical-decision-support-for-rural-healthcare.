import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, Languages, Mic } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, SectionTitle, Button, EmptyState, RiskBadge, Badge } from '../components/shared/ui';
import { MULTILINGUAL_DEMO } from '../i18n/translations';

export function ClinicalCopilot() {
  const { patients, activePatientId, getScreeningsForPatient } = useApp();
  const navigate = useNavigate();
  const patient = patients.find((p) => p.id === activePatientId);
  const [showTamil, setShowTamil] = useState(false);

  if (!patient) {
    return (
      <div className="animate-fade-in">
        <SectionTitle title="EMD-TS Clinical Copilot" subtitle="AI-generated structured summaries for clinician review." />
        <Card>
          <EmptyState title="No patient selected" subtitle="Select a patient to generate a clinical copilot summary." />
          <div className="flex justify-center mt-2">
            <Button onClick={() => navigate('/registration')}>Register a Patient</Button>
          </div>
        </Card>
      </div>
    );
  }

  const screenings = getScreeningsForPatient(patient.id);
  const latest = screenings[0];

  return (
    <div className="animate-fade-in">
      <SectionTitle
        title="EMD-TS Clinical Copilot"
        subtitle={`Structured AI-assisted summary for ${patient.name} (${patient.id})`}
      />

      {!latest ? (
        <Card>
          <EmptyState title="No screening available" subtitle="Run AI Screening first to generate a copilot summary." />
          <div className="flex justify-center mt-2">
            <Button onClick={() => navigate('/screening')}>Go to AI Screening</Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
                <Stethoscope size={18} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">Patient Summary</h3>
                <p className="text-xs text-slate-400">Auto-generated from local structured data — not free-text LLM output.</p>
              </div>
            </div>

            <div className="space-y-4 text-sm">
              <p className="text-slate-800">
                <span className="font-semibold">{patient.age}-year-old {patient.gender.toLowerCase()}</span> presenting to{' '}
                {patient.village} PHC. Known conditions: {patient.knownConditions}. Current medications:{' '}
                {patient.medications}. Allergies: {patient.allergies}.
              </p>

              <div>
                <p className="font-semibold text-slate-700 mb-1">Symptoms</p>
                <p className="text-slate-600">{patient.symptoms} ({patient.duration})</p>
              </div>

              <div>
                <p className="font-semibold text-slate-700 mb-1">Vitals</p>
                <p className="text-slate-600">
                  HR {latest.vitals.heartRate} BPM · SpO₂ {latest.vitals.spo2}% · Temperature {latest.vitals.temperature}°C
                </p>
              </div>

              <div>
                <p className="font-semibold text-slate-700 mb-1">AI Screening Findings</p>
                <ul className="space-y-1">
                  {latest.findings.map((f) => (
                    <li key={f.code} className="text-slate-600 flex gap-2">
                      <span className="text-slate-300">•</span>
                      {f.label}
                    </li>
                  ))}
                  {latest.findings.length === 0 && <li className="text-slate-500">No abnormal findings detected.</li>}
                </ul>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-semibold text-slate-700">Priority:</span>
                <RiskBadge level={latest.riskLevel} />
              </div>

              <div>
                <p className="font-semibold text-slate-700 mb-1">Suggested Next Step</p>
                <p className="text-slate-600">{latest.recommendation}</p>
              </div>
            </div>

            <div className="mt-5 bg-slate-50 border border-slate-200 rounded-xl p-3.5">
              <p className="text-xs text-slate-500">
                AI-assisted screening support. Clinician must make the final decision.
              </p>
            </div>

            <div className="flex gap-2 mt-4">
              <Button onClick={() => navigate('/referral')}>Generate Smart Referral →</Button>
              <Button variant="secondary" onClick={() => window.print()}>
                Print / Export
              </Button>
            </div>
          </Card>

          <Card className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <Languages size={17} className="text-brand-600" />
              <h3 className="font-semibold text-slate-900 text-sm">Multilingual Voice/Text</h3>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Structured symptom extraction demonstrated locally (Tamil ↔ English). Full pipeline: Sherpa-ONNX /
              Vosk speech-to-text → IndicTrans2 translation → Android TTS / Piper text-to-speech (future
              production).
            </p>
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setShowTamil(false)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border ${!showTamil ? 'bg-brand-50 text-brand-700 border-brand-200' : 'border-slate-200 text-slate-500'}`}
              >
                English
              </button>
              <button
                onClick={() => setShowTamil(true)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border ${showTamil ? 'bg-brand-50 text-brand-700 border-brand-200' : 'border-slate-200 text-slate-500'}`}
              >
                தமிழ் (Tamil)
              </button>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 mb-3">
              <p className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1">
                <Mic size={12} /> Voice input (simulated)
              </p>
              <p className="text-sm text-slate-800 italic">
                {showTamil ? MULTILINGUAL_DEMO.tamil : MULTILINGUAL_DEMO.english}
              </p>
              {showTamil && <p className="text-xs text-slate-400 mt-1">"{MULTILINGUAL_DEMO.transliteration}"</p>}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-1.5">Structured extraction</p>
              <div className="flex gap-2">
                <Badge color="blue">Symptom: {MULTILINGUAL_DEMO.extraction.symptom}</Badge>
                <Badge color="amber">Duration: {MULTILINGUAL_DEMO.extraction.duration}</Badge>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-4">
              Hackathon MVP priority: Tamil + English. Architecture extends to Hindi, Telugu, Kannada, Malayalam.
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}
