import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/enums.dart';
import '../state/app_state.dart';
import '../theme/app_theme.dart';
import '../widgets/app_scaffold.dart';
import '../widgets/common.dart';

class _DemoStep {
  final String title;
  final String description;
  final Future<String> Function(AppState appState) run;
  const _DemoStep({required this.title, required this.description, required this.run});
}

/// Scripted "Complete Hackathon Demo Mode" that walks through the full
/// EMD-TS story end-to-end using the three seeded demo patients
/// (PAT-1001 Ravi Kumar / HIGH, PAT-1002 Meena / MODERATE, PAT-1003 Arun
/// / LOW): screening, explainability, referral, doctor review,
/// blockchain verification, tamper detection + restore, unauthorized
/// access, and offline sync. Mirrors DemoRunner.tsx.
class DemoRunnerScreen extends StatefulWidget {
  const DemoRunnerScreen({super.key});

  @override
  State<DemoRunnerScreen> createState() => _DemoRunnerScreenState();
}

class _DemoRunnerScreenState extends State<DemoRunnerScreen> {
  late final List<_DemoStep> _steps;
  int _current = 0;
  bool _running = false;
  bool _autoPlaying = false;
  final List<String> _log = [];

  @override
  void initState() {
    super.initState();
    _steps = _buildSteps();
  }

  List<_DemoStep> _buildSteps() {
    return [
      _DemoStep(
        title: 'Select Ravi Kumar (PAT-1001) — high-risk cardiac case',
        description: 'A 62-year-old patient with chest discomfort and breathing difficulty, screened via the wearable patch.',
        run: (appState) async {
          appState.setActivePatientId('PAT-1001');
          await appState.refreshScreenings('PAT-1001');
          await appState.refreshTimeline('PAT-1001');
          final s = appState.latestScreeningFor('PAT-1001');
          return s != null
              ? 'Ravi Kumar screened at ${s.riskLevel} risk, score ${s.riskScore}/100.'
              : 'Ravi Kumar loaded — no screening on record yet.';
        },
      ),
      _DemoStep(
        title: 'Explain the AI risk score',
        description: 'Every score ships with the specific vitals/ECG/symptom reasons behind it — never a black box.',
        run: (appState) async {
          final s = appState.latestScreeningFor('PAT-1001');
          if (s == null) return 'No screening available to explain yet.';
          return 'Reasons: ${s.reasons.isEmpty ? "none" : s.reasons.join("; ")}';
        },
      ),
      _DemoStep(
        title: 'Generate a Smart Referral',
        description: 'High risk routes automatically to the appropriate care level and specialist.',
        run: (appState) async {
          final existing = appState.referralsFor('PAT-1001');
          if (existing.isNotEmpty) {
            return 'Referral already on file: ${existing.first.careLevel} → ${existing.first.specialist}.';
          }
          final s = appState.latestScreeningFor('PAT-1001');
          if (s == null) return 'Run screening before generating a referral.';
          final r = await appState.addReferral('PAT-1001', s.id, 'Auto-generated during hackathon demo.');
          return 'Referral generated: ${r.careLevel} → ${r.specialist} (${r.priority}).';
        },
      ),
      _DemoStep(
        title: 'Record a doctor review',
        description: 'A specialist reviews the referral and logs a clinical decision.',
        run: (appState) async {
          final s = appState.latestScreeningFor('PAT-1001');
          final review = await appState.addDoctorReview(
            'PAT-1001',
            'Reviewed remotely via telemedicine link. Recommend cardiology follow-up within 48 hours.',
            DoctorAction.refer,
            screeningId: s?.id,
          );
          return 'Doctor review recorded: "${review.action}" by ${review.doctorName}.';
        },
      ),
      _DemoStep(
        title: 'Switch to Meena (PAT-1002) — moderate-risk case',
        description: 'A 45-year-old patient with mild fever and fatigue — shows the middle of the risk spectrum.',
        run: (appState) async {
          appState.setActivePatientId('PAT-1002');
          await appState.refreshScreenings('PAT-1002');
          final s = appState.latestScreeningFor('PAT-1002');
          return s != null ? 'Meena screened at ${s.riskLevel} risk, score ${s.riskScore}/100.' : 'Meena loaded.';
        },
      ),
      _DemoStep(
        title: 'Switch to Arun (PAT-1003) — low-risk case',
        description: 'A 28-year-old patient with a minor complaint — shows the system correctly triaging low-priority cases.',
        run: (appState) async {
          appState.setActivePatientId('PAT-1003');
          await appState.refreshScreenings('PAT-1003');
          final s = appState.latestScreeningFor('PAT-1003');
          return s != null ? 'Arun screened at ${s.riskLevel} risk, score ${s.riskScore}/100.' : 'Arun loaded.';
        },
      ),
      _DemoStep(
        title: 'Verify the blockchain audit trail',
        description: 'Every action so far has been written as a transaction, chained block-to-block.',
        run: (appState) async {
          final result = await appState.verifyChain();
          return result['valid'] == true ? 'Chain verified: all blocks intact and correctly linked.' : 'Chain verification reported an issue: $result';
        },
      ),
      _DemoStep(
        title: 'Simulate tampering with Arun\'s record',
        description: 'A malicious edit bypassing the API is simulated directly against storage.',
        run: (appState) async {
          await appState.tamperRecord('PAT-1003');
          final integrity = await appState.checkIntegrity('PAT-1003');
          return integrity.verified
              ? 'Unexpected: integrity still verified after tamper simulation.'
              : 'Tamper detected — stored hash no longer matches the recomputed hash.';
        },
      ),
      _DemoStep(
        title: 'Restore Arun\'s record',
        description: 'The system can restore the last known-good version and re-verify.',
        run: (appState) async {
          await appState.restoreRecord('PAT-1003');
          final integrity = await appState.checkIntegrity('PAT-1003');
          return integrity.verified ? 'Record restored — integrity check now passes.' : 'Restore did not resolve the integrity check.';
        },
      ),
      _DemoStep(
        title: 'Simulate an unauthorized access attempt',
        description: 'An unrecognized user tries to view Ravi Kumar\'s record — RBAC should deny it.',
        run: (appState) async {
          final result = await appState.simulateUnauthorizedAccess('PAT-1001');
          return result['result'] == 'DENIED'
              ? 'Access correctly DENIED and logged as ACCESS_DENIED on the audit trail.'
              : 'Unexpected access result: $result';
        },
      ),
      _DemoStep(
        title: 'Run offline sync',
        description: 'Queued actions from offline operation are replayed to the backend.',
        run: (appState) async {
          final synced = await appState.syncNow();
          return 'Sync complete — $synced item(s) synced.';
        },
      ),
      _DemoStep(
        title: 'Review the full audit trail',
        description: 'The complete, tamper-evident transaction history across all three demo patients.',
        run: (appState) async {
          await appState.refreshBlockchain();
          return '${appState.blockchainTransactions.length} transaction(s) now on the audit trail.';
        },
      ),
    ];
  }

