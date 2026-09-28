import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Activity, AlertTriangle, Send, Sparkles, PlusCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, SectionTitle, Button, RiskBadge, Badge, StatTile } from '../components/shared/ui';

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

export function Dashboard() {
  const { patients, screenings, referrals, setActivePatientId } = useApp();
  const navigate = useNavigate();

  const patientsToday = patients.filter((p) => isToday(p.createdAt)).length;
  const activeMonitoring = patients.length; // all registered patients considered monitorable in demo
  const latestScreeningByPatient = new Map<string, (typeof screenings)[number]>();
  screenings
    .slice()
    .sort((a, b) => (a.timestamp < b.timestamp ? -1 : 1))
    .forEach((s) => latestScreeningByPatient.set(s.patientId, s));
  const highPriority = Array.from(latestScreeningByPatient.values()).filter((s) => s.riskLevel === 'HIGH').length;
  const pendingReferrals = referrals.length;

  const recent = patients
    .slice()
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 6);

  return (
    <div className="animate-fade-in">
      <SectionTitle
        title="PHC Healthcare Worker Dashboard"
        subtitle="Overview of today's screening activity across your primary health centre."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => navigate('/registration')}>
              <PlusCircle size={16} /> Start New Screening
            </Button>
            <Button onClick={() => navigate('/demo')}>
              <Sparkles size={16} /> Run Hackathon Demo
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatTile label="Total Patients Today" value={patientsToday} icon={<Users size={20} />} tint="blue" />
        <StatTile label="Active Monitoring" value={activeMonitoring} icon={<Activity size={20} />} tint="green" />
        <StatTile label="High Priority" value={highPriority} icon={<AlertTriangle size={20} />} tint="red" />
        <StatTile label="Pending Referrals" value={pendingReferrals} icon={<Send size={20} />} tint="amber" />
      </div>

      <Card padded={false}>
        <div className="flex items-center justify-between px-5 pt-5">
          <div>
            <h2 className="font-semibold text-slate-900">Recent Patients</h2>
            <p className="text-xs text-slate-500 mt-0.5">Registered locally on this device</p>
          </div>
          <Badge color="purple">DEMO DATA</Badge>
        </div>
        <div className="mt-4 divide-y divide-slate-100">
          {recent.length === 0 && (
            <p className="text-sm text-slate-400 px-5 py-8 text-center">
              No patients yet. Click "Start New Screening" to register your first patient.
            </p>
          )}
          {recent.map((p) => {
            const latest = latestScreeningByPatient.get(p.id);
            return (
              <button
                key={p.id}
                onClick={() => {
                  setActivePatientId(p.id);
                  navigate('/timeline');
                }}
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 text-left transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center text-xs font-bold shrink-0">
                    {p.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {p.name} {p.isDemo && <span className="text-slate-400 font-normal">· demo</span>}
                    </p>
                    <p className="text-xs text-slate-500">
                      {p.age} yrs · {p.gender} · {p.village} · {p.id}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 ml-3">
                  {latest ? <RiskBadge level={latest.riskLevel} /> : <Badge color="slate">Not screened</Badge>}
                </div>
              </button>
            );
          })}
        </div>
        <div className="h-2" />
      </Card>
    </div>
  );
}
