import React from 'react';
import { ArrowDown } from 'lucide-react';
import { Card, SectionTitle, Badge } from '../components/shared/ui';

function FlowStep({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-center card-shadow">
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        {detail && <p className="text-xs text-slate-500 mt-0.5">{detail}</p>}
      </div>
      <div className="flex justify-center py-1.5 text-slate-300">
        <ArrowDown size={16} />
      </div>
    </div>
  );
}

const STACK: { layer: string; implemented: string[]; future: string[] }[] = [
  {
    layer: 'Hardware',
    implemented: [],
    future: ['ESP32 / Ambiq Apollo4', 'AD8232 / MAX30003 (ECG)', 'MAX30102 (PPG/SpO₂)', 'Temperature sensor', 'Digital stethoscope', 'BLE 5.2'],
  },
  {
    layer: 'Embedded + AI/ML',
    implemented: ['Deterministic local rule-engine (stand-in for TinyML models)'],
    future: ['C/C++ · ESP-IDF · FreeRTOS', 'TensorFlow Lite Micro', 'TinyML CNN (MobileNetV3 / EfficientNet-Lite)'],
  },
  {
    layer: 'Mobile / Frontend',
    implemented: ['React + TypeScript + Vite (web MVP)', 'IndexedDB/localStorage offline storage', 'Responsive, accessible UI'],
    future: ['Flutter + Dart native app', 'SQLite on-device'],
  },
  {
    layer: 'Local Language AI',
    implemented: ['Simulated structured extraction (Tamil/English demo)'],
    future: ['Sherpa-ONNX / Vosk / Whisper.cpp (speech-to-text)', 'IndicTrans2 / NLLB (translation)', 'Android TTS / Piper (text-to-speech)'],
  },
  {
    layer: 'Backend / Cloud',
    implemented: ['Local-only simulated sync queue'],
    future: ['Python + FastAPI REST API', 'Azure / Firebase', 'PostgreSQL + HL7 FHIR server'],
  },
  {
    layer: 'Security',
    implemented: ['SHA-256 record hashing (Web Crypto API)', 'Role-based access simulation', 'Consent management', 'Local permissioned audit blockchain'],
    future: ['AES-256 encryption at rest', 'JWT authentication', 'Hyperledger Fabric (production blockchain)'],
  },
];

export function Architecture() {
  return (
    <div className="animate-fade-in">
      <SectionTitle title="System Architecture" subtitle="How EMD-TS connects sensing, edge AI, and clinical workflow." />

      <Card className="mb-6">
        <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold mb-4">Prototype Data Flow</p>
        <div className="flex flex-col items-center">
          <FlowStep title="Patient" detail="Rural / semi-urban PHC" />
          <FlowStep title="Wearable Sensor Layer (simulated)" detail="ECG · PPG/SpO₂ · HR · Temperature · Activity" />
          <FlowStep title="Edge Controller" detail="Prototype: ESP32 · Production: Apollo4" />
          <FlowStep title="EMD-TS Mobile / Web App" detail="Registration · live monitoring · offline storage" />
          <FlowStep title="Edge AI / TinyML" detail="ECG · heart/lung sound · vitals · trend analysis" />
          <FlowStep title="Risk Assessment + Explainable AI" detail="Deterministic scoring, transparent reasons" />
          <FlowStep title="Clinical Copilot + Smart Referral" />
          <FlowStep title="Doctor Dashboard" detail="Human clinician makes final decision" />
          <FlowStep title="Secure Sync / Cloud (simulated)" detail="Offline-first, syncs when connectivity returns" />
          <div className="w-full max-w-md mx-auto rounded-xl border border-slate-200 bg-white px-4 py-3 text-center card-shadow">
            <p className="text-sm font-semibold text-slate-800">Security Layer</p>
            <p className="text-xs text-slate-500 mt-0.5">SHA-256 · RBAC · Consent · Local Permissioned Blockchain</p>
          </div>
        </div>
      </Card>

      <Card className="mb-6">
        <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold mb-4">Security &amp; Data Path</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-200 p-4">
            <Badge color="blue">Clinical Data</Badge>
            <p className="text-sm text-slate-700 mt-2">→ Encrypted, off-chain local storage</p>
            <p className="text-xs text-slate-400 mt-1">Never written to the blockchain.</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <Badge color="purple">Audit Data</Badge>
            <p className="text-sm text-slate-700 mt-2">→ SHA-256 → Permissioned blockchain → Tamper-evident audit</p>
            <p className="text-xs text-slate-400 mt-1">Only pseudonymous IDs, hashes, roles, actions, timestamps.</p>
          </div>
        </div>
      </Card>

      <Card>
        <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold mb-4">Technology Stack — Implemented vs Future</p>
        <div className="space-y-4">
          {STACK.map((s) => (
            <div key={s.layer} className="border border-slate-100 rounded-xl p-4">
              <p className="text-sm font-semibold text-slate-900 mb-2">{s.layer}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wide mb-1.5">
                    Implemented in MVP
                  </p>
                  {s.implemented.length === 0 ? (
                    <p className="text-xs text-slate-300">—</p>
                  ) : (
                    <ul className="space-y-1">
                      {s.implemented.map((i) => (
                        <li key={i} className="text-xs text-slate-600 flex gap-1.5">
                          <span className="text-emerald-500">✓</span>{i}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                    Future Production
                  </p>
                  <ul className="space-y-1">
                    {s.future.map((i) => (
                      <li key={i} className="text-xs text-slate-500 flex gap-1.5">
                        <span className="text-slate-300">○</span>{i}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
