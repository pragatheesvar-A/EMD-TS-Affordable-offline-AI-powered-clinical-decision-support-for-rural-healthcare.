import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/blockchain_models.dart';
import '../state/app_state.dart';
import '../theme/app_theme.dart';
import '../widgets/app_scaffold.dart';
import '../widgets/common.dart';

/// Local permissioned blockchain audit trail: every clinically relevant
/// action (patient created, consent changed, screening completed,
/// referral generated, doctor reviewed, access denied, record synced)
/// is written as a transaction into a block, chained by
/// previousHash/currentHash. This screen surfaces the raw chain plus a
/// one-tap full-chain verification. Mirrors BlockchainAudit.tsx.
class BlockchainAuditScreen extends StatefulWidget {
  const BlockchainAuditScreen({super.key});

  @override
  State<BlockchainAuditScreen> createState() => _BlockchainAuditScreenState();
}

class _BlockchainAuditScreenState extends State<BlockchainAuditScreen> {
  Map<String, dynamic>? _stats;
  Map<String, dynamic>? _verifyResult;
  bool _verifying = false;
  bool _loading = false;
  bool _patientOnly = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    final appState = context.read<AppState>();
    setState(() => _loading = true);
    final stats = await appState.chainStats();
    await appState.refreshBlockchain(
      patientId: _patientOnly ? appState.activePatientId : null,
    );
    if (mounted) {
      setState(() {
        _stats = stats;
        _loading = false;
      });
    }
  }

  Future<void> _verify() async {
    final appState = context.read<AppState>();
    setState(() => _verifying = true);
    final result = await appState.verifyChain();
    if (mounted) {
      setState(() {
        _verifyResult = result;
        _verifying = false;
      });
    }
  }

  IconData _iconFor(String type) {
    switch (type) {
      case 'PATIENT_CREATED':
        return Icons.person_add_alt_outlined;
      case 'CONSENT_GRANTED':
      case 'CONSENT_REVOKED':
        return Icons.fact_check_outlined;
      case 'SCREENING_COMPLETED':
        return Icons.psychology_outlined;
      case 'RECORD_VIEWED':
        return Icons.visibility_outlined;
      case 'RECORD_UPDATED':
        return Icons.edit_outlined;
      case 'REFERRAL_GENERATED':
        return Icons.send_outlined;
      case 'DOCTOR_REVIEWED':
        return Icons.assignment_ind_outlined;
      case 'ACCESS_DENIED':
        return Icons.gpp_bad_outlined;
      case 'RECORD_SYNCED':
        return Icons.sync_outlined;
      default:
        return Icons.receipt_long_outlined;
    }
  }

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();
    final txs = List<BlockchainTransaction>.from(appState.blockchainTransactions)
      ..sort((a, b) => b.timestamp.compareTo(a.timestamp));

    return AppScaffold(
      currentRoute: '/blockchain',
      title: 'Blockchain Audit',
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            const SectionHeader(
              title: 'Blockchain Audit Trail',
              subtitle: 'Local permissioned chain — pseudonymous metadata only, chained by previousHash / currentHash.',
            ),
            if (_stats != null)
              GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                childAspectRatio: 1.7,
                children: [
                  StatTile(
                    label: 'Total Blocks',
                    value: '${_stats!['totalBlocks'] ?? 0}',
                    icon: Icons.view_in_ar_outlined,
                  ),
                  StatTile(
                    label: 'Total Transactions',
                    value: '${_stats!['totalTransactions'] ?? 0}',
                    icon: Icons.receipt_long_outlined,
                  ),
                  StatTile(
                    label: 'Patients Referenced',
                    value: '${_stats!['patientsReferenced'] ?? 0}',
                    icon: Icons.people_outline,
                  ),
                  StatTile(
                    label: 'Access Denials',
                    value: '${_stats!['accessDenials'] ?? 0}',
                    icon: Icons.gpp_bad_outlined,
                    tint: AppColors.riskHigh,
                    tintBg: AppColors.riskHighBg,
                  ),
                ],
              ),
            const SizedBox(height: 14),
            AppCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Expanded(
                        child: Text('Full-Chain Verification', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5)),
                      ),
                      OutlinedButton.icon(
                        onPressed: _verifying ? null : _verify,
                        icon: const Icon(Icons.link, size: 16),
                        label: Text(_verifying ? 'Verifying…' : 'Verify Chain'),
                      ),
                    ],
                  ),
                  if (_verifyResult != null) ...[
                    const SizedBox(height: 10),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: _verifyResult!['valid'] == true ? AppColors.riskLowBg : AppColors.riskHighBg,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            _verifyResult!['valid'] == true ? Icons.check_circle_outline : Icons.error_outline,
                            size: 16,
                            color: _verifyResult!['valid'] == true ? AppColors.riskLow : AppColors.riskHigh,
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              _verifyResult!['valid'] == true
                                  ? 'Chain is valid — every block\'s hash matches its recomputed contents and links to the previous block.'
                                  : 'Chain verification failed: ${_verifyResult!['error'] ?? 'hash mismatch detected'}',
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
            const SizedBox(height: 14),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Transactions', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: AppColors.slate900)),
                FilterChip(
                  label: const Text('Active patient only'),
                  selected: _patientOnly,
                  onSelected: appState.activePatientId == null
                      ? null
                      : (v) {
                          setState(() => _patientOnly = v);
                          _load();
                        },
                ),
              ],
            ),
            const SizedBox(height: 10),
            if (_loading)
              const Padding(padding: EdgeInsets.symmetric(vertical: 24), child: Center(child: CircularProgressIndicator()))
            else if (txs.isEmpty)
              const AppCard(child: EmptyState(title: 'No transactions yet', subtitle: 'Actions across the app are written here in real time.'))
            else
              ...txs.map((tx) => _TxCard(tx: tx, icon: _iconFor(tx.type))),
          ],
        ),
      ),
    );
  }
}

class _TxCard extends StatelessWidget {
  final BlockchainTransaction tx;
  final IconData icon;
  const _TxCard({required this.tx, required this.icon});

  String _short(String hash) => hash.isEmpty ? '-' : (hash.length > 18 ? '${hash.substring(0, 18)}…' : hash);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: AppCard(
        padding: const EdgeInsets.all(12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 32,
              height: 32,
              alignment: Alignment.center,
              decoration: BoxDecoration(color: AppColors.brand50, borderRadius: BorderRadius.circular(9)),
              child: Icon(icon, size: 15, color: AppColors.brand700),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          tx.type.replaceAll('_', ' '),
                          style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700, color: AppColors.slate900),
                        ),
                      ),
                      AppBadge(text: 'Block #${tx.blockIndex}'),
                    ],
                  ),
                  const SizedBox(height: 3),
                  Text('${tx.patientId} · ${tx.userRole} · ${tx.action}', style: const TextStyle(fontSize: 11.5, color: AppColors.slate500)),
                  const SizedBox(height: 3),
                  Text('tx: ${_short(tx.txId)}  ·  block hash: ${_short(tx.blockHash)}',
                      style: const TextStyle(fontSize: 10.5, fontFamily: 'monospace', color: AppColors.slate400)),
                  const SizedBox(height: 3),
                  Text(tx.timestamp, style: const TextStyle(fontSize: 10.5, color: AppColors.slate400)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
