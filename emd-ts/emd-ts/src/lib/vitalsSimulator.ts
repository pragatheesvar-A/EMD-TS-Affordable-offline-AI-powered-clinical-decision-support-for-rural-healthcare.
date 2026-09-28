import type { VitalsReading } from '../types';

function jitter(base: number, spread: number): number {
  return base + (Math.random() * 2 - 1) * spread;
}

export const VITALS_PRESETS = {
  NORMAL: { heartRate: 78, spo2: 98, temperature: 36.8 },
  HIGH_RISK: { heartRate: 118, spo2: 88, temperature: 38.5 },
} as const;

export function generateVitalsReading(mode: 'NORMAL' | 'HIGH_RISK'): VitalsReading {
  const preset = VITALS_PRESETS[mode];
  const heartRate = Math.round(jitter(preset.heartRate, mode === 'NORMAL' ? 3 : 4));
  const spo2 = Math.min(100, Math.round(jitter(preset.spo2, mode === 'NORMAL' ? 1 : 1.5)));
  const temperature = Number(jitter(preset.temperature, 0.15).toFixed(1));
  return {
    timestamp: new Date().toISOString(),
    heartRate,
    spo2,
    temperature,
    activity: mode === 'NORMAL' ? 'Resting' : 'Light Activity',
    mode,
  };
}
