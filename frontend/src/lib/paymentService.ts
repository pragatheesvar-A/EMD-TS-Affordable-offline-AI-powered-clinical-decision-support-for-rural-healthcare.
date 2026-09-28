import type { ConsultationPlan, PaymentResult } from '../types/payment';

export type FakePaymentMethod = 'upi' | 'card' | 'netbanking';

export interface SimulatePaymentInput {
  plan: ConsultationPlan;
  patientId: string;
  patientName: string;
  method: FakePaymentMethod;
  /** When true, resolves as a declined/failed test payment instead of success. */
  forceFailure?: boolean;
}

export class PaymentService {
  private static instance: PaymentService;

  private constructor() {}

  public static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  /**
   * Simulates a Razorpay Test Mode payment entirely in-app (no network / real SDK).
   * The app is offline-first, so checkout can't depend on reaching checkout.razorpay.com
   * or a real Razorpay account — this mirrors the real test-mode outcomes locally.
   */
  public simulatePayment({ plan, patientId, patientName, method, forceFailure }: SimulatePaymentInput): Promise<PaymentResult> {
    const timestamp = new Date().toISOString();

    return new Promise((resolve) => {
      setTimeout(() => {
        if (forceFailure) {
          resolve({
            status: 'failed',
            code: 'BAD_REQUEST_ERROR',
            message:
              method === 'card'
                ? 'Test card declined by issuing bank (simulated failure).'
                : 'Test payment declined (simulated failure).',
            timestamp,
            plan,
            patientId,
            patientName,
            amountPaid: plan.amountInRupees,
          });
          return;
        }

        resolve({
          status: 'success',
          paymentId: `pay_test_${Math.random().toString(36).slice(2, 11).toUpperCase()}`,
          orderId: `order_test_${Math.random().toString(36).slice(2, 11).toUpperCase()}`,
          timestamp,
          plan,
          patientId,
          patientName,
          amountPaid: plan.amountInRupees,
        });
      }, 1400);
    });
  }
}

export const paymentService = PaymentService.getInstance();
