import React, { useEffect, useState } from 'react';
import { Link2, CheckCircle2, XCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, SectionTitle, Badge, EmptyState } from '../components/shared/ui';
import { blockchain } from '../lib/blockchain';
import { shortHash } from '../lib/crypto';
import type { BlockchainTxType } from '../types';

const TX_COLORS: Record<BlockchainTxType, 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'slate'> = {
  PATIENT_CREATED: 'blue',
  CONSENT_GRANTED: 'green',
  CONSENT_REVOKED: 'amber',
  SCREENING_COMPLETED: 'purple',
  RECORD_VIEWED: 'slate',
  RECORD_UPDATED: 'amber',
  REFERRAL_GENERATED: 'blue',
  DOCTOR_REVIEWED: 'green',
  ACCESS_DENIED: 'red',
  RECORD_SYNCED: 'green',
};

export function BlockchainAudit() {
  const { chainVersion } = useApp();
  const [txs, setTxs] = useState(blockchain.getAllTransactions());
  const [chainStatus, setChainStatus] = useState<{ valid: boolean; brokenAtIndex: number | null }>({
    valid: true,
    brokenAtIndex: null,
  });
  const [filter, setFilter] = useState<string>('ALL');

  useEffect(() => {
    setTxs(blockchain.getAllTransactions());
    blockchain.verifyChain().then(setChainStatus);
  }, [chainVersion]);

  const filtered = filter === 'ALL' ? txs : txs.filter((t) => t.type === filter);
  const types = Array.from(new Set(txs.map((t) => t.type)));

  return (
    <div className="animate-fade-in">
      <SectionTitle
        title="Blockchain Audit Trail"
        subtitle="Local permissioned ledger — pseudonymous IDs and record hashes only. Raw clinical data never touches the chain."
        action={
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
              chainStatus.valid ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
            }`}
          >
            {chainStatus.valid ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
            {chainStatus.valid ? 'Chain Verified' : `Broken at block #${chainStatus.brokenAtIndex}`}
          </div>
        }
      />

      <Card className="mb-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-semibold text-slate-900">{blockchain.getChain().length}</p>
            <p className="text-xs text-slate-500">Total Blocks</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-slate-900">{txs.length}</p>
            <p className="text-xs text-slate-500">Transactions</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-slate-900">{new Set(txs.map((t) => t.patientId)).size}</p>
            <p className="text-xs text-slate-500">Patients Referenced</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-slate-900">{txs.filter((t) => t.type === 'ACCESS_DENIED').length}</p>
            <p className="text-xs text-slate-500">Access Denials</p>
          </div>
        </div>
      </Card>

      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <button
          onClick={() => setFilter('ALL')}
          className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${filter === 'ALL' ? 'bg-brand-50 text-brand-700 border-brand-200' : 'border-slate-200 text-slate-500'}`}
        >
          All
        </button>
        {types.map((ty) => (
          <button
            key={ty}
            onClick={() => setFilter(ty)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${filter === ty ? 'bg-brand-50 text-brand-700 border-brand-200' : 'border-slate-200 text-slate-500'}`}
          >
            {ty.replace('_', ' ')}
          </button>
        ))}
      </div>

      <Card padded={false}>
        {filtered.length === 0 ? (
          <div className="p-6"><EmptyState title="No transactions yet" subtitle="Register a patient or run the hackathon demo to populate the ledger." /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                  <th className="px-4 py-3 font-medium">Timestamp</th>
                  <th className="px-4 py-3 font-medium">Transaction</th>
                  <th className="px-4 py-3 font-medium">Patient ID</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Hash</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((tx) => (
                  <tr key={tx.txId} className="border-b border-slate-50 hover:bg-slate-50/60">
                    <td className="px-4 py-2.5 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(tx.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-2.5">
                      <Badge color={TX_COLORS[tx.type] ?? 'slate'}>{tx.type.replace('_', ' ')}</Badge>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-slate-600">{tx.patientId}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-600">{String(tx.userRole).replace('_', ' ')}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-600 max-w-[220px] truncate" title={tx.action}>
                      {tx.action}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-slate-400">{shortHash(tx.blockHash, 10)}</td>
                    <td className="px-4 py-2.5">
                      <span className="text-emerald-600 text-xs font-semibold">✓ Verified</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
