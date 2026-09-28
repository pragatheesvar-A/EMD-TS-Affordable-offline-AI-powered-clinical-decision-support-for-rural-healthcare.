import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/referral.dart';
import '../services/api_service.dart';
import '../state/app_state.dart';
import '../theme/app_theme.dart';
import '../widgets/app_scaffold.dart';
import '../widgets/common.dart';

/// Generates a structured referral (care level, specialist, priority)
/// from the most recent AI screening result, and lists all referrals
/// already raised for this patient. Mirrors SmartReferral.tsx.
class SmartReferralScreen extends StatefulWidget {
  const SmartReferralScreen({super.key});

  @override
  State<SmartReferralScreen> createState() => _SmartReferralScreenState();
}

class _SmartReferralScreenState extends State<SmartReferralScreen> {
  final _note = TextEditingController();
  bool _submitting = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final appState = context.read<AppState>();
      final patientId = appState.activePatientId;
      if (patientId != null) appState.refreshReferrals(patientId);
    });
  }

  @override
  void dispose() {
    _note.dispose();
    super.dispose();
  }

  Future<void> _submit(AppState appState, String patientId, String screeningId) async {
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      await appState.addReferral(
        patientId,
        screeningId,
        _note.text.trim().isEmpty ? 'Referral generated from AI screening result.' : _note.text.trim(),
      );
      _note.clear();
    } on ApiException catch (e) {
      setState(() => _error = 'Could not generate referral: ${e.message}');
    } catch (e) {
      setState(() => _error = 'Could not generate referral. Check the backend connection in Settings.');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();
    final patientId = appState.activePatientId;
    final patient = patientId != null ? appState.patientById(patientId) : null;

    if (patient == null) {
      return const AppScaffold(
        currentRoute: '/referral',
        title: 'Smart Referral',
        body: Padding(
          padding: EdgeInsets.all(16),
          child: EmptyState(
            title: 'No active patient',
            subtitle: 'Select a patient from the Dashboard to generate a referral.',
            icon: Icons.send_outlined,
          ),
        ),
      );
    }

    final screening = appState.latestScreeningFor(patient.id);
    final referrals = appState.referralsFor(patient.id);

    return AppScaffold(
      currentRoute: '/referral',
      title: 'Smart Referral',
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          SectionHeader(
            title: 'Smart Referral',
            subtitle: 'Route ${patient.name} to the right level of care based on the latest screening.',
          ),
          if (screening == null)
            AppCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('No screening yet', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5)),
                  const SizedBox(height: 6),
                  const Text(
                    'A referral is generated from an AI screening result. Run a screening first.',
                    style: TextStyle(fontSize: 12.5, color: AppColors.slate500),
                  ),
                  const SizedBox(height: 12),
                  ElevatedButton(
                    onPressed: () => Navigator.of(context).pushNamed('/screening'),
                    child: const Text('Run AI Screening'),
                  ),
                ],
              ),
            )
          else ...[
            AppCard(
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Latest Screening', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5)),
                        const SizedBox(height: 6),
                        Text('Score ${screening.riskScore}/100', style: const TextStyle(fontSize: 12, color: AppColors.slate500)),
                      ],
                    ),
                  ),
                  RiskBadge(level: screening.riskLevel),
                ],
              ),
            ),
            const SizedBox(height: 14),
            AppCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Referral Note (optional)', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5)),
                  const SizedBox(height: 10),
                  TextField(
                    controller: _note,
                    maxLines: 3,
                    decoration: const InputDecoration(hintText: 'Add any additional context for the receiving facility…'),
                  ),
                  const SizedBox(height: 10),
                  if (_error != null) ...[
                    Text(_error!, style: const TextStyle(color: AppColors.riskHigh, fontSize: 12.5)),
                    const SizedBox(height: 8),
                  ],
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: _submitting ? null : () => _submit(appState, patient.id, screening.id),
                      icon: _submitting
                          ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : const Icon(Icons.send_outlined, size: 18),
                      label: Text(_submitting ? 'Generating…' : 'Generate Referral'),
                    ),
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 16),
          const Text('Referral History', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: AppColors.slate900)),
          const SizedBox(height: 10),
          if (referrals.isEmpty)
            const AppCard(
              child: EmptyState(title: 'No referrals yet', subtitle: 'Generated referrals for this patient will appear here.'),
            )
          else
            ...referrals.map((r) => _ReferralCard(referral: r)),
        ],
      ),
    );
  }
}

class _ReferralCard extends StatelessWidget {
  final ReferralRecord referral;
  const _ReferralCard({required this.referral});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: AppCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(referral.careLevel, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5)),
                RiskBadge(level: referral.priority),
              ],
            ),
            const SizedBox(height: 6),
            Row(
              children: [
                const Icon(Icons.person_outline, size: 14, color: AppColors.slate400),
                const SizedBox(width: 4),
                Text(referral.specialist, style: const TextStyle(fontSize: 12, color: AppColors.slate600)),
              ],
            ),
            const SizedBox(height: 6),
            Text(referral.reason, style: const TextStyle(fontSize: 12.5, color: AppColors.slate700)),
            if (referral.note.isNotEmpty) ...[
              const SizedBox(height: 6),
              Text('Note: ${referral.note}', style: const TextStyle(fontSize: 12, color: AppColors.slate500, fontStyle: FontStyle.italic)),
            ],
            const SizedBox(height: 8),
            Text(referral.createdAt, style: const TextStyle(fontSize: 10.5, color: AppColors.slate400)),
          ],
        ),
      ),
    );
  }
}
