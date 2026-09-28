import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/blockchain_models.dart';
import '../models/enums.dart';
import '../services/api_service.dart';
import '../state/app_state.dart';
import '../theme/app_theme.dart';
import '../widgets/app_scaffold.dart';
import '../widgets/common.dart';

/// Consent management, record-integrity verification (SHA-256 hash
/// comparison), tamper/restore simulation, and unauthorized-access
/// simulation for the active patient. Mirrors SecurityCenter.tsx.
class SecurityCenterScreen extends StatefulWidget {
  const SecurityCenterScreen({super.key});

  @override
  State<SecurityCenterScreen> createState() => _SecurityCenterScreenState();
}

class _SecurityCenterScreenState extends State<SecurityCenterScreen> {
  IntegrityStatus? _integrity;
  bool _checkingIntegrity = false;
  bool _tampering = false;
  bool _restoring = false;
  bool _simulatingAccess = false;
  Map<String, dynamic>? _accessResult;
  String? _error;

  Future<void> _checkIntegrity(AppState appState, String patientId) async {
    setState(() => _checkingIntegrity = true);
    try {
      final status = await appState.checkIntegrity(patientId);
      if (mounted) setState(() => _integrity = status);
    } catch (e) {
      if (mounted) setState(() => _error = 'Could not check integrity: $e');
    } finally {
      if (mounted) setState(() => _checkingIntegrity = false);
    }
  }

  Future<void> _tamper(AppState appState, String patientId) async {
    setState(() => _tampering = true);
    try {
      await appState.tamperRecord(patientId);
      await _checkIntegrity(appState, patientId);
    } on ApiException catch (e) {
      setState(() => _error = 'Tamper simulation failed: ${e.message}');
    } finally {
      if (mounted) setState(() => _tampering = false);
    }
  }

  Future<void> _restore(AppState appState, String patientId) async {
    setState(() => _restoring = true);
    try {
      await appState.restoreRecord(patientId);
      await _checkIntegrity(appState, patientId);
    } on ApiException catch (e) {
      setState(() => _error = 'Restore failed: ${e.message}');
    } finally {
      if (mounted) setState(() => _restoring = false);
    }
  }

