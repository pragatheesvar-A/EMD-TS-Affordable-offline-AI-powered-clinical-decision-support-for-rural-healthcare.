import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bluetooth, HeartPulse, Wind, Thermometer, Activity as ActivityIcon, Play, Pause, RotateCcw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, SectionTitle, Button, Badge, EmptyState } from '../components/shared/ui';
import { EcgWaveform } from '../components/wearable/EcgWaveform';
import { generateVitalsReading } from '../lib/vitalsSimulator';

function VitalCard({
  icon,
  label,
  value,
  unit,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  unit: string;
  tone: 'green' | 'amber' | 'red' | 'blue';
}) {
  const tones: Record<string, string> = {
    green: 'text-risk-low bg-risk-low-bg',
    amber: 'text-risk-moderate bg-risk-moderate-bg',
    red: 'text-risk-high bg-risk-high-bg',
    blue: 'text-brand-600 bg-brand-50',
  };
  return (
    <div className="rounded-xl border border-slate-100 p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${tones[tone]}`}>{icon}</div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-2xl font-semibold text-slate-900 leading-tight">
          {value}
          <span className="text-sm font-normal text-slate-400 ml-1">{unit}</span>
        </p>
      </div>
    </div>
  );
}

export function LiveMonitoring() {
  const { patients, activePatientId, setActivePatientId, wearableConnected, setWearableConnected, liveVitals, setLiveVitals, liveEcgAbnormal, setLiveEcgAbnormal } =
    useApp();
  const navigate = useNavigate();
  const [connecting, setConnecting] = useState(false);
  const [mode, setMode] = useState<'NORMAL' | 'HIGH_RISK'>('NORMAL');
  const [ecgRunning, setEcgRunning] = useState(true);
  const [ecgResetTick, setEcgResetTick] = useState(0);

  const patient = patients.find((p) => p.id === activePatientId);

  useEffect(() => {
    setLiveEcgAbnormal(mode === 'HIGH_RISK');
  }, [mode, setLiveEcgAbnormal]);

  useEffect(() => {
    if (!wearableConnected) return;
    setLiveVitals(generateVitalsReading(mode));
    const interval = setInterval(() => {
      setLiveVitals(generateVitalsReading(mode));
    }, 2500);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wearableConnected, mode]);

  function handleConnect() {
    setConnecting(true);
    setTimeout(() => {
      setWearableConnected(true);
      setConnecting(false);
      setLiveVitals(generateVitalsReading(mode));
    }, 1200);
  }

  if (!patient) {
    return (
      <div className="animate-fade-in">
        <SectionTitle title="Live Monitoring" subtitle="Connect the simulated wearable and view live vitals." />
        <Card>
          <EmptyState title="No patient selected" subtitle="Select or register a patient before starting live monitoring." />
          <div className="flex justify-center gap-3 mt-2">
            <Button onClick={() => navigate('/registration')}>Register a Patient</Button>
            {patients.length > 0 && (
              <Button
                variant="secondary"
                onClick={() => setActivePatientId(patients[patients.length - 1].id)}
              >
                Use Last Patient
              </Button>
            )}
          </div>
        </Card>
      </div>
    );
  }

  const hr = liveVitals?.heartRate ?? 0;
  const spo2 = liveVitals?.spo2 ?? 0;
  const temp = liveVitals?.temperature ?? 0;

  return (
    <div className="animate-fade-in">
      <SectionTitle
        title="EMD-TS Wearable Patch"
        subtitle={`Simulated diagnostic patch for ${patient.name} (${patient.id})`}
        action={
          <Button variant="secondary" onClick={() => navigate('/screening')}>
            Proceed to AI Screening →
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bluetooth size={18} className="text-brand-600" />
              <h3 className="font-semibold text-slate-900 text-sm">Wearable Connection</h3>
            </div>
            {wearableConnected ? <Badge color="green">CONNECTED</Badge> : <Badge color="slate">DISCONNECTED</Badge>}
          </div>

          {!wearableConnected ? (
            <div className="text-center py-6">
              <p className="text-xs text-slate-500 mb-4">
                No hardware wearable is present in this prototype. Click below to start the simulated Bluetooth
                Low Energy connection.
              </p>
              <Button onClick={handleConnect} disabled={connecting}>
                {connecting ? 'Connecting…' : 'Connect Wearable'}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-brand-700 bg-brand-50 rounded-lg px-3 py-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-600 pulse-dot" />
                BLE SIMULATION ACTIVE — no real Bluetooth hardware connected
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1.5">Simulation mode</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setMode('NORMAL')}
                    className={`text-xs font-semibold py-2 rounded-lg border ${
                      mode === 'NORMAL'
                        ? 'bg-risk-low-bg text-risk-low border-risk-low/30'
                        : 'bg-white text-slate-500 border-slate-200'
                    }`}
                  >
                    NORMAL
                  </button>
                  <button
                    onClick={() => setMode('HIGH_RISK')}
                    className={`text-xs font-semibold py-2 rounded-lg border ${
                      mode === 'HIGH_RISK'
                        ? 'bg-risk-high-bg text-risk-high border-risk-high/30'
                        : 'bg-white text-slate-500 border-slate-200'
                    }`}
                  >
                    HIGH-RISK DEMO
                  </button>
                </div>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setWearableConnected(false)} className="w-full">
                Disconnect
              </Button>
            </div>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <h3 className="font-semibold text-slate-900 text-sm mb-4">Live Vitals</h3>
          {!wearableConnected ? (
            <EmptyState title="Wearable not connected" subtitle="Connect the simulated wearable to see live vitals." />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <VitalCard
                icon={<HeartPulse size={18} />}
                label="Heart Rate"
                value={hr}
                unit="BPM"
                tone={hr > 120 ? 'red' : hr > 100 ? 'amber' : 'green'}
              />
              <VitalCard
                icon={<Wind size={18} />}
                label="SpO₂"
                value={spo2}
                unit="%"
                tone={spo2 < 90 ? 'red' : spo2 < 95 ? 'amber' : 'green'}
              />
              <VitalCard
                icon={<Thermometer size={18} />}
                label="Temperature"
                value={temp}
                unit="°C"
                tone={temp >= 38.5 ? 'red' : temp >= 37.5 ? 'amber' : 'green'}
              />
              <VitalCard
                icon={<ActivityIcon size={18} />}
                label="Activity"
                value={liveVitals?.activity ?? '—'}
                unit=""
                tone="blue"
              />
            </div>
          )}
        </Card>
      </div>

      <Card className="mt-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">ECG — Lead I</h3>
            <p className="text-xs text-slate-400">Prototype signal — demonstration only, not clinically diagnostic.</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge color={liveEcgAbnormal ? 'red' : 'green'}>{liveEcgAbnormal ? 'ABNORMAL ECG' : 'NORMAL ECG'}</Badge>
            <Button size="sm" variant="secondary" onClick={() => setEcgRunning((v) => !v)}>
              {ecgRunning ? <Pause size={14} /> : <Play size={14} />} {ecgRunning ? 'Pause' : 'Start'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEcgResetTick((v) => v + 1)}>
              <RotateCcw size={14} /> Reset
            </Button>
          </div>
        </div>
        <EcgWaveform
          running={ecgRunning && wearableConnected}
          bpm={wearableConnected ? Math.max(45, hr || 78) : 78}
          abnormal={liveEcgAbnormal}
          resetSignal={ecgResetTick}
          lineColor={liveEcgAbnormal ? '#dc2626' : '#16a34a'}
        />
        <div className="grid grid-cols-3 gap-3 mt-3 text-center">
          <div className="rounded-lg bg-slate-50 py-2">
            <p className="text-[11px] text-slate-400">Heart Rate</p>
            <p className="text-sm font-semibold text-slate-800">{wearableConnected ? `${hr} BPM` : '—'}</p>
          </div>
          <div className="rounded-lg bg-slate-50 py-2">
            <p className="text-[11px] text-slate-400">Signal Quality</p>
            <p className="text-sm font-semibold text-slate-800">{wearableConnected && ecgRunning ? 'Good' : 'No Signal'}</p>
          </div>
          <div className="rounded-lg bg-slate-50 py-2">
            <p className="text-[11px] text-slate-400">Lead</p>
            <p className="text-sm font-semibold text-slate-800">Lead I</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
