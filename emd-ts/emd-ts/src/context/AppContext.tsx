import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../lib/api';
import { loadJSON, saveJSON, STORAGE_KEYS, clearAll } from '../lib/storage';
import { blockchain } from '../lib/blockchain';
import { generateId } from '../lib/crypto';
import { computePatientRecordHash } from '../lib/patientHash';
import { runScreening, referralForRisk } from '../lib/aiEngine';
import { DEMO_PATIENTS } from '../lib/demoData';
import type {
  AppUser,
  ConsentType,
  DoctorAction,
  DoctorReview,
  Language,
  Patient,
  ReferralRecord,
  ScreeningResult,
  SyncQueueItem,
  TimelineEvent,
  UserRole,
  VitalsReading,
} from '../types';

const DEFAULT_USERS: Record<UserRole, AppUser> = {
  ADMIN: { id: 'u-admin', name: 'S. Vignesh', role: 'ADMIN' },
  HEALTHCARE_WORKER: { id: 'u-hw', name: 'Priya R. (ANM)', role: 'HEALTHCARE_WORKER' },
  DOCTOR: { id: 'u-doc', name: 'Dr. Kavitha Subramaniam', role: 'DOCTOR' },
  SPECIALIST: { id: 'u-spec', name: 'Dr. Arjun Rao (Cardiology)', role: 'SPECIALIST' },
  AUDITOR: { id: 'u-aud', name: 'M. Elango (Auditor)', role: 'AUDITOR' },
};

interface AccessAuditEntry {
  id: string;
  timestamp: string;
  user: string;
  patientId: string;
  action: string;
  result: 'GRANTED' | 'DENIED';
  reason: string;
}

interface AppState {
  patients: Patient[];
  screenings: ScreeningResult[];
  referrals: ReferralRecord[];
  reviews: DoctorReview[];
  timeline: TimelineEvent[];
  syncQueue: SyncQueueItem[];
  accessAudit: AccessAuditEntry[];
  language: Language;
  isOnline: boolean;
  currentUser: AppUser;
  chainVersion: number;
  ready: boolean;
  backendConnected: boolean;
  activePatientId: string | null;
  wearableConnected: boolean;
  liveVitals: VitalsReading | null;
  liveEcgAbnormal: boolean;
}