  Future<void> _runStep(int index) async {
    final appState = context.read<AppState>();
    setState(() => _running = true);
    try {
      final message = await _steps[index].run(appState);
      if (mounted) {
        setState(() {
          _log.add('${index + 1}. ${_steps[index].title} — $message');
          _current = index + 1;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _log.add('${index + 1}. ${_steps[index].title} — ERROR: $e');
          _current = index + 1;
        });
      }
    } finally {
      if (mounted) setState(() => _running = false);
    }
  }

  Future<void> _runAll() async {
    setState(() => _autoPlaying = true);
    for (var i = _current; i < _steps.length && _autoPlaying; i++) {
      await _runStep(i);
      await Future.delayed(const Duration(milliseconds: 400));
    }
    if (mounted) setState(() => _autoPlaying = false);
  }

  void _reset() {
    setState(() {
      _current = 0;
      _log.clear();
      _autoPlaying = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final done = _current >= _steps.length;

    return AppScaffold(
      currentRoute: '/demo',
      title: 'Demo Mode',
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const SectionHeader(
            title: 'Complete Hackathon Demo Mode',
            subtitle: 'A scripted walkthrough of the full EMD-TS story, end to end, using the seeded demo patients.',
          ),
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Step ${_current < _steps.length ? _current + 1 : _steps.length} of ${_steps.length}',
                        style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5)),
                    AppBadge(text: done ? 'COMPLETE' : 'IN PROGRESS', color: done ? AppColors.riskLow : AppColors.brand700, background: done ? AppColors.riskLowBg : AppColors.brand50),
                  ],
                ),
                const SizedBox(height: 10),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: _current / _steps.length,
                    backgroundColor: AppColors.slate100,
                    color: AppColors.brand600,
                    minHeight: 6,
                  ),
                ),
                const SizedBox(height: 14),
                if (!done) ...[
                  Text(_steps[_current].title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                  const SizedBox(height: 4),
                  Text(_steps[_current].description, style: const TextStyle(fontSize: 12.5, color: AppColors.slate500)),
                ] else
                  const Text(
                    'Demo complete — every module has been exercised: registration, live monitoring, explainable AI '
                    'screening, smart referral, doctor review, blockchain audit, tamper detection, unauthorized-access '
                    'denial, and offline sync.',
                    style: TextStyle(fontSize: 12.5, color: AppColors.riskLow, fontWeight: FontWeight.w600),
                  ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton(
                        onPressed: (_running || _autoPlaying || done) ? null : () => _runStep(_current),
                        child: Text(_running && !_autoPlaying ? 'Running…' : 'Run Next Step'),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: OutlinedButton(
                        onPressed: (_autoPlaying || done) ? null : _runAll,
                        child: Text(_autoPlaying ? 'Auto-playing…' : 'Run Full Demo'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                SizedBox(
                  width: double.infinity,
                  child: TextButton(onPressed: _reset, child: const Text('Reset Demo Script')),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Log', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5)),
                const SizedBox(height: 8),
                if (_log.isEmpty)
                  const Text('Run a step to see results here.', style: TextStyle(fontSize: 12, color: AppColors.slate400))
                else
                  ..._log.reversed.map(
                    (entry) => Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Text(entry, style: const TextStyle(fontSize: 11.5, color: AppColors.slate700, height: 1.4)),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
