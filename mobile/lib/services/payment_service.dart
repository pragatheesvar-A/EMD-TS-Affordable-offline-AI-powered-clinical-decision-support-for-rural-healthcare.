import 'package:flutter/foundation.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';

/// Callback signatures for payment status events.
typedef PaymentSuccessCallback = void Function(PaymentSuccessResponse response);
typedef PaymentFailureCallback = void Function(PaymentFailureResponse response);
typedef ExternalWalletCallback = void Function(ExternalWalletResponse response);

/// Model representing a consultation plan.
class ConsultationPlan {
  final String id;
  final String title;
  final String subtitle;
  final int amountInRupees;
  final String duration;
  final List<String> features;

  const ConsultationPlan({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.amountInRupees,
    required this.duration,
    required this.features,
  });

  int get amountInPaise => amountInRupees * 100;
}

/// Demo consultation plans available in EMD-TS.
const List<ConsultationPlan> demoConsultationPlans = [
  ConsultationPlan(
    id: 'plan_basic',
    title: 'Basic Consultation',
    subtitle: 'General Physician Review & Vital Assessment',
    amountInRupees: 199,
    duration: '15 mins',
    features: [
      'Edge vital telemetry review',
      'AI triage risk assessment analysis',
      'Digital prescription generation',
      'Audio / text consultation',
    ],
  ),
  ConsultationPlan(
    id: 'plan_specialist',
    title: 'Specialist Consultation',
    subtitle: 'Cardiology / Pulmonary Specialist Review',
    amountInRupees: 399,
    duration: '30 mins',
    features: [
      'Comprehensive 6-lead ECG review',
      'Priority specialist tele-consultation',
      'Instant ABDM-aligned smart referral',
      'Immutable blockchain audit receipt',
    ],
  ),
];

/// Service managing Razorpay checkout in Test Mode.
/// NOTE: Uses only Razorpay Test Key ID on the client. Never include Secret Key.
class PaymentService {
  Razorpay? _razorpay;
  bool _isInitialized = false;

  PaymentSuccessCallback? _onSuccess;
  PaymentFailureCallback? _onFailure;
  ExternalWalletCallback? _onExternalWallet;

  // Razorpay Test Mode Key ID (Public Client Key for Test/Sandbox only)
  static const String defaultTestKeyId = 'rzp_test_1DP5mmOlF5G5ag';

  /// Initializes the Razorpay instance and attaches listeners safely.
  void init({
    required PaymentSuccessCallback onSuccess,
    required PaymentFailureCallback onFailure,
    ExternalWalletCallback? onExternalWallet,
  }) {
    if (_isInitialized) {
      dispose();
    }

    _onSuccess = onSuccess;
    _onFailure = onFailure;
    _onExternalWallet = onExternalWallet;

    _razorpay = Razorpay();
    _razorpay!.on(Razorpay.EVENT_PAYMENT_SUCCESS, _handlePaymentSuccess);
    _razorpay!.on(Razorpay.EVENT_PAYMENT_ERROR, _handlePaymentError);
    _razorpay!.on(Razorpay.EVENT_EXTERNAL_WALLET, _handleExternalWallet);
    _isInitialized = true;
  }

  void _handlePaymentSuccess(PaymentSuccessResponse response) {
    debugPrint('[PaymentService] Payment Success: ${response.paymentId}');
    _onSuccess?.call(response);
  }

  void _handlePaymentError(PaymentFailureResponse response) {
    debugPrint('[PaymentService] Payment Error: [${response.code}] ${response.message}');
    _onFailure?.call(response);
  }

  void _handleExternalWallet(ExternalWalletResponse response) {
    debugPrint('[PaymentService] External Wallet: ${response.walletName}');
    _onExternalWallet?.call(response);
  }

  /// Opens Razorpay Checkout sheet in Test Mode.
  void openCheckout({
    required ConsultationPlan plan,
    required String patientName,
    required String patientPhone,
    String? patientEmail,
    String testKeyId = defaultTestKeyId,
  }) {
    if (!_isInitialized || _razorpay == null) {
      throw StateError('PaymentService must be initialized before calling openCheckout().');
    }

    final options = {
      'key': testKeyId,
      'amount': plan.amountInPaise,
      'name': 'EMD-TS Telemedicine',
      'description': '${plan.title} (₹${plan.amountInRupees}) - Test Mode',
      'timeout': 180, // in seconds
      'prefill': {
        'contact': patientPhone.isNotEmpty ? patientPhone : '9876543210',
        'email': (patientEmail != null && patientEmail.isNotEmpty)
            ? patientEmail
            : 'patient@emdts.local',
        'name': patientName.isNotEmpty ? patientName : 'Rural Patient',
      },
      'notes': {
        'plan_id': plan.id,
        'plan_name': plan.title,
        'environment': 'TEST_MODE',
        'system': 'EMD-TS-Edge',
      },
      'theme': {
        'color': '#185CEF',
      },
    };

    try {
      _razorpay!.open(options);
    } catch (e) {
      debugPrint('[PaymentService] Error launching Razorpay: $e');
      rethrow;
    }
  }

  /// Cleans up Razorpay event listeners and releases resources.
  void dispose() {
    if (_razorpay != null) {
      _razorpay!.clear();
      _razorpay = null;
    }
    _onSuccess = null;
    _onFailure = null;
    _onExternalWallet = null;
    _isInitialized = false;
  }
}
