import React, { useState } from 'react';
import { X, Smartphone, CreditCard, Landmark, ShieldCheck } from 'lucide-react';
import { Button } from '../shared/ui';
import { paymentService, type FakePaymentMethod } from '../../lib/paymentService';
import type { ConsultationPlan, PaymentResult } from '../../types/payment';

const BANKS = ['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Mahindra Bank'];

export function TestCheckoutModal({
  plan,
  patientId,
  patientName,
  onSuccess,
  onFailure,
  onCancel,
}: {
  plan: ConsultationPlan;
  patientId: string;
  patientName: string;
  onSuccess: (result: PaymentResult) => void;
  onFailure: (result: PaymentResult) => void;
  onCancel: () => void;
}) {
  const [method, setMethod] = useState<FakePaymentMethod>('upi');
  const [upiId, setUpiId] = useState('success@razorpay');
  const [cardNumber, setCardNumber] = useState('4111 1111 1111 1111');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('123');
  const [bank, setBank] = useState(BANKS[0]);
  const [forceFailure, setForceFailure] = useState(false);
  const [processing, setProcessing] = useState(false);

  async function handlePay() {
    setProcessing(true);
    const result = await paymentService.simulatePayment({
      plan,
      patientId,
      patientName,
      method,
      forceFailure,
    });
    setProcessing(false);
    if (result.status === 'success') onSuccess(result);
    else onFailure(result);
  }

  const methods: { key: FakePaymentMethod; label: string; icon: React.ReactNode }[] = [
    { key: 'upi', label: 'UPI', icon: <Smartphone size={15} /> },
    { key: 'card', label: 'Card', icon: <CreditCard size={15} /> },
    { key: 'netbanking', label: 'NetBanking', icon: <Landmark size={15} /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 animate-in fade-in-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-brand-600 text-white px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-brand-100">EMD-TS Telemedicine · Razorpay Test Mode</p>
            <p className="font-bold">₹{plan.amountInRupees} — {plan.title}</p>
          </div>
          <button onClick={onCancel} className="text-white/80 hover:text-white" disabled={processing}>
            <X size={20} />
          </button>
        </div>

        <div className="p-5">
          <div className="flex gap-2 mb-4">
            {methods.map((m) => (
              <button
                key={m.key}
                onClick={() => setMethod(m.key)}
                disabled={processing}
                className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold px-2 py-2 rounded-lg border transition-colors ${
                  method === m.key ? 'bg-brand-50 border-brand-300 text-brand-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                {m.icon} {m.label}
              </button>
            ))}
          </div>

          {method === 'upi' && (
            <div className="space-y-2 mb-4">
              <label className="text-xs font-semibold text-slate-500">UPI ID</label>
              <input
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                disabled={processing}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono"
              />
              <p className="text-[11px] text-slate-400">Test UPI — always resolves as success unless "Simulate failure" is checked.</p>
            </div>
          )}

          {method === 'card' && (
            <div className="space-y-2 mb-4">
              <label className="text-xs font-semibold text-slate-500">Card Number</label>
              <input
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                disabled={processing}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono"
              />
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-slate-500">Expiry</label>
                  <input
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    disabled={processing}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono mt-1"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-semibold text-slate-500">CVV</label>
                  <input
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value)}
                    disabled={processing}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono mt-1"
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-400">Official Razorpay test card — never a real card, never charged.</p>
            </div>
          )}

          {method === 'netbanking' && (
            <div className="space-y-2 mb-4">
              <label className="text-xs font-semibold text-slate-500">Select Bank</label>
              <select
                value={bank}
                onChange={(e) => setBank(e.target.value)}
                disabled={processing}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                {BANKS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          )}

          <label className="flex items-center gap-2 text-xs text-slate-600 mb-4">
            <input type="checkbox" checked={forceFailure} onChange={(e) => setForceFailure(e.target.checked)} disabled={processing} />
            Simulate a declined / failed payment instead
          </label>

          <Button onClick={handlePay} disabled={processing} className="w-full justify-center" size="lg">
            {processing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing test payment…
              </>
            ) : (
              `Pay ₹${plan.amountInRupees}`
            )}
          </Button>

          <p className="text-[11px] text-slate-400 mt-3 flex items-center gap-1 justify-center">
            <ShieldCheck size={12} /> Simulated locally — no network call, no real money involved.
          </p>
        </div>
      </div>
    </div>
  );
}
