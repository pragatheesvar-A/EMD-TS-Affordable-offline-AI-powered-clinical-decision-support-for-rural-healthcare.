import React from 'react';
import { Building2, Landmark, Truck, HeartHandshake, Briefcase, Wrench, RefreshCw, Radio } from 'lucide-react';
import { Card, SectionTitle, Badge } from '../components/shared/ui';

const CUSTOMERS = [
  { icon: Landmark, label: 'Government PHCs' },
  { icon: Building2, label: 'Private rural clinics' },
  { icon: Building2, label: 'Hospitals' },
  { icon: HeartHandshake, label: 'NGOs' },
  { icon: Truck, label: 'Mobile medical units' },
  { icon: Briefcase, label: 'Occupational health providers' },
  { icon: HeartHandshake, label: 'Home-care organizations' },
];

const REVENUE_STREAMS = [
  {
    icon: Wrench,
    title: 'Hardware Kit',
    detail: 'Low-cost one-time purchase',
    body: 'Wearable diagnostic patch + electronic stethoscope + edge controller, priced for institutional and NGO procurement at rural-scale volumes.',
  },
  {
    icon: RefreshCw,
    title: 'Software',
    detail: 'Subscription / institutional license',
    body: 'Per-PHC or per-district licensing for the mobile app, doctor dashboard, offline AI screening engine and FHIR-ready record system.',
  },
  {
    icon: Radio,
    title: 'Optional Services',
    detail: 'Telemedicine & analytics',
    body: 'Specialist telemedicine review sessions, population-level screening analytics, and integration support for state health department systems.',
  },
];

const IMPACT = [
  { group: 'Patients', points: ['Reduced unnecessary travel', 'Faster identification of high-risk cases', 'Better continuity of care'] },
  { group: 'Healthcare Workers', points: ['Faster triage', 'Less manual documentation', 'AI-assisted workflow'] },
  { group: 'Doctors', points: ['Structured information', 'Explainable AI flags', 'Remote review'] },
  { group: 'Healthcare System', points: ['Better patient history', 'Longitudinal trends', 'Scalable rural infrastructure'] },
];

const ROADMAP = [
  { phase: 'Phase 1', title: 'MVP', detail: 'Wearable + Flutter + Offline AI' },
  { phase: 'Phase 2', title: 'Connected Care', detail: 'Multilingual AI + Doctor Dashboard + FHIR' },
  { phase: 'Phase 3', title: 'Personalization', detail: 'Personalized patient baseline models' },
  { phase: 'Phase 4', title: 'Federated Learning', detail: 'Model improvement without sharing raw patient data' },
  { phase: 'Phase 5', title: 'Predictive Care', detail: 'Advanced predictive risk modelling' },
  { phase: 'Phase 6', title: 'Scale', detail: 'Larger healthcare ecosystems and certified workflows' },
];

export function BusinessModel() {
  return (
    <div className="animate-fade-in">
      <SectionTitle
        title="Business Model &amp; Scalability"
        subtitle="Who EMD-TS serves, how it sustains itself, and how it scales across rural healthcare infrastructure."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card>
          <h3 className="font-semibold text-slate-900 text-sm mb-4">Target Customers</h3>
          <div className="grid grid-cols-2 gap-2.5">
            {CUSTOMERS.map((c) => (
              <div key={c.label} className="flex items-center gap-2 rounded-lg border border-slate-100 px-3 py-2.5">
                <c.icon size={16} className="text-brand-600 shrink-0" />
                <span className="text-xs text-slate-700">{c.label}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-slate-900 text-sm mb-4">Possible Model</h3>
          <p className="text-sm text-slate-600 mb-3">
            <span className="font-semibold text-slate-800">Hardware + Software + Service</span> — a blended model
            that lowers the up-front barrier for public-sector buyers while creating recurring revenue for
            long-term sustainability.
          </p>
          <Badge color="blue">Not yet monetized — hackathon prototype</Badge>
        </Card>
      </div>

      <Card className="mb-4">
        <h3 className="font-semibold text-slate-900 text-sm mb-4">Revenue Streams</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {REVENUE_STREAMS.map((r) => (
            <div key={r.title} className="rounded-xl border border-slate-100 p-4">
              <div className="w-9 h-9 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center mb-3">
                <r.icon size={18} />
              </div>
              <p className="text-sm font-semibold text-slate-900">{r.title}</p>
              <p className="text-xs text-brand-600 font-medium mb-2">{r.detail}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{r.body}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mb-4">
        <h3 className="font-semibold text-slate-900 text-sm mb-4">Expected Impact — Who Benefits</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {IMPACT.map((g) => (
            <div key={g.group}>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{g.group}</p>
              <ul className="space-y-1.5">
                {g.points.map((p) => (
                  <li key={p} className="text-xs text-slate-600 flex gap-1.5">
                    <span className="text-slate-300">•</span>{p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold text-slate-900 text-sm mb-4">Future Roadmap</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {ROADMAP.map((r) => (
            <div key={r.phase} className="rounded-xl border border-slate-100 p-3 text-center">
              <p className="text-[10px] font-semibold text-brand-600 uppercase tracking-wide">{r.phase}</p>
              <p className="text-xs font-semibold text-slate-800 mt-1">{r.title}</p>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">{r.detail}</p>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-slate-400 mt-4">
          Clinical claims require appropriate validation and regulatory review before any commercial deployment.
        </p>
      </Card>
    </div>
  );
}
