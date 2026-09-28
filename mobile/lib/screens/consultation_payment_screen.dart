import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';

import '../services/payment_service.dart';
import '../state/app_state.dart';
import '../theme/app_theme.dart';
import '../widgets/app_scaffold.dart';
import '../widgets/common.dart';

enum PaymentState { idle, processing, success, failure }

class ConsultationPaymentScreen extends StatefulWidget {
  const ConsultationPaymentScreen({super.key});

  @override
  State<ConsultationPaymentScreen> createState() => _ConsultationPaymentScreenState();
}

class _ConsultationPaymentScreenState extends State<ConsultationPaymentScreen> {
  final PaymentService _paymentService = PaymentService();
  ConsultationPlan _selectedPlan = demoConsultationPlans[0];

  PaymentState _state = PaymentState.idle;
  String? _paymentId;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _paymentService.init(
      onSuccess: _handlePaymentSuccess,
      onFailure: _handlePaymentFailure,
      onExternalWallet: _handleExternalWallet,
    );
  }

  @override
  void dispose() {
    _paymentService.dispose();
    super.dispose();
  }

  void _handlePaymentSuccess(PaymentSuccessResponse response) {
    if (!mounted) return;
    setState(() {
      _state = PaymentState.success;
      _paymentId = response.paymentId ?? 'pay_test_${DateTime.now().millisecondsSinceEpoch}';
      _errorMessage = null;
    });
  }

  void _handlePaymentFailure(PaymentFailureResponse response) {
    if (!mounted) return;
    setState(() {
      _state = PaymentState.failure;
      _errorMessage = response.message != null && response.message!.isNotEmpty
          ? response.message
          : 'Payment cancelled or could not be processed.';
    });
  }

  void _handleExternalWallet(ExternalWalletResponse response) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Selected external wallet: ${response.walletName}')),
    );
  }

  void _startPayment(AppState appState) {
    final patientId = appState.activePatientId;
    final patient = patientId != null ? appState.patientById(patientId) : null;

    setState(() {
      _state = PaymentState.processing;
      _errorMessage = null;
    });

    try {
      _paymentService.openCheckout(
        plan: _selectedPlan,
        patientName: patient?.name ?? 'Rural Patient',
        patientPhone: patient?.phone ?? '9876543210',
      );
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _state = PaymentState.failure;
        _errorMessage = 'Failed to initiate Razorpay checkout: $e';
      });
    }
  }

  void _retryPayment() {
    setState(() {
      _state = PaymentState.idle;
      _errorMessage = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();
    final patientId = appState.activePatientId;
    final patient = patientId != null ? appState.patientById(patientId) : null;

    return AppScaffold(
      currentRoute: '/payment',
      title: 'Consultation Payment',
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Razorpay Test Mode Banner
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: const Color(0xFFFFFBEB),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFFDE68A)),
            ),
            child: const Row(
              children: [
                Icon(Icons.science_outlined, color: Color(0xFFD97706), size: 20),
                SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'RAZORPAY TEST MODE',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF92400E),
                          letterSpacing: 0.5,
                        ),
                      ),
                      SizedBox(height: 2),
                      Text(
                        'No real money is charged. Use test UPI / Cards in Razorpay Checkout.',
                        style: TextStyle(fontSize: 11, color: Color(0xFFB45309)),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // Patient Context Card
          if (patient != null) ...[
            AppCard(
              child: Row(
                children: [
                  CircleAvatar(
                    backgroundColor: AppColors.brand50,
                    radius: 20,
                    child: Text(
                      patient.name.isNotEmpty ? patient.name[0] : '?',
                      style: const TextStyle(
                        color: AppColors.brand700,
                        fontWeight: FontWeight.w700,
                        fontSize: 16,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          patient.name,
                          style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
                        ),
                        Text(
                          '${patient.age} yrs · ${patient.gender} · ${patient.village}',
                          style: const TextStyle(fontSize: 12, color: AppColors.slate500),
                        ),
                      ],
                    ),
                  ),
                  const AppBadge(
                    text: 'TELEMEDICINE',
                    background: AppColors.brand50,
                    color: AppColors.brand700,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),
          ],

          // Status Views or Plan Selection
          if (_state == PaymentState.success)
            _buildSuccessView(context, patient?.name ?? 'Patient')
          else if (_state == PaymentState.failure)
            _buildFailureView()
          else
            _buildPlanSelectionView(appState),
        ],
      ),
    );
  }

  Widget _buildPlanSelectionView(AppState appState) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SectionHeader(
          title: 'Select Consultation Plan',
          subtitle: 'Choose a telemedicine tier to initiate specialist review.',
        ),
        ...demoConsultationPlans.map((plan) {
          final isSelected = _selectedPlan.id == plan.id;
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: InkWell(
              borderRadius: BorderRadius.circular(16),
              onTap: () {
                setState(() => _selectedPlan = plan);
              },
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isSelected ? const Color(0xFFF0F5FF) : Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: isSelected ? AppColors.brand600 : AppColors.slate200,
                    width: isSelected ? 2 : 1,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.03),
                      blurRadius: 6,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                plan.title,
                                style: TextStyle(
                                  fontWeight: FontWeight.w700,
                                  fontSize: 15,
                                  color: isSelected ? AppColors.brand700 : AppColors.slate900,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                plan.subtitle,
                                style: const TextStyle(fontSize: 12, color: AppColors.slate500),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: isSelected ? AppColors.brand600 : AppColors.slate100,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            '₹${plan.amountInRupees}',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                              color: isSelected ? Colors.white : AppColors.slate900,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    const Divider(height: 1, color: AppColors.slate200),
                    const SizedBox(height: 10),
                    ...plan.features.map(
                      (feature) => Padding(
                        padding: const EdgeInsets.only(bottom: 4),
                        child: Row(
                          children: [
                            Icon(
                              Icons.check_circle,
                              size: 14,
                              color: isSelected ? AppColors.brand600 : AppColors.slate400,
                            ),
                            const SizedBox(width: 6),
                            Text(
                              feature,
                              style: const TextStyle(fontSize: 12, color: AppColors.slate700),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        }),
        const SizedBox(height: 16),
        SizedBox(
          width: double.infinity,
          height: 48,
          child: ElevatedButton(
            onPressed: _state == PaymentState.processing ? null : () => _startPayment(appState),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.brand600,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: _state == PaymentState.processing
                ? const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                      ),
                      SizedBox(width: 10),
                      Text('Opening Razorpay Checkout...'),
                    ],
                  )
                : Text(
                    'Pay ₹${_selectedPlan.amountInRupees} Now (Test Mode)',
                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
                  ),
          ),
        ),
      ],
    );
  }

  Widget _buildSuccessView(BuildContext context, String patientName) {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: const BoxDecoration(
              color: Color(0xFFDCFCE7),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.check_circle_rounded, color: Color(0xFF16A34A), size: 36),
          ),
          const SizedBox(height: 12),
          const Text(
            'Payment Successful',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w800,
              color: Color(0xFF166534),
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Razorpay Test Mode Transaction Completed',
            style: TextStyle(fontSize: 12, color: AppColors.slate500),
          ),
          const SizedBox(height: 16),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.slate50,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppColors.slate200),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildReceiptRow('Consultation Type', _selectedPlan.title),
                const SizedBox(height: 6),
                _buildReceiptRow('Amount Paid', '₹${_selectedPlan.amountInRupees}.00'),
                const SizedBox(height: 6),
                _buildReceiptRow('Patient', patientName),
                const SizedBox(height: 6),
                _buildReceiptRow('Test Payment ID', _paymentId ?? '-'),
                const SizedBox(height: 6),
                _buildReceiptRow('Mode', 'TEST MODE (Simulated)'),
              ],
            ),
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () {
                    setState(() {
                      _state = PaymentState.idle;
                      _paymentId = null;
                    });
                  },
                  child: const Text('New Payment'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.of(context).pushNamed('/doctor');
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.brand600,
                    foregroundColor: Colors.white,
                  ),
                  child: const Text('Consult Doctor'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildFailureView() {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: const BoxDecoration(
              color: Color(0xFFFEE2E2),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.error_outline_rounded, color: Color(0xFFDC2626), size: 36),
          ),
          const SizedBox(height: 12),
          const Text(
            'Payment Failed or Cancelled',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w800,
              color: Color(0xFF991B1B),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            _errorMessage ?? 'The checkout was dismissed or an error occurred during processing.',
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 12, color: AppColors.slate600),
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            height: 44,
            child: ElevatedButton.icon(
              onPressed: _retryPayment,
              icon: const Icon(Icons.refresh, size: 18),
              label: const Text('Try Again'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.brand600,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildReceiptRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(fontSize: 12, color: AppColors.slate500)),
        Text(
          value,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w700,
            color: AppColors.slate900,
          ),
        ),
      ],
    );
  }
}
