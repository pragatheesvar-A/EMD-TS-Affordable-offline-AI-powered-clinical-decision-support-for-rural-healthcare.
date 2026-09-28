import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingDown, Calendar, Pill, AlertCircle, Send, UserCheck, FileText } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, SectionTitle, Button, EmptyState, RiskBadge, Badge } from '../components/shared/ui';

const typeIcon: Record<string, React.ReactNode> = {
  REGISTRATION: <UserCheck size={14} />,
  VISIT: <Calendar size={14} />,
  SCREENING: <AlertCircle size={14} />,
  REFERRAL: <Send size={14} />,
  DOCTOR_REVIEW: <FileText size={14} />,
  CONSENT: <FileText size={14} />,
};

export function PatientTimeline() {
  const { patients, activePatientId, setActivePatientId, getTimelineForPatient, getScreeningsForPatient, getReferralsForPatient } =
    useApp();
  const navigate = useNavigate();
  const patient = patients.find((p) => p.id === activePatientId);

  if (patients.length === 0) {
    return (
      <div className="animate-fade-in">
        <SectionTitle title="Patient Timeline" subtitle="Longitudinal history of visits, vitals and referrals." />
        <Card>
          <EmptyState title="No patients yet" subtitle="Register a patient to build their timeline." />
        </Card>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="animate-fade-in">
        <SectionTitle title="Patient Timeline" subtitle="Select a patient to view their longitudinal history." />
        <Card padded={false}>
          <div className="divide-y divide-slate-100">
            {patients.map((p) => (
              <button
                key={p.id}
                onClick={() => setActivePatientId(p.id)}
                className="w-full text-left px-5 py-3.5 hover:bg-slate-50 flex items-center justify-between"
              >
                <span className="text-sm font-medium text-slate-800">
                  {p.name} <span className="text-slate-400 font-normal">· {p.id}</span>
                </span>
                <span className="text-xs text-slate-400">{p.age} yrs · {p.village}</span>
              </button>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  const events = getTimelineForPatient(patient.id);
  const screenings = getScreeningsForPatient(patient.id).slice().reverse(); // chronological
  const referrals = getReferralsForPatient(patient.id);

  const chartData = screenings.map((s, i) => ({
    visit: `Visit ${i + 1}`,
    spo2: s.vitals.spo2,
    heartRate: s.vitals.heartRate,
    temperature: s.vitals.temperature,
  }));

  const spo2Values = chartData.map((c) => c.spo2);
  const downwardTrend =
    spo2Values.length >= 2 && spo2Values[0] - spo2Values[spo2Values.length - 1] >= 5;

  return (
    <div className="animate-fade-in">
      <SectionTitle
        title="Patient Health Timeline"
        subtitle={`${patient.name} · ${patient.age} yrs · ${patient.gender} · ${patient.village}`}
        action={
          <select
            className="text-sm border border-slate-300 rounded-lg px-3 py-2"
            value={patient.id}
            onChange={(e) => setActivePatientId(e.target.value)}
          >
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.id})
              </option>
            ))}
          </select>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <Card className="lg:col-span-1">
          <h3 className="font-semibold text-slate-900 text-sm mb-3">Patient Summary</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Known Conditions</dt><dd className="text-slate-800 text-right">{patient.knownConditions}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Medications</dt><dd className="text-slate-800 text-right flex items-center gap-1"><Pill size={12}/>{patient.medications}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Allergies</dt><dd className="text-slate-800 text-right">{patient.allergies}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Registered</dt><dd className="text-slate-800 text-right">{new Date(patient.createdAt).toLocaleDateString()}</dd></div>
          </dl>
          <div className="mt-4 flex gap-2">
            <Button size="sm" onClick={() => navigate('/screening')}>Screen Again</Button>
            <Button size="sm" variant="secondary" onClick={() => navigate('/doctor')}>Doctor View</Button>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-slate-900 text-sm">SpO₂, Heart Rate &amp; Temperature Trend</h3>
            {downwardTrend && (
              <span className="flex items-center gap-1 text-xs font-medium text-red-600">
                <TrendingDown size={14} /> Downward SpO₂ trend detected
              </span>
            )}
          </div>
          {chartData.length < 2 ? (
            <EmptyState title="Not enough visits yet" subtitle="Trend charts appear after at least two screenings." />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" />
                <XAxis dataKey="visit" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip />
                <Line type="monotone" dataKey="spo2" name="SpO₂ %" stroke="#2f7dfa" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="heartRate" name="Heart Rate" stroke="#dc2626" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="temperature" name="Temp °C" stroke="#d97706" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
          {downwardTrend && (
            <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 mt-2">
              Downward SpO₂ trend detected ({spo2Values[0]}% → {spo2Values[spo2Values.length - 1]}%) — clinician
              review recommended.
            </p>
          )}
        </Card>
      </div>

      <Card>
        <h3 className="font-semibold text-slate-900 text-sm mb-4">Visit &amp; Event History</h3>
        {events.length === 0 ? (
          <EmptyState title="No events recorded yet" />
        ) : (
          <ol className="relative border-l border-slate-200 ml-2 space-y-6">
            {events.map((ev) => (
              <li key={ev.id} className="ml-5">
                <span className="absolute -left-[9px] w-4 h-4 rounded-full bg-white border-2 border-brand-500 flex items-center justify-center" />
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-0.5">
                  <span>{new Date(ev.timestamp).toLocaleString()}</span>
                  <Badge color="slate">{ev.type.replace('_', ' ')}</Badge>
                </div>
                <p className="text-sm text-slate-700 flex items-center gap-1.5">
                  {typeIcon[ev.type]}
                  {ev.summary}
                </p>
              </li>
            ))}
          </ol>
        )}
      </Card>

      {referrals.length > 0 && (
        <Card className="mt-4">
          <h3 className="font-semibold text-slate-900 text-sm mb-3">Referral History</h3>
          <div className="space-y-2">
            {referrals.map((r) => (
              <div key={r.id} className="flex items-center justify-between border border-slate-100 rounded-lg px-3.5 py-2.5">
                <div>
                  <p className="text-sm text-slate-800 font-medium">{r.careLevel} — {r.specialist}</p>
                  <p className="text-xs text-slate-500">{new Date(r.createdAt).toLocaleString()}</p>
                </div>
                <RiskBadge level={r.priority} />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
