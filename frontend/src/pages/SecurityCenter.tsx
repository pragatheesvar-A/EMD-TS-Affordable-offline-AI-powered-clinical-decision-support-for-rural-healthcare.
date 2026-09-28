import React, { useEffect, useState } from 'react';
import { ShieldCheck, Lock, Users, Link2, AlertOctagon, RefreshCcw, ShieldAlert } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, SectionTitle, Button, Badge, EmptyState, VerifiedPill } from '../components/shared/ui';
import { computePatientRecordHash } from '../lib/patientHash';
import { shortHash } from '../lib/crypto';
import { blockchain } from '../lib/blockchain';

export function SecurityCenter() {
  const {
    patients,
    accessAudit,
    chainVersion,
    tamperPatientRecord,
    restorePatientRecord,
    getTamperState,
    simulateUnauthorizedAccess,
    updateConsent,
  } = useApp();

  const [selectedId, setSelectedId] = useState<string | null>(patients[0]?.id ?? null);
  const [currentHash, setCurrentHash] = useState('');
  const [chainOk, setChainOk] = useState(true);
  const [busy, setBusy] = useState(false);
  const [accessResult, setAccessResult] = useState<{ ok: boolean; user: string; patientId: string } | null>(null);

  useEffect(() => {
    if (!selectedId && patients.length > 0) setSelectedId(patients[0].id);
  }, [patients, selectedId]);

  const patient = patients.find((p) => p.id === selectedId);
  const tamperState = selectedId ? getTamperState(selectedId) : { tampered: false };

  useEffect(() => {
    (async () => {
      if (!patient) return;
      const h = await computePatientRecordHash(patient);
      setCurrentHash(h);
    })();
  }, [patient, chainVersion]);

  useEffect(() => {
    (async () => {
      const res = await blockchain.verifyChain();
      setChainOk(res.valid);
    })();
  }, [chainVersion]);

  const integrityOk = patient ? currentHash === patient.recordHash : true;
  const anyTampered = patients.some((p) => getTamperState(p.id).tampered);

  async function handleTamper() {
    if (!selectedId) return;
    setBusy(true);
    await tamperPatientRecord(selectedId);
    setBusy(false);
  }
  async function handleRestore() {
    if (!selectedId) return;
    setBusy(true);
    await restorePatientRecord(selectedId);
    setBusy(false);
  }
  async function handleUnauthorized() {
    if (!selectedId) return;
    await simulateUnauthorizedAccess(selectedId);
    setAccessResult({ ok: false, user: 'Unknown_User', patientId: selectedId });
  }

  return (
    <div className="animate-fade-in">
      <SectionTitle title="EMD-TS Security Center" subtitle="Encryption, access control, consent and tamper-evident audit." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <Card>
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1"><Lock size={14}/> DATA INTEGRITY</div>
          <p className={`text-lg font-semibold ${anyTampered ? 'text-red-600' : 'text-emerald-600'}`}>{anyTampered ? '⚠ ISSUES FOUND' : '✓ VERIFIED'}</p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1"><Users size={14}/> ACCESS AUDIT</div>
          <p className="text-lg font-semibold text-slate-900">{accessAudit.length} EVENTS</p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1"><ShieldCheck size={14}/> CONSENT</div>
          <p className="text-lg font-semibold text-emerald-600">ACTIVE</p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1"><Link2 size={14}/> BLOCKCHAIN</div>
          <p className={`text-lg font-semibold ${chainOk ? 'text-emerald-600' : 'text-red-600'}`}>{chainOk ? '● ACTIVE' : '● BROKEN'}</p>
        </Card>
      </div>

      {patients.length === 0 ? (
        <Card><EmptyState title="No patient records yet" /></Card>
      ) : (
        <>
          <Card className="mb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900 text-sm">Tamper Detection</h3>
              <select
                className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5"
                value={selectedId ?? ''}
                onChange={(e) => setSelectedId(e.target.value)}
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3 mb-3">
              <div className="flex items-center gap-2">
                {integrityOk ? (
                  <span className="text-emerald-600 font-semibold text-sm">✓ INTEGRITY VERIFIED</span>
                ) : (
                  <span className="text-red-600 font-semibold text-sm">❌ INTEGRITY VERIFICATION FAILED</span>
                )}
              </div>
              <VerifiedPill ok={integrityOk} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-xs font-mono">
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-slate-400 mb-1 font-sans">Original Hash (on ledger)</p>
                <p className="text-slate-700 break-all">{shortHash(patient?.recordHash ?? '', 32)}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-slate-400 mb-1 font-sans">Current Hash (recomputed)</p>
                <p className={`break-all ${integrityOk ? 'text-slate-700' : 'text-red-600'}`}>{shortHash(currentHash, 32)}</p>
              </div>
            </div>

            {!integrityOk && (
              <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-3 flex items-center gap-2">
                <AlertOctagon size={14} /> Potential unauthorized modification detected.
              </p>
            )}

            <div className="flex gap-2">
              <Button variant="danger" size="sm" disabled={busy || tamperState.tampered} onClick={handleTamper}>
                <ShieldAlert size={14}/> Simulate Data Tampering
              </Button>
              <Button variant="success" size="sm" disabled={busy || !tamperState.tampered} onClick={handleRestore}>
                <RefreshCcw size={14}/> Restore Original Record
              </Button>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              This modifies a demo record's stored data directly (bypassing the normal app flow) to simulate an
              attacker, then recomputes its SHA-256 hash and compares it against the hash committed to the audit
              blockchain.
            </p>
          </Card>

          <Card className="mb-4">
            <h3 className="font-semibold text-slate-900 text-sm mb-3">Unauthorized Access Simulation</h3>
            <p className="text-xs text-slate-500 mb-3">
              Safe simulation — no real intrusion is performed. Demonstrates role-based access control blocking an
              unrecognized user from viewing a patient record.
            </p>
            <Button variant="secondary" size="sm" onClick={handleUnauthorized}>Simulate Unauthorized Access</Button>
            {accessResult && (
              <div className="mt-3 bg-red-50 border border-red-100 rounded-xl p-3.5 text-sm">
                <p><span className="text-slate-500">User:</span> <span className="font-mono">{accessResult.user}</span></p>
                <p><span className="text-slate-500">Patient:</span> <span className="font-mono">{accessResult.patientId}</span></p>
                <p><span className="text-slate-500">Action:</span> VIEW_RECORD</p>
                <p className="font-semibold text-red-600 mt-1">❌ ACCESS DENIED — Insufficient permissions</p>
              </div>
            )}
          </Card>

          <Card>
            <h3 className="font-semibold text-slate-900 text-sm mb-3">Patient Consent — {patient?.name}</h3>
            {patient && (
              <div className="space-y-2">
                {(
                  [
                    ['clinicalScreening', 'Clinical Screening'],
                    ['doctorReview', 'Doctor Review'],
                    ['telemedicineSharing', 'Telemedicine Sharing'],
                    ['dataStorage', 'Data Storage'],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between border border-slate-100 rounded-lg px-3.5 py-2.5">
                    <span className="text-sm text-slate-700">{label}</span>
                    <div className="flex items-center gap-2">
                      <Badge color={patient.consent[key] ? 'green' : 'slate'}>{patient.consent[key] ? 'Granted' : 'Revoked'}</Badge>
                      <Button size="sm" variant="success" onClick={() => updateConsent(patient.id, key, true)} disabled={patient.consent[key]}>
                        Grant
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => updateConsent(patient.id, key, false)} disabled={!patient.consent[key]}>
                        Revoke
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
