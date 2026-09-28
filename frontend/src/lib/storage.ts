// Local-first storage layer. Uses localStorage as the persistence engine
// (per project spec: "IndexedDB or localStorage"). All reads/writes are
// wrapped so a corrupted/missing key never crashes the app.

const NAMESPACE = 'emdts';

function key(name: string): string {
  return `${NAMESPACE}:${name}`;
}

export function loadJSON<T>(name: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key(name));
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.warn(`[storage] failed to load "${name}", using fallback`, e);
    return fallback;
  }
}

export function saveJSON<T>(name: string, value: T): void {
  try {
    localStorage.setItem(key(name), JSON.stringify(value));
  } catch (e) {
    console.error(`[storage] failed to save "${name}"`, e);
  }
}

export function clearAll(): void {
  Object.keys(localStorage)
    .filter((k) => k.startsWith(`${NAMESPACE}:`))
    .forEach((k) => localStorage.removeItem(k));
}

export const STORAGE_KEYS = {
  patients: 'patients',
  screenings: 'screenings',
  referrals: 'referrals',
  reviews: 'reviews',
  timeline: 'timeline',
  blockchain: 'blockchain',
  syncQueue: 'syncQueue',
  auditAccess: 'auditAccess',
  settings: 'settings',
  seeded: 'seeded_v1',
  tamperedRecord: 'tamperedRecord',
} as const;
