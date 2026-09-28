import type { Patient, VitalsReading } from '../types';

export interface DemoPatientSeed {
  id: string;
  name: string;
  age: number;
  gender: Patient['gender'];
  phone: string;
  village: string;
  symptoms: string;
  duration: string;
  knownConditions: string;
  medications: string;
  allergies: string;
  vitals: VitalsReading;
  ecgAbnormal: boolean;
  spo2Trend: number[];
}

const now = () => new Date().toISOString();

export const DEMO_PATIENTS: DemoPatientSeed[] = [
  {
    id: 'PAT-1001',
    name: 'Ravi Kumar',
    age: 56,
    gender: 'Male',
    phone: '+91 98765 43210',
    village: 'Perambalur',
    symptoms: 'Chest discomfort and breathing difficulty for two days',
    duration: '2 Days',
    knownConditions: 'Hypertension',
    medications: 'Amlodipine 5mg',
    allergies: 'None known',
    vitals: {
      timestamp: now(),
      heartRate: 118,
      spo2: 88,
      temperature: 38.5,
      activity: 'Light Activity',
      mode: 'HIGH_RISK',
    },
    ecgAbnormal: true,
    spo2Trend: [98, 96, 94, 91, 88],
  },
  {
    id: 'PAT-1002',
    name: 'Meena',
    age: 43,
    gender: 'Female',
    phone: '+91 98765 11223',
    village: 'Thuraiyur',
    symptoms: 'Fever and mild cough for one day',
    duration: '1 Day',
    knownConditions: 'None',
    medications: 'None',
    allergies: 'Penicillin',
    vitals: {
      timestamp: now(),
      heartRate: 108,
      spo2: 93,
      temperature: 38.1,
      activity: 'Resting',
      mode: 'NORMAL',
    },
    ecgAbnormal: false,
    spo2Trend: [97, 96, 95, 94],
  },
  {
    id: 'PAT-1003',
    name: 'Arun',
    age: 61,
    gender: 'Male',
    phone: '+91 98765 99887',
    village: 'Kunnam',
    symptoms: 'Routine screening, no acute complaints',
    duration: 'N/A',
    knownConditions: 'Type 2 Diabetes (controlled)',
    medications: 'Metformin 500mg',
    allergies: 'None known',
    vitals: {
      timestamp: now(),
      heartRate: 76,
      spo2: 98,
      temperature: 36.7,
      activity: 'Resting',
      mode: 'NORMAL',
    },
    ecgAbnormal: false,
    spo2Trend: [98, 98, 97, 98],
  },
];
