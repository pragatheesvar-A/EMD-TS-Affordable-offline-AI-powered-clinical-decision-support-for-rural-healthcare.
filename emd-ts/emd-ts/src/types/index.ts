// ============================================================
// EMD-TS Core Type Definitions
// ============================================================

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH';

export type UserRole =
  | 'ADMIN'
  | 'HEALTHCARE_WORKER'
  | 'DOCTOR'
  | 'SPECIALIST'
  | 'AUDITOR';

export interface AppUser {
  id: string;
  name: string;
  role: UserRole;
}

export interface Patient {
  id: string; // PAT-xxxx
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  village: string;
  symptoms: string;
  duration: string;
  knownConditions: string;
  medications: string;
  allergies: string;
  createdAt: string;
  recordHash: string; // SHA-256 of canonical record
  isDemo?: boolean;
  consent: ConsentState;
}

export interface ConsentState {
  clinicalScreening: boolean;
  doctorReview: boolean;
  telemedicineSharing: boolean;
  dataStorage: boolean;
  updatedAt: string;
}

export type ConsentType =
  | 'clinicalScreening'
  | 'doctorReview'
  | 'telemedicineSharing'
  | 'dataStorage';

export interface VitalsReading {
  timestamp: string;
  heartRate: number; // BPM
  spo2: number; // %
  temperature: number; // Celsius
  activity: 'Resting' | 'Light Activity' | 'Active';
  mode: 'NORMAL' | 'HIGH_RISK';
}

export interface ScreeningFinding {
  code: string;
  label: string;
  severity: RiskLevel;
}

export interface ScreeningResult {
  id: string;
  patientId: string;
  timestamp: string;
  riskScore: number; // 0-100
  riskLevel: RiskLevel;
  findings: ScreeningFinding[];
  reasons: string[];
  vitals: VitalsReading;
  ecgAbnormal: boolean;
  moduleResults: {
    vitalSignAnalysis: string;
    ecgAnalysis: string;
    heartSoundAnalysis: string;
    lungSoundAnalysis: string;
    trendAnalysis: string;
  };
  recommendation: string;
}

export interface ReferralRecord {
  id: string;
  patientId: string;
  createdAt: string;
  priority: RiskLevel;
  careLevel: string;
  specialist: string;
  reason: string;
  note: string;
}

export type DoctorAction = 'Reviewed' | 'Refer' | 'Monitor' | 'Additional Investigation';

export interface DoctorReview {
  id: string;
  patientId: string;
  screeningId?: string;
  doctorName: string;
  notes: string;
  action: DoctorAction;
  createdAt: string;
}

export interface TimelineEvent {
  id: string;
  patientId: string;
  timestamp: string;
  type:
    | 'REGISTRATION'
    | 'VISIT'
    | 'SCREENING'
    | 'REFERRAL'
    | 'DOCTOR_REVIEW'
    | 'CONSENT';
  summary: string;
  data?: Record<string, unknown>;
}

// ---------------- Blockchain ----------------

export type BlockchainTxType =
  | 'PATIENT_CREATED'
  | 'CONSENT_GRANTED'
  | 'CONSENT_REVOKED'
  | 'SCREENING_COMPLETED'
  | 'RECORD_VIEWED'
  | 'RECORD_UPDATED'
  | 'REFERRAL_GENERATED'
  | 'DOCTOR_REVIEWED'
  | 'ACCESS_DENIED'
  | 'RECORD_SYNCED';

export interface BlockchainTransaction {
  txId: string;
  type: BlockchainTxType;
  patientId: string; // pseudonymous ID only
  userRole: UserRole | 'AI_ENGINE' | 'SYSTEM';
  action: string;
  recordHash: string;
  timestamp: string;
  recordVersion: number;
}

export interface Block {
  index: number;
  timestamp: string;
  transactions: BlockchainTransaction[];
  previousHash: string;
  currentHash: string;
  nonce: number;
}

export interface SyncQueueItem {
  id: string;
  patientId: string;
  description: string;
  createdAt: string;
  synced: boolean;
}

export type Language = 'en' | 'ta';
