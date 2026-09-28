import { canonicalize, sha256Hex } from './crypto';
import type { Patient } from '../types';

// The canonical, hashable subset of a patient record. This is what gets
// SHA-256 hashed and referenced by the blockchain — never the raw record
// itself. Deliberately excludes fields that change independently of
// clinical content (consent, recordHash itself).
export function patientHashPayload(p: Patient): Record<string, unknown> {
  return {
    id: p.id,
    name: p.name,
    age: p.age,
    gender: p.gender,
    phone: p.phone,
    village: p.village,
    symptoms: p.symptoms,
    duration: p.duration,
    knownConditions: p.knownConditions,
    medications: p.medications,
    allergies: p.allergies,
    createdAt: p.createdAt,
  };
}

export async function computePatientRecordHash(p: Patient): Promise<string> {
  return sha256Hex(canonicalize(patientHashPayload(p)));
}
