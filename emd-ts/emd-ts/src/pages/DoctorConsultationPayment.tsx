import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Stethoscope,
  ShieldCheck,
  ArrowRight,
  RotateCcw,
  Sparkles,
  User,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, SectionTitle, Button, Badge } from '../components/shared/ui';
import {
  CONSULTATION_PLANS,
  type ConsultationPlan,
  type PaymentResult,
} from '../types/payment';
import { TestCheckoutModal } from '../components/payment/TestCheckoutModal';

export function DoctorConsultationPayment() {
  const navigate = useNavigate();
  const { patients, activePatientId } = useApp();

  const [selectedPlan, setSelectedPlan] = useState<ConsultationPlan>(CONSULTATION_PLANS[0]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>(
    activePatientId || (patients.length > 0 ? patients[0].id : 'PAT-DEMO')
  );

  const [checkoutOpen, setCheckoutOpen] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<PaymentResult | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentResult[]>([]);

  // Find active patient details
  const currentPatient = patients.find((p) => p.id === selectedPatientId) || {
    id: 'PAT-DEMO',
    name: 'Ramasamy K.',
    phone: '9840123456',
    age: 58,
    gender: 'Male' as const,
    village: 'Valparai, Coimbatore',
    symptoms: 'Chest discomfort, mild dyspnea',
  };

  const handlePayNow = () => {
    setLastResult(null);
    setCheckoutOpen(true);
  };

  const handleRetry = () => {
    setLastResult(null);
    setCheckoutOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <SectionTitle
        title="Doctor Consultation & Payment"
        subtitle="Razorpay Test Mode payment flow for telemedicine consultations and priority doctor queue"
        action={
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
              RAZORPAY TEST MODE
            </span>
          </div>
        }
      />

      {/* Test Mode Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-50 to-emerald-50 border border-amber-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500 text-white shadow-sm shrink-0 mt-0.5">
            <ShieldCheck size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-sm">Razorpay Sandbox / Test Mode Active</h3>
              <Badge color="amber">Safe Simulation</Badge>
            </div>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              All payment transactions are executed in <strong>Test Mode</strong>. No real credit card or bank account will be charged. Use test UPI, NetBanking, or card details in the Razorpay checkout modal.
            </p>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2 text-xs font-medium text-slate-500 bg-white/80 border border-slate-200 px-3 py-1.5 rounded-xl">
          <span>Key: <code className="text-brand-700 font-mono">rzp_test_***</code></span>
        </div>
      </div>

      {/* Flow Breadcrumbs */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 px-4 shadow-sm flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
        <div className="flex items-center gap-2 font-medium">
          <span className="w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center text-[10px] font-bold">1</span>
          <span>Select Consultation Plan</span>
        </div>
        <ArrowRight size={14} className="text-slate-300 hidden sm:inline" />
        <div className="flex items-center gap-2 font-medium">
          <span className="w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center text-[10px] font-bold">2</span>
          <span>Review Patient Details</span>
        </div>
        <ArrowRight size={14} className="text-slate-300 hidden sm:inline" />
        <div className="flex items-center gap-2 font-medium">
          <span className="w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center text-[10px] font-bold">3</span>
          <span>Razorpay Test Checkout</span>
        </div>
        <ArrowRight size={14} className="text-slate-300 hidden sm:inline" />
        <div className="flex items-center gap-2 font-medium">
          <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">4</span>
          <span>Doctor Consultation Queue</span>
        </div>
      </div>

      {/* Main Grid: Plan Selection & Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Plan Cards & Patient Details (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Patient Selector */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <User size={16} className="text-brand-600" />
                Select Patient for Consultation
              </h2>
              <Badge color="blue">{patients.length} Registered</Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {patients.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPatientId(p.id)}
                  type="button"
                  className={`text-left p-3 rounded-xl border transition-all ${
                    selectedPatientId === p.id
                      ? 'border-brand-500 bg-brand-50/70 shadow-sm'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                  }`}
                >
                  <p className="text-sm font-bold text-slate-900">{p.name}</p>
                  <p className="text-xs text-slate-500">{p.age} yrs · {p.gender} · {p.village}</p>
                  <p className="text-[11px] text-brand-700 font-mono mt-1">{p.id}</p>
                </button>
              ))}
            </div>
          </Card>

          {/* Consultation Plans */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 px-1">
              <Stethoscope size={16} className="text-brand-600" />
              Choose Consultation Plan
            </h2>

            <div className="grid grid-cols-1 gap-4">
              {CONSULTATION_PLANS.map((plan) => {
                const isSelected = selectedPlan.id === plan.id;
                const isSpecialist = plan.id === 'specialist_consultation';

                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan)}
                    className={`cursor-pointer rounded-2xl border-2 p-5 transition-all relative ${
                      isSelected
                        ? 'border-brand-600 bg-white shadow-md ring-2 ring-brand-600/10'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                    }`}
                  >
                    {isSpecialist && (
                      <span className="absolute -top-3 right-5 px-3 py-0.5 rounded-full text-[11px] font-bold bg-gradient-to-r from-purple-600 to-brand-600 text-white shadow-sm flex items-center gap-1">
                        <Sparkles size={11} />
                        RECOMMENDED FOR HIGH RISK
                      </span>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-5 h-5 rounded-full mt-1 border-2 flex items-center justify-center shrink-0 transition-colors ${
                            isSelected ? 'border-brand-600 bg-brand-600' : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-base">{plan.title}</h3>
                          <p className="text-xs text-slate-500 mt-0.5">{plan.subtitle}</p>
                          <p className="text-xs text-brand-700 font-medium mt-1">
                            👨‍⚕️ {plan.doctorType}
                          </p>

                          <ul className="mt-3 space-y-1.5">
                            {plan.features.map((feat, i) => (
                              <li key={i} className="text-xs text-slate-600 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                <span>{feat}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="text-right sm:shrink-0 pl-8 sm:pl-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                        <span className="text-xs text-slate-400 font-medium block">Total Fee</span>
                        <span className="text-2xl font-black text-slate-900 tracking-tight">
                          ₹{plan.amountInRupees}
                        </span>
                        <span className="text-[11px] text-amber-700 font-semibold block mt-0.5 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Test Mode
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Col: Checkout Summary & Action (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <Card className="sticky top-20 border-brand-100 shadow-md">
            <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center justify-between">
              <span>Order Summary</span>
              <Badge color="green">Secure Checkout</Badge>
            </h2>

            {/* Breakdown */}
            <div className="py-4 space-y-3 text-sm">
              <div className="flex justify-between items-center text-slate-600">
                <span>Patient Name</span>
                <span className="font-semibold text-slate-900">{currentPatient.name}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Patient ID</span>
                <span className="font-mono text-xs text-slate-500">{currentPatient.id}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Selected Plan</span>
                <span className="font-semibold text-brand-700">{selectedPlan.title}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Consultant Level</span>
                <span className="text-xs text-slate-700">{selectedPlan.doctorType}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Payment Gateway</span>
                <span className="text-xs font-semibold text-slate-800">Razorpay (Test SDK)</span>
              </div>

              <div className="border-t border-dashed border-slate-200 pt-3 mt-3 flex justify-between items-baseline">
                <div>
                  <p className="font-bold text-slate-900 text-base">Total Payable</p>
                  <p className="text-[11px] text-slate-400">Includes all digital health taxes</p>
                </div>
                <p className="text-2xl font-black text-brand-700">₹{selectedPlan.amountInRupees}</p>
              </div>
            </div>

            {/* Pay Now Button */}
            <Button
              variant="primary"
              size="lg"
              onClick={handlePayNow}
              disabled={checkoutOpen}
              className="w-full flex items-center justify-center gap-2 text-base font-bold py-3.5 shadow-lg shadow-brand-600/30"
            >
              <CreditCard size={18} />
              <span>Pay ₹{selectedPlan.amountInRupees} Now (Test Mode)</span>
            </Button>

            <div className="mt-4 pt-3 border-t border-slate-100 text-center">
              <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
                <ShieldCheck size={13} className="text-emerald-600" />
                256-bit Encrypted · Razorpay Test Gateway Verified
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Result Card: Success or Failure */}
      {lastResult && (
        <div
          className={`rounded-2xl border p-6 transition-all animate-in fade-in-50 ${
            lastResult.status === 'success'
              ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900 shadow-lg'
              : lastResult.status === 'cancelled'
              ? 'bg-amber-50/80 border-amber-300 text-amber-900'
              : 'bg-rose-50/80 border-rose-300 text-rose-900'
          }`}
        >
          {lastResult.status === 'success' ? (
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-md shrink-0">
                  <CheckCircle2 size={32} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">Payment Successful!</h3>
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-200 text-emerald-900">
                      RAZORPAY TEST MODE
                    </span>
                  </div>
                  <p className="text-xs text-emerald-800 mt-1">
                    Your doctor consultation booking has been confirmed and placed in the priority clinical queue.
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 bg-white/90 border border-emerald-200 rounded-xl p-3.5 text-xs">
                    <div>
                      <span className="text-slate-400 block">Consultation Type</span>
                      <span className="font-bold text-slate-800">{lastResult.plan.title}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Amount Paid</span>
                      <span className="font-bold text-emerald-700 text-sm">₹{lastResult.amountPaid}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Payment ID</span>
                      <span className="font-mono font-bold text-slate-800 break-all">{lastResult.paymentId}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Patient</span>
                      <span className="font-bold text-slate-800">{lastResult.patientName}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 shrink-0 w-full md:w-auto">
                <Button
                  variant="success"
                  onClick={() => navigate('/doctor')}
                  className="flex items-center justify-center gap-1.5"
                >
                  <Stethoscope size={15} />
                  <span>Go to Doctor Dashboard</span>
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setLastResult(null)}
                >
                  Book Another
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-3 bg-rose-600 text-white rounded-2xl shadow-md shrink-0">
                  {lastResult.status === 'cancelled' ? <AlertTriangle size={24} /> : <XCircle size={24} />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {lastResult.status === 'cancelled' ? 'Payment Cancelled' : 'Payment Failed'}
                  </h3>
                  <p className="text-xs text-rose-800 mt-1">
                    {lastResult.message || 'The test transaction was not completed. No money was deducted.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setLastResult(null)}
                >
                  Dismiss
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleRetry}
                  className="flex items-center gap-1.5"
                >
                  <RotateCcw size={14} />
                  <span>Try Again</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Transaction History Table */}
      {paymentHistory.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Clock size={16} className="text-slate-500" />
              Recent Test Mode Payments
            </h3>
            <Badge color="slate">{paymentHistory.length} Transactions</Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Payment ID</th>
                  <th className="py-2.5 px-3">Patient</th>
                  <th className="py-2.5 px-3">Plan</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paymentHistory.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono text-brand-700">{item.paymentId}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">{item.patientName}</td>
                    <td className="py-2.5 px-3 text-slate-600">{item.plan.title}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">₹{item.amountPaid}</td>
                    <td className="py-2.5 px-3">
                      <Badge color="green">SUCCESS (TEST)</Badge>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 font-mono">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {checkoutOpen && (
        <TestCheckoutModal
          plan={selectedPlan}
          patientId={currentPatient.id}
          patientName={currentPatient.name}
          onSuccess={(result) => {
            setCheckoutOpen(false);
            setLastResult(result);
            setPaymentHistory((prev) => [result, ...prev]);
          }}
          onFailure={(result) => {
            setCheckoutOpen(false);
            setLastResult(result);
          }}
          onCancel={() => setCheckoutOpen(false)}
        />
      )}
    </div>
  );
}
