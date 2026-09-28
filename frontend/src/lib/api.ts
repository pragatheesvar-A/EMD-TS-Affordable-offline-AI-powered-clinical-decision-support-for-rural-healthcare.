// HTTP client for the EMD-TS FastAPI backend (D:\EMD-TS-Mobile-Delivery\emd-ts-backend).
// In dev, requests go to `/api/*` and Vite proxies them to the backend
// (see vite.config.ts), so there are no CORS or host issues. Set
// VITE_API_URL to point at a backend directly (e.g. http://192.168.1.20:8080).

import type {
  DoctorAction,
  DoctorReview,
  Patient,
  ReferralRecord,
  ScreeningResult,
  TimelineEvent,
  VitalsReading,
} from '../types';

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${init?.method ?? 'GET'} ${path} failed (${res.status}): ${text}`);
  }
  return (await res.json()) as T;
}

const post = <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) });

export const api = {
  baseUrl: BASE_URL,

  async isReachable(): Promise<boolean> {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 2500);
      const res = await fetch(`${BASE_URL}/health`, { signal: ctrl.signal });
      clearTimeout(timer);
      return res.ok;
    } catch {
      return false;
    }
  },

  listPatients: () => request<Patient[]>('/patients'),
  createPatient: (data: Omit<Patient, 'id' | 'createdAt' | 'recordHash' | 'consent'>, userRole: string) =>
    post<Patient>('/patients', { ...data, userRole }),
  updateConsent: (patientId: string, type: string, value: boolean, userRole: string) =>
    request<Patient>(`/patients/${patientId}/consent`, {
      method: 'PATCH',
      body: JSON.stringify({ type, value, userRole }),
    }),
  viewRecord: (patientId: string, userRole: string) => post<unknown>(`/patients/${patientId}/view`, { userRole }),

  listScreenings: (patientId: string) => request<ScreeningResult[]>(`/patients/${patientId}/screenings`),
  runScreening: (patientId: string, vitals: VitalsReading, ecgAbnormal: boolean, userRole: string) =>
    post<ScreeningResult>(`/patients/${patientId}/screenings`, {
      vitals: {
        heartRate: vitals.heartRate,
        spo2: vitals.spo2,
        temperature: vitals.temperature,
        activity: vitals.activity,
        mode: vitals.mode,
      },
      ecgAbnormal,
      userRole,
    }),

  listReferrals: (patientId: string) => request<ReferralRecord[]>(`/patients/${patientId}/referrals`),
  createReferral: (patientId: string, screeningId: string, note: string, userRole: string) =>
    post<ReferralRecord>(`/patients/${patientId}/referrals`, { screeningId, note, userRole }),

  listReviews: (patientId: string) => request<DoctorReview[]>(`/patients/${patientId}/reviews`),
  createReview: (
    patientId: string,
    notes: string,
    action: DoctorAction,
    doctorName: string,
    userRole: string,
    screeningId?: string
  ) => post<DoctorReview>(`/patients/${patientId}/reviews`, { notes, action, doctorName, userRole, screeningId }),

  listTimeline: (patientId: string) => request<TimelineEvent[]>(`/patients/${patientId}/timeline`),

  unauthorizedAccess: (patientId: string) => post<unknown>(`/security/unauthorized-access/${patientId}`, {}),
  syncRun: () => post<unknown>('/sync/run', {}),
  reset: () => post<unknown>('/admin/reset', {}),

  /** Pull every patient and their related records in one go. */
  async loadAll() {
    const patients = await this.listPatients();
    const perPatient = await Promise.all(
      patients.map(async (p) => {
        const [screenings, referrals, reviews, timeline] = await Promise.all([
          this.listScreenings(p.id),
          this.listReferrals(p.id),
          this.listReviews(p.id),
          this.listTimeline(p.id),
        ]);
        return { screenings, referrals, reviews, timeline };
      })
    );
    return {
      patients,
      screenings: perPatient.flatMap((x) => x.screenings),
      referrals: perPatient.flatMap((x) => x.referrals),
      reviews: perPatient.flatMap((x) => x.reviews),
      timeline: perPatient.flatMap((x) => x.timeline),
    };
  },
};
