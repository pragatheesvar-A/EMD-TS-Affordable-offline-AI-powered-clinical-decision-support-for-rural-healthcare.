export interface ConsultationPlan {
  id: string;
  title: string;
  subtitle: string;
  amountInRupees: number;
  amountInPaise: number;
  doctorType: string;
  features: string[];
}

export const CONSULTATION_PLANS: ConsultationPlan[] = [
  {
    id: 'basic_consultation',
    title: 'Basic Consultation',
    subtitle: 'General Physician Assessment & Digital Prescription',
    amountInRupees: 199,
    amountInPaise: 19900,
    doctorType: 'General Practitioner (MBBS)',
    features: [
      '15-minute secure video / audio consultation',
      'AI Screening summary & triage review',
      'Digital prescription with tamper-evident hash',
      'Standard turnaround (Queue position < 10 mins)',
    ],
  },
  {
    id: 'specialist_consultation',
    title: 'Specialist Consultation',
    subtitle: 'Emergency Cardiology / Specialist Priority Review',
    amountInRupees: 399,
    amountInPaise: 39900,
    doctorType: 'Specialist Doctor (MD / DM Cardiology)',
    features: [
      '30-minute priority specialist review',
      'Deep AI ECG wave analysis & risk stratification',
      'Emergency secondary referral escalation',
      'Priority emergency queue (< 3 mins)',
      'Direct sync with hospital ICU team',
    ],
  },
];

export type PaymentStatus = 'idle' | 'processing' | 'success' | 'failed' | 'cancelled';

export interface PaymentResult {
  status: PaymentStatus;
  paymentId?: string;
  orderId?: string;
  signature?: string;
  code?: number | string;
  message?: string;
  timestamp: string;
  plan: ConsultationPlan;
  patientId: string;
  patientName: string;
  amountPaid: number;
}