interface AppContextValue extends AppState {
  setLanguage: (lang: Language) => void;
  setCurrentUser: (role: UserRole) => void;
  setIsOnline: (v: boolean) => void;
  setActivePatientId: (id: string | null) => void;
  setWearableConnected: (v: boolean) => void;
  setLiveVitals: (v: VitalsReading | null) => void;
  setLiveEcgAbnormal: (v: boolean) => void;
  addPatient: (data: Omit<Patient, 'id' | 'createdAt' | 'recordHash' | 'consent'>) => Promise<Patient>;
  updateConsent: (patientId: string, type: ConsentType, value: boolean) => Promise<void>;
  addScreening: (result: ScreeningResult) => Promise<void>;
  addReferral: (patientId: string, screening: ScreeningResult, note: string) => Promise<ReferralRecord>;
  addDoctorReview: (patientId: string, notes: string, action: DoctorAction, screeningId?: string) => Promise<void>;
  viewRecord: (patientId: string, roleOverride?: UserRole) => Promise<void>;
  simulateUnauthorizedAccess: (patientId: string) => Promise<void>;
  tamperPatientRecord: (patientId: string) => Promise<void>;
  restorePatientRecord: (patientId: string) => Promise<void>;
  getTamperState: (patientId: string) => { tampered: boolean; original?: Patient };
  syncNow: () => Promise<void>;
  getPatient: (id: string) => Patient | undefined;
  getScreeningsForPatient: (id: string) => ScreeningResult[];
  getReferralsForPatient: (id: string) => ReferralRecord[];
  getReviewsForPatient: (id: string) => DoctorReview[];
  getTimelineForPatient: (id: string) => TimelineEvent[];
  seedIfNeeded: () => Promise<void>;
  resetAllData: () => Promise<void>;
  bumpChain: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function addTimelineEvent(list: TimelineEvent[], ev: Omit<TimelineEvent, 'id'>): TimelineEvent[] {
  const full: TimelineEvent = { id: generateId('EVT'), ...ev };
  return [...list, full];
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [screenings, setScreenings] = useState<ScreeningResult[]>([]);
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [reviews, setReviews] = useState<DoctorReview[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([]);
  const [accessAudit, setAccessAudit] = useState<AccessAuditEntry[]>([]);
  const [language, setLanguageState] = useState<Language>('en');
  const [isOnline, setIsOnlineState] = useState<boolean>(false);
  const [currentUser, setCurrentUserState] = useState<AppUser>(DEFAULT_USERS.HEALTHCARE_WORKER);
  const [chainVersion, setChainVersion] = useState(0);
  const [ready, setReady] = useState(false);
  const [backendConnected, setBackendConnected] = useState(false);
  // Screenings are recomputed server-side and get a server id; map the
  // client-side id to it so later referrals/reviews point at the right record.
  const screeningIdMap = useRef<Record<string, string>>({});
  const [activePatientId, setActivePatientIdState] = useState<string | null>(null);
  const [wearableConnected, setWearableConnected] = useState(false);
  const [liveVitals, setLiveVitals] = useState<VitalsReading | null>(null);
  const [liveEcgAbnormal, setLiveEcgAbnormal] = useState(false);

  const bumpChain = useCallback(() => setChainVersion((v) => v + 1), []);

  // Replace one patient's timeline with the server copy (the server writes its own events).
  const refreshTimeline = useCallback(async (patientId: string) => {
    try {
      const events = await api.listTimeline(patientId);
      setTimeline((prev) => [...prev.filter((t) => t.patientId !== patientId), ...events]);
    } catch (e) {
      console.warn('[api] timeline refresh failed', e);
    }
  }, []);

  // ---------- initial load ----------
  useEffect(() => {
    (async () => {
      await blockchain.init();
      setPatients(loadJSON(STORAGE_KEYS.patients, []));
      setScreenings(loadJSON(STORAGE_KEYS.screenings, []));
      setReferrals(loadJSON(STORAGE_KEYS.referrals, []));
      setReviews(loadJSON(STORAGE_KEYS.reviews, []));
      setTimeline(loadJSON(STORAGE_KEYS.timeline, []));
      setSyncQueue(loadJSON(STORAGE_KEYS.syncQueue, []));
      setAccessAudit(loadJSON(STORAGE_KEYS.auditAccess, []));
      const settings = loadJSON(STORAGE_KEYS.settings, { language: 'en' as Language, isOnline: false });
      setLanguageState(settings.language ?? 'en');
      setIsOnlineState(settings.isOnline ?? false);
      setActivePatientIdState(loadJSON<string | null>('activePatientId', null));
      if (await api.isReachable()) {
        try {
          const data = await api.loadAll();
          setPatients(data.patients);
          setScreenings(data.screenings);
          setReferrals(data.referrals);
          setReviews(data.reviews);
          setTimeline(data.timeline);
          setBackendConnected(true);
          setIsOnlineState(true);
          console.info(`[api] connected to backend at ${api.baseUrl}`);
        } catch (e) {
          console.warn('[api] backend reachable but load failed, staying offline', e);
        }
      } else {
        console.warn(`[api] backend not reachable at ${api.baseUrl}, running offline on localStorage`);
      }
      setReady(true);
      bumpChain();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- persistence ----------
  useEffect(() => {
    if (ready) saveJSON(STORAGE_KEYS.patients, patients);
  }, [patients, ready]);
  useEffect(() => {
    if (ready) saveJSON(STORAGE_KEYS.screenings, screenings);
  }, [screenings, ready]);
  useEffect(() => {
    if (ready) saveJSON(STORAGE_KEYS.referrals, referrals);
  }, [referrals, ready]);
  useEffect(() => {
    if (ready) saveJSON(STORAGE_KEYS.reviews, reviews);
  }, [reviews, ready]);
  useEffect(() => {
    if (ready) saveJSON(STORAGE_KEYS.timeline, timeline);
  }, [timeline, ready]);
  useEffect(() => {
    if (ready) saveJSON(STORAGE_KEYS.syncQueue, syncQueue);
  }, [syncQueue, ready]);
  useEffect(() => {
    if (ready) saveJSON(STORAGE_KEYS.auditAccess, accessAudit);
  }, [accessAudit, ready]);
  useEffect(() => {
    if (ready) saveJSON(STORAGE_KEYS.settings, { language, isOnline });
  }, [language, isOnline, ready]);

  const setLanguage = useCallback((lang: Language) => setLanguageState(lang), []);
  const setCurrentUser = useCallback((role: UserRole) => setCurrentUserState(DEFAULT_USERS[role]), []);
  const setIsOnline = useCallback((v: boolean) => setIsOnlineState(v), []);
  const setActivePatientId = useCallback((id: string | null) => {
    setActivePatientIdState(id);
    saveJSON('activePatientId', id);
  }, []);

  const getPatient = useCallback((id: string) => patients.find((p) => p.id === id), [patients]);
  const getScreeningsForPatient = useCallback(
    (id: string) => screenings.filter((s) => s.patientId === id).sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1)),
    [screenings]
  );
  const getReferralsForPatient = useCallback(
    (id: string) => referrals.filter((r) => r.patientId === id),
    [referrals]
  );
  const getReviewsForPatient = useCallback((id: string) => reviews.filter((r) => r.patientId === id), [reviews]);
  const getTimelineForPatient = useCallback(
    (id: string) =>
      timeline.filter((t) => t.patientId === id).sort((a, b) => (a.timestamp < b.timestamp ? -1 : 1)),
    [timeline]
  );

  const addPatient = useCallback(
    async (data: Omit<Patient, 'id' | 'createdAt' | 'recordHash' | 'consent'>) => {
      if (backendConnected) {
        const saved = await api.createPatient(data, currentUser.role);
        setPatients((prev) => [...prev, saved]);
        await refreshTimeline(saved.id);
        await blockchain.addTransaction({
          type: 'PATIENT_CREATED',
          patientId: saved.id,
          userRole: currentUser.role,
          action: 'Created patient record',
          recordHash: saved.recordHash,
        });
        bumpChain();
        return saved;
      }
      const id = generateId('PAT');
      const createdAt = new Date().toISOString();
      const draft: Patient = {
        ...data,
        id,
        createdAt,
        recordHash: '',
        consent: {
          clinicalScreening: true,
          doctorReview: false,
          telemedicineSharing: false,
          dataStorage: true,
          updatedAt: createdAt,
        },
      };
      const recordHash = await computePatientRecordHash(draft);
      const finalPatient: Patient = { ...draft, recordHash };

      setPatients((prev) => [...prev, finalPatient]);
      setTimeline((prev) =>
        addTimelineEvent(prev, {
          patientId: id,
          timestamp: createdAt,
          type: 'REGISTRATION',
          summary: `Patient ${finalPatient.name} registered at PHC`,
        })
      );
      await blockchain.addTransaction({
        type: 'PATIENT_CREATED',
        patientId: id,
        userRole: currentUser.role,
        action: 'Created patient record',
        recordHash,
      });
      setSyncQueue((prev) => [
        ...prev,
        { id: generateId('SYNC'), patientId: id, description: 'New patient record', createdAt, synced: isOnline },
      ]);
      bumpChain();
      return finalPatient;
    },
    [currentUser.role, isOnline, bumpChain, backendConnected, refreshTimeline]
  );

  const updateConsent = useCallback(
    async (patientId: string, type: ConsentType, value: boolean) => {
      const patient = patients.find((p) => p.id === patientId);
      if (!patient) return;
      const updatedAt = new Date().toISOString();
      setPatients((prev) =>
        prev.map((p) =>
          p.id === patientId ? { ...p, consent: { ...p.consent, [type]: value, updatedAt } } : p
        )
      );
      if (backendConnected) {
        await api.updateConsent(patientId, type, value, currentUser.role);
        await refreshTimeline(patientId);
      } else setTimeline((prev) =>
        addTimelineEvent(prev, {
          patientId,
          timestamp: updatedAt,
          type: 'CONSENT',
          summary: `Consent ${value ? 'granted' : 'revoked'} for ${type}`,
        })
      );
      await blockchain.addTransaction({
        type: value ? 'CONSENT_GRANTED' : 'CONSENT_REVOKED',
        patientId,
        userRole: 'HEALTHCARE_WORKER',
        action: `${value ? 'Granted' : 'Revoked'} consent: ${type}`,
        recordHash: patient.recordHash,
      });
      bumpChain();
    },
    [patients, bumpChain, backendConnected, currentUser.role, refreshTimeline]
  );

  const addScreening = useCallback(
    async (result: ScreeningResult) => {
      const patient = patients.find((p) => p.id === result.patientId);
      if (backendConnected) {
        const saved = await api.runScreening(result.patientId, result.vitals, result.ecgAbnormal, currentUser.role);
        screeningIdMap.current[result.id] = saved.id;
        setScreenings((prev) => [...prev, saved]);
        await refreshTimeline(result.patientId);
      } else {
      setScreenings((prev) => [...prev, result]);
      setTimeline((prev) =>
        addTimelineEvent(prev, {
          patientId: result.patientId,
          timestamp: result.timestamp,
          type: 'SCREENING',
          summary: `AI screening completed — ${result.riskLevel} priority (score ${result.riskScore})`,
          data: { riskLevel: result.riskLevel, riskScore: result.riskScore },
        })
      );
      }
      await blockchain.addTransaction({
        type: 'SCREENING_COMPLETED',
        patientId: result.patientId,
        userRole: 'AI_ENGINE',
        action: `Screening completed — risk ${result.riskLevel}`,
        recordHash: patient?.recordHash ?? '',
      });
      bumpChain();
    },
    [patients, bumpChain, backendConnected, currentUser.role, refreshTimeline]
  );

  const addReferral = useCallback(
    async (patientId: string, screening: ScreeningResult, note: string) => {
      const patient = patients.find((p) => p.id === patientId);
      const details = referralForRisk(screening.riskLevel);
      if (backendConnected) {
        const screeningId = screeningIdMap.current[screening.id] ?? screening.id;
        const saved = await api.createReferral(patientId, screeningId, note, currentUser.role);
        setReferrals((prev) => [...prev, saved]);
        await refreshTimeline(patientId);
        await blockchain.addTransaction({
          type: 'REFERRAL_GENERATED',
          patientId,
          userRole: currentUser.role,
          action: `Referral generated — ${details.careLevel}`,
          recordHash: patient?.recordHash ?? '',
        });
        bumpChain();
        return saved;
      }
      const referral: ReferralRecord = {
        id: generateId('REF'),
        patientId,
        createdAt: new Date().toISOString(),
        priority: screening.riskLevel,
        careLevel: details.careLevel,
        specialist: details.specialist,
        reason: details.reason,
        note,
      };
      setReferrals((prev) => [...prev, referral]);
      setTimeline((prev) =>
        addTimelineEvent(prev, {
          patientId,
          timestamp: referral.createdAt,
          type: 'REFERRAL',
          summary: `Referral generated — ${details.careLevel} (${details.specialist})`,
        })
      );
      await blockchain.addTransaction({
        type: 'REFERRAL_GENERATED',
        patientId,
        userRole: currentUser.role,
        action: `Referral generated — ${details.careLevel}`,
        recordHash: patient?.recordHash ?? '',
      });
      bumpChain();
      return referral;
    },
    [patients, currentUser.role, bumpChain, backendConnected, refreshTimeline]
  );

  const addDoctorReview = useCallback(
    async (patientId: string, notes: string, action: DoctorAction, screeningId?: string) => {
      const patient = patients.find((p) => p.id === patientId);
      if (backendConnected) {
        const sid = screeningId ? screeningIdMap.current[screeningId] ?? screeningId : undefined;
        const saved = await api.createReview(patientId, notes, action, currentUser.name, currentUser.role, sid);
        setReviews((prev) => [...prev, saved]);
        await refreshTimeline(patientId);
        await blockchain.addTransaction({
          type: 'DOCTOR_REVIEWED',
          patientId,
          userRole: currentUser.role,
          action: `Doctor action: ${action}`,
          recordHash: patient?.recordHash ?? '',
        });
        bumpChain();
        return;
      }
      const review: DoctorReview = {
        id: generateId('REV'),
        patientId,
        screeningId,
        doctorName: currentUser.name,
        notes,
        action,
        createdAt: new Date().toISOString(),
      };
      setReviews((prev) => [...prev, review]);
      setTimeline((prev) =>
        addTimelineEvent(prev, {
          patientId,
          timestamp: review.createdAt,
          type: 'DOCTOR_REVIEW',
          summary: `Doctor review: ${action} — ${notes.slice(0, 80)}`,
        })
      );
      await blockchain.addTransaction({
        type: 'DOCTOR_REVIEWED',
        patientId,
        userRole: currentUser.role,
        action: `Doctor action: ${action}`,
        recordHash: patient?.recordHash ?? '',
      });
      bumpChain();
    },
    [patients, currentUser, bumpChain, backendConnected, refreshTimeline]
  );

  const viewRecord = useCallback(
    async (patientId: string, roleOverride?: UserRole) => {
      const patient = patients.find((p) => p.id === patientId);
      if (backendConnected) api.viewRecord(patientId, roleOverride ?? currentUser.role).catch((e) => console.warn('[api]', e));
      await blockchain.addTransaction({
        type: 'RECORD_VIEWED',
        patientId,
        userRole: roleOverride ?? currentUser.role,
        action: 'Viewed patient record',
        recordHash: patient?.recordHash ?? '',
      });
      setAccessAudit((prev) => [
        {
          id: generateId('ACC'),
          timestamp: new Date().toISOString(),
          user: currentUser.name,
          patientId,
          action: 'VIEW_RECORD',
          result: 'GRANTED',
          reason: 'Authorized role',
        },
        ...prev,
      ]);
      bumpChain();
    },
    [patients, currentUser, bumpChain, backendConnected]
  );

  const simulateUnauthorizedAccess = useCallback(
    async (patientId: string) => {
      const patient = patients.find((p) => p.id === patientId);
      if (backendConnected) api.unauthorizedAccess(patientId).catch((e) => console.warn('[api]', e));
      await blockchain.addTransaction({
        type: 'ACCESS_DENIED',
        patientId,
        userRole: 'AUDITOR',
        action: 'Unauthorized VIEW_RECORD attempt blocked',
        recordHash: patient?.recordHash ?? '',
      });
      setAccessAudit((prev) => [
        {
          id: generateId('ACC'),
          timestamp: new Date().toISOString(),
          user: 'Unknown_User',
          patientId,
          action: 'VIEW_RECORD',
          result: 'DENIED',
          reason: 'Insufficient permissions',
        },
        ...prev,
      ]);
      bumpChain();
    },
    [patients, bumpChain, backendConnected]
  );

  // ---------- Tamper detection ----------
  const tamperPatientRecord = useCallback(
    async (patientId: string) => {
      const patient = patients.find((p) => p.id === patientId);
      if (!patient) return;
      const backups = loadJSON<Record<string, Patient>>(STORAGE_KEYS.tamperedRecord, {});
      if (!backups[patientId]) {
        backups[patientId] = patient; // snapshot pristine version
        saveJSON(STORAGE_KEYS.tamperedRecord, backups);
      }
      const tampered: Patient = {
        ...patient,
        symptoms: `${patient.symptoms} [UNAUTHORIZED EDIT]`,
      };
      setPatients((prev) => prev.map((p) => (p.id === patientId ? tampered : p)));
      bumpChain();
    },
    [patients, bumpChain]
  );

  const restorePatientRecord = useCallback(
    async (patientId: string) => {
      const backups = loadJSON<Record<string, Patient>>(STORAGE_KEYS.tamperedRecord, {});
      const original = backups[patientId];
      if (!original) return;
      setPatients((prev) => prev.map((p) => (p.id === patientId ? original : p)));
      delete backups[patientId];
      saveJSON(STORAGE_KEYS.tamperedRecord, backups);
      bumpChain();
    },
    [bumpChain]
  );

  const getTamperState = useCallback((patientId: string) => {
    const backups = loadJSON<Record<string, Patient>>(STORAGE_KEYS.tamperedRecord, {});
    return { tampered: Boolean(backups[patientId]), original: backups[patientId] };
  }, []);

  const syncNow = useCallback(async () => {
    if (backendConnected) await api.syncRun().catch((e) => console.warn('[api]', e));
    const pending = syncQueue.filter((s) => !s.synced);
    for (const item of pending) {
      const patient = patients.find((p) => p.id === item.patientId);
      await blockchain.addTransaction({
        type: 'RECORD_SYNCED',
        patientId: item.patientId,
        userRole: 'SYSTEM',
        action: 'Record synced to cloud (simulated)',
        recordHash: patient?.recordHash ?? '',
      });
    }
    setSyncQueue((prev) => prev.map((s) => ({ ...s, synced: true })));
    bumpChain();
  }, [syncQueue, patients, bumpChain, backendConnected]);

  const seedIfNeeded = useCallback(async () => {
    if (backendConnected) return; // the backend seeds its own demo patients
    const seeded = loadJSON<boolean>(STORAGE_KEYS.seeded, false);
    if (seeded) return;
    for (const seed of DEMO_PATIENTS) {
      const draft: Patient = {
        id: seed.id,
        name: seed.name,
        age: seed.age,
        gender: seed.gender,
        phone: seed.phone,
        village: seed.village,
        symptoms: seed.symptoms,
        duration: seed.duration,
        knownConditions: seed.knownConditions,
        medications: seed.medications,
        allergies: seed.allergies,
        createdAt: new Date().toISOString(),
        recordHash: '',
        isDemo: true,
        consent: {
          clinicalScreening: true,
          doctorReview: true,
          telemedicineSharing: seed.id !== 'PAT-1003',
          dataStorage: true,
          updatedAt: new Date().toISOString(),
        },
      };
      const recordHash = await computePatientRecordHash(draft);
      const patient = { ...draft, recordHash };
      setPatients((prev) => [...prev, patient]);
      setTimeline((prev) =>
        addTimelineEvent(prev, {
          patientId: patient.id,
          timestamp: patient.createdAt,
          type: 'REGISTRATION',
          summary: `Patient ${patient.name} registered (demo data)`,
        })
      );
      await blockchain.addTransaction({
        type: 'PATIENT_CREATED',
        patientId: patient.id,
        userRole: 'HEALTHCARE_WORKER',
        action: 'Created patient record (demo)',
        recordHash,
      });

      const result = runScreening({
        patientId: patient.id,
        vitals: seed.vitals,
        ecgAbnormal: seed.ecgAbnormal,
        symptoms: seed.symptoms,
        previousSpo2Trend: seed.spo2Trend,
      });
      setScreenings((prev) => [...prev, result]);
      setTimeline((prev) =>
        addTimelineEvent(prev, {
          patientId: patient.id,
          timestamp: result.timestamp,
          type: 'SCREENING',
          summary: `AI screening completed — ${result.riskLevel} priority (score ${result.riskScore})`,
        })
      );
      await blockchain.addTransaction({
        type: 'SCREENING_COMPLETED',
        patientId: patient.id,
        userRole: 'AI_ENGINE',
        action: `Screening completed — risk ${result.riskLevel}`,
        recordHash,
      });

      if (result.riskLevel !== 'LOW') {
        const details = referralForRisk(result.riskLevel);
        const referral: ReferralRecord = {
          id: generateId('REF'),
          patientId: patient.id,
          createdAt: new Date().toISOString(),
          priority: result.riskLevel,
          careLevel: details.careLevel,
          specialist: details.specialist,
          reason: details.reason,
          note: `Auto-generated referral note for ${patient.name} based on AI-assisted screening.`,
        };
        setReferrals((prev) => [...prev, referral]);
        await blockchain.addTransaction({
          type: 'REFERRAL_GENERATED',
          patientId: patient.id,
          userRole: 'HEALTHCARE_WORKER',
          action: `Referral generated — ${details.careLevel}`,
          recordHash,
        });
      }
      setSyncQueue((prev) => [
        ...prev,
        {
          id: generateId('SYNC'),
          patientId: patient.id,
          description: 'New patient record (demo)',
          createdAt: patient.createdAt,
          synced: false,
        },
      ]);
    }
    saveJSON(STORAGE_KEYS.seeded, true);
    bumpChain();
  }, [bumpChain, backendConnected]);

  const resetAllData = useCallback(async () => {
    if (backendConnected) {
      await api.reset();
      clearAll();
      await blockchain.reset();
      const data = await api.loadAll();
      setPatients(data.patients);
      setScreenings(data.screenings);
      setReferrals(data.referrals);
      setReviews(data.reviews);
      setTimeline(data.timeline);
      setSyncQueue([]);
      setAccessAudit([]);
      bumpChain();
      return;
    }
    clearAll();
    await blockchain.reset();
    setPatients([]);
    setScreenings([]);
    setReferrals([]);
    setReviews([]);
    setTimeline([]);
    setSyncQueue([]);
    setAccessAudit([]);
    saveJSON(STORAGE_KEYS.seeded, false);
    bumpChain();
    await seedIfNeeded();
  }, [bumpChain, seedIfNeeded, backendConnected]);

  useEffect(() => {
    if (ready) {
      seedIfNeeded();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const value: AppContextValue = useMemo(
    () => ({
      patients,
      screenings,
      referrals,
      reviews,
      timeline,
      syncQueue,
      accessAudit,
      language,
      isOnline,
      currentUser,
      chainVersion,
      ready,
      backendConnected,
      activePatientId,
      wearableConnected,
      liveVitals,
      liveEcgAbnormal,
      setLanguage,
      setCurrentUser,
      setIsOnline,
      setActivePatientId,
      setWearableConnected,
      setLiveVitals,
      setLiveEcgAbnormal,
      addPatient,
      updateConsent,
      addScreening,
      addReferral,
      addDoctorReview,
      viewRecord,
      simulateUnauthorizedAccess,
      tamperPatientRecord,
      restorePatientRecord,
      getTamperState,
      syncNow,
      getPatient,
      getScreeningsForPatient,
      getReferralsForPatient,
      getReviewsForPatient,
      getTimelineForPatient,
      seedIfNeeded,
      resetAllData,
      bumpChain,
    }),
    [
      patients,
      screenings,
      referrals,
      reviews,
      timeline,
      syncQueue,
      accessAudit,
      language,
      isOnline,
      currentUser,
      chainVersion,
      ready,
      backendConnected,
      activePatientId,
      wearableConnected,
      liveVitals,
      liveEcgAbnormal,
      setLanguage,
      setCurrentUser,
      setIsOnline,
      setActivePatientId,
      setWearableConnected,
      setLiveVitals,
      setLiveEcgAbnormal,
      addPatient,
      updateConsent,
      addScreening,
      addReferral,
      addDoctorReview,
      viewRecord,
      simulateUnauthorizedAccess,
      tamperPatientRecord,
      restorePatientRecord,
      getTamperState,
      syncNow,
      getPatient,
      getScreeningsForPatient,
      getReferralsForPatient,
      getReviewsForPatient,
      getTimelineForPatient,
      seedIfNeeded,
      resetAllData,
      bumpChain,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export { DEFAULT_USERS };
