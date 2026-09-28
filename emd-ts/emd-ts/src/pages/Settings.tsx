import React, { useState } from 'react';
import { Wifi, WifiOff, RefreshCcw, Trash2, Globe, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, SectionTitle, Button, Badge } from '../components/shared/ui';

const OFFLINE_CAPABILITIES = [
  'Patient registration',
  'Sensor simulation',
  'ECG',
  'AI screening',
  'Patient records',
  'Risk scoring',
  'Tamil / English',
  'Referral',
];

export function Settings() {
  const { language, setLanguage, isOnline, setIsOnline, syncQueue, syncNow, resetAllData } = useApp();
  const [syncing, setSyncing] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [synced, setSynced] = useState(false);

  const pending = syncQueue.filter((s) => !s.synced);

  async function handleSync() {
    setSyncing(true);
    setSynced(false);
    await new Promise((r) => setTimeout(r, 900));
    await syncNow();
    setSyncing(false);
    setSynced(true);
  }

  async function handleReset() {
    if (!confirm('Reset all local demo data? This clears patients, screenings and the audit blockchain.')) return;
    setResetting(true);
    await resetAllData();
    setResetting(false);
  }

  return (
    <div className="animate-fade-in max-w-3xl space-y-4">
      <SectionTitle title="Settings" subtitle="Language, connectivity, offline sync and demo data controls." />

      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Globe size={17} className="text-brand-600" />
          <h3 className="font-semibold text-slate-900 text-sm">Language</h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setLanguage('en')}
            className={`px-4 py-2 rounded-lg text-sm font-medium border ${language === 'en' ? 'bg-brand-50 text-brand-700 border-brand-200' : 'border-slate-200 text-slate-500'}`}
          >
            English
          </button>
          <button
            onClick={() => setLanguage('ta')}
            className={`px-4 py-2 rounded-lg text-sm font-medium border ${language === 'ta' ? 'bg-brand-50 text-brand-700 border-brand-200' : 'border-slate-200 text-slate-500'}`}
          >
            தமிழ் (Tamil)
          </button>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {isOnline ? <Wifi size={17} className="text-emerald-600" /> : <WifiOff size={17} className="text-slate-500" />}
            <h3 className="font-semibold text-slate-900 text-sm">Connectivity</h3>
          </div>
          <button
            onClick={() => setIsOnline(!isOnline)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${isOnline ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}
          >
            {isOnline ? 'ONLINE' : 'OFFLINE MODE'}
          </button>
        </div>

        {!isOnline ? (
          <div>
            <p className="text-xs text-slate-500 mb-2">Core functions available fully offline:</p>
            <div className="grid grid-cols-2 gap-1.5">
              {OFFLINE_CAPABILITIES.map((c) => (
                <p key={c} className="text-xs text-slate-600 flex items-center gap-1.5">
                  <CheckCircle2 size={12} className="text-emerald-500" /> {c}
                </p>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500">
            Secure Sync path: Offline Data → Encrypted Sync Queue → Server/Cloud Simulation → Doctor.
          </p>
        )}

        <div className="mt-4 flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3">
          <div>
            <p className="text-sm font-medium text-slate-800">Local Sync Queue</p>
            <p className="text-xs text-slate-500">{pending.length} record(s) pending sync</p>
          </div>
          <Button size="sm" disabled={!isOnline || syncing || pending.length === 0} onClick={handleSync}>
            <RefreshCcw size={14} className={syncing ? 'animate-spin' : ''} /> {syncing ? 'Syncing…' : 'Secure Sync'}
          </Button>
        </div>
        {!isOnline && pending.length > 0 && (
          <p className="text-[11px] text-amber-600 mt-2">Switch to ONLINE mode above to sync pending records.</p>
        )}
        {synced && <p className="text-xs text-emerald-600 mt-2">✓ SYNC COMPLETED — all pending records synced (simulated).</p>}
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-2">
          <ShieldAlert size={17} className="text-amber-600" />
          <h3 className="font-semibold text-slate-900 text-sm">Disclaimers</h3>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed mb-3">
          EMD-TS is an AI-assisted screening and clinical decision-support prototype. It does not replace a
          qualified healthcare professional. Demonstration data and simulated signals are used in this hackathon
          prototype. Clinical claims require appropriate validation and regulatory review.
        </p>
        <p className="text-xs text-slate-500 leading-relaxed">
          The blockchain component demonstrates tamper-evident auditability and data-integrity verification. It
          does not guarantee complete prevention of data theft.
        </p>
      </Card>

      <Card>
        <h3 className="font-semibold text-slate-900 text-sm mb-2">Demo Data</h3>
        <p className="text-xs text-slate-500 mb-3">
          Reset all locally stored patients, screenings, referrals and the audit blockchain, then reseed the three
          demo patients (Ravi Kumar, Meena, Arun).
        </p>
        <Button variant="danger" size="sm" disabled={resetting} onClick={handleReset}>
          <Trash2 size={14} /> {resetting ? 'Resetting…' : 'Reset Demo Data'}
        </Button>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">Storage Engine</h3>
            <p className="text-xs text-slate-500 mt-1">Browser localStorage — all data stays on this device.</p>
          </div>
          <Badge color="blue">Local-First</Badge>
        </div>
      </Card>
    </div>
  );
}