  Future<void> _simulateUnauthorizedAccess(AppState appState, String patientId) async {
    setState(() {
      _simulatingAccess = true;
      _accessResult = null;
    });
    try {
      final result = await appState.simulateUnauthorizedAccess(patientId);
      if (mounted) setState(() => _accessResult = result);
    } catch (e) {
      if (mounted) setState(() => _error = 'Unauthorized-access simulation failed: $e');
    } finally {
      if (mounted) setState(() => _simulatingAccess = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();
    final patientId = appState.activePatientId;
    final patient = patientId != null ? appState.patientById(patientId) : null;

    if (patient == null) {
      return const AppScaffold(
        currentRoute: '/security',
        title: 'Security Center',
        body: Padding(
          padding: EdgeInsets.all(16),
          child: EmptyState(
            title: 'No active patient',
            subtitle: 'Select a patient from the Dashboard to manage consent and run security simulations.',
            icon: Icons.security_outlined,
          ),
        ),
      );
    }

    return AppScaffold(
      currentRoute: '/security',
      title: 'Security Center',
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          SectionHeader(
            title: 'Security Center',
            subtitle: 'Consent, integrity, and access-control controls for ${patient.name}.',
          ),
          if (_error != null) ...[
            AppCard(child: Text(_error!, style: const TextStyle(color: AppColors.riskHigh, fontSize: 12.5))),
            const SizedBox(height: 14),
          ],
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(Icons.fact_check_outlined, size: 18, color: AppColors.brand600),
                    SizedBox(width: 8),
                    Text('Consent Management', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5)),
                  ],
                ),
                const SizedBox(height: 4),
                const Text(
                  'Every consent change is recorded to the blockchain audit trail as CONSENT_GRANTED / CONSENT_REVOKED.',
                  style: TextStyle(fontSize: 11, color: AppColors.slate400),
                ),
                const SizedBox(height: 6),
                _ConsentTile(
                  title: ConsentType.clinicalScreening.label,
                  value: patient.consent.clinicalScreening,
                  onChanged: (v) => appState.updateConsent(patient.id, ConsentType.clinicalScreening, v),
                ),
                _ConsentTile(
                  title: ConsentType.doctorReview.label,
                  value: patient.consent.doctorReview,
                  onChanged: (v) => appState.updateConsent(patient.id, ConsentType.doctorReview, v),
                ),
                _ConsentTile(
                  title: ConsentType.telemedicineSharing.label,
                  value: patient.consent.telemedicineSharing,
                  onChanged: (v) => appState.updateConsent(patient.id, ConsentType.telemedicineSharing, v),
                ),
                _ConsentTile(
                  title: ConsentType.dataStorage.label,
                  value: patient.consent.dataStorage,
                  onChanged: (v) => appState.updateConsent(patient.id, ConsentType.dataStorage, v),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(Icons.verified_outlined, size: 18, color: AppColors.brand600),
                    SizedBox(width: 8),
                    Text('Record Integrity (SHA-256)', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5)),
                  ],
                ),
                const SizedBox(height: 10),
                OutlinedButton.icon(
                  onPressed: _checkingIntegrity ? null : () => _checkIntegrity(appState, patient.id),
                  icon: const Icon(Icons.search, size: 16),
                  label: Text(_checkingIntegrity ? 'Checking…' : 'Check Integrity'),
                ),
                if (_integrity != null) ...[
                  const SizedBox(height: 12),
                  VerifiedPill(ok: _integrity!.verified),
                  const SizedBox(height: 8),
                  _HashRow(label: 'Original Hash', hash: _integrity!.originalHash),
                  const SizedBox(height: 4),
                  _HashRow(label: 'Current Hash', hash: _integrity!.currentHash),
                ],
                const SizedBox(height: 14),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: _tampering ? null : () => _tamper(appState, patient.id),
                        child: Text(_tampering ? 'Tampering…' : 'Simulate Tampering'),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: _restoring ? null : () => _restore(appState, patient.id),
                        child: Text(_restoring ? 'Restoring…' : 'Restore Record'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                const Text(
                  'Tampering rewrites the stored record without updating its hash, so the next integrity check fails and the mismatch is visible immediately.',
                  style: TextStyle(fontSize: 11, color: AppColors.slate400),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(Icons.gpp_bad_outlined, size: 18, color: AppColors.riskHigh),
                    SizedBox(width: 8),
                    Text('Unauthorized Access Simulation', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5)),
                  ],
                ),
                const SizedBox(height: 6),
                const Text(
                  'Simulates an unrecognized user attempting to view this record. RBAC denies the request and logs an ACCESS_DENIED transaction.',
                  style: TextStyle(fontSize: 11, color: AppColors.slate400),
                ),
                const SizedBox(height: 10),
                OutlinedButton.icon(
                  onPressed: _simulatingAccess ? null : () => _simulateUnauthorizedAccess(appState, patient.id),
                  icon: const Icon(Icons.person_off_outlined, size: 16),
                  label: Text(_simulatingAccess ? 'Simulating…' : 'Simulate Unauthorized Access'),
                ),
                if (_accessResult != null) ...[
                  const SizedBox(height: 12),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: _accessResult!['result'] == 'DENIED' ? AppColors.riskLowBg : AppColors.riskHighBg,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          _accessResult!['result'] == 'DENIED' ? Icons.block : Icons.warning_amber_outlined,
                          size: 16,
                          color: _accessResult!['result'] == 'DENIED' ? AppColors.riskLow : AppColors.riskHigh,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            _accessResult!['result'] == 'DENIED'
                                ? 'Access DENIED — RBAC blocked "Unknown_User" and logged the attempt to the audit trail.'
                                : 'Unexpected result: ${_accessResult.toString()}',
                            style: const TextStyle(fontSize: 12, color: AppColors.slate700),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ConsentTile extends StatelessWidget {
  final String title;
  final bool value;
  final ValueChanged<bool> onChanged;

  const _ConsentTile({required this.title, required this.value, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return SwitchListTile(
      contentPadding: EdgeInsets.zero,
      title: Text(title, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
      value: value,
      onChanged: onChanged,
    );
  }
}

class _HashRow extends StatelessWidget {
  final String label;
  final String hash;
  const _HashRow({required this.label, required this.hash});

  @override
  Widget build(BuildContext context) {
    final display = hash.isEmpty ? '-' : (hash.length > 24 ? '${hash.substring(0, 24)}…' : hash);
    return Row(
      children: [
        SizedBox(width: 100, child: Text(label, style: const TextStyle(fontSize: 11.5, color: AppColors.slate500))),
        Expanded(
          child: Text(display, style: const TextStyle(fontSize: 11.5, fontFamily: 'monospace', color: AppColors.slate700)),
        ),
      ],
    );
  }
}
