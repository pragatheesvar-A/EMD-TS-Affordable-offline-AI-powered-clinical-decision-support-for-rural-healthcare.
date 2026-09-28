import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/timeline_event.dart';
import '../state/app_state.dart';
import '../theme/app_theme.dart';
import '../widgets/app_scaffold.dart';
import '../widgets/common.dart';
import '../widgets/trend_chart.dart';

/// Chronological record for one patient: registration, screenings,
/// referrals, and doctor reviews, plus a trend chart of vitals across
/// every screening. Mirrors PatientTimeline.tsx.
class PatientTimelineScreen extends StatefulWidget {
  const PatientTimelineScreen({super.key});

  @override
  State<PatientTimelineScreen> createState() => _PatientTimelineScreenState();
}

class _PatientTimelineScreenState extends State<PatientTimelineScreen> {
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    final appState = context.read<AppState>();
    final patientId = appState.activePatientId;
    if (patientId == null) return;
    setState(() => _loading = true);
    await Future.wait([
      appState.refreshTimeline(patientId),
      appState.refreshScreenings(patientId),
      appState.refreshReferrals(patientId),
      appState.refreshReviews(patientId),
    ]);
    if (mounted) setState(() => _loading = false);
  }

  IconData _iconFor(String type) {
    switch (type) {
      case 'REGISTRATION':
        return Icons.person_add_alt_outlined;
      case 'SCREENING':
        return Icons.psychology_outlined;
      case 'REFERRAL':
        return Icons.send_outlined;
      case 'DOCTOR_REVIEW':
        return Icons.assignment_ind_outlined;
      case 'CONSENT':
        return Icons.verified_user_outlined;
      case 'VISIT':
        return Icons.local_hospital_outlined;
      default:
        return Icons.circle_outlined;
    }
  }

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();
    final patientId = appState.activePatientId;
    final patient = patientId != null ? appState.patientById(patientId) : null;

    if (patient == null) {
      return const AppScaffold(
        currentRoute: '/timeline',
        title: 'Patient Timeline',
        body: Padding(
          padding: EdgeInsets.all(16),
          child: EmptyState(
            title: 'No active patient',
            subtitle: 'Select a patient from the Dashboard to view their timeline.',
            icon: Icons.history_outlined,
          ),
        ),
      );
    }

    final events = List<TimelineEvent>.from(appState.timelineFor(patient.id))
      ..sort((a, b) => b.timestamp.compareTo(a.timestamp));
    final screenings = List.of(appState.screeningsFor(patient.id)).reversed.toList();

    return AppScaffold(
      currentRoute: '/timeline',
      title: 'Patient Timeline',
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            SectionHeader(title: patient.name, subtitle: '${patient.age} yrs · ${patient.gender} · ${patient.village}'),
            AppCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Patient Record', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5)),
                      AppBadge(text: patient.id, background: AppColors.brand50, color: AppColors.brand700),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text('Phone: ${patient.phone}', style: const TextStyle(fontSize: 12, color: AppColors.slate600)),
                  const SizedBox(height: 3),
                  Text('Symptoms: ${patient.symptoms}', style: const TextStyle(fontSize: 12, color: AppColors.slate600)),
                  const SizedBox(height: 3),
                  Text('Known Conditions: ${patient.knownConditions}', style: const TextStyle(fontSize: 12, color: AppColors.slate600)),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(Icons.shield_outlined, size: 14, color: AppColors.slate400),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          'Record hash: ${patient.recordHash.isEmpty ? "-" : "${patient.recordHash.substring(0, 16)}…"}',
                          style: const TextStyle(fontSize: 11, color: AppColors.slate400),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            if (screenings.length >= 2) ...[
              const SizedBox(height: 14),
              AppCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Vitals Trend', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5)),
                    const SizedBox(height: 12),
                    TrendChart(
                      series: [
                        TrendSeries(
                          label: 'Heart Rate',
                          color: AppColors.riskHigh,
                          values: screenings.map((s) => s.vitals.heartRate).toList(),
                        ),
                        TrendSeries(
                          label: 'SpO2',
                          color: AppColors.brand600,
                          values: screenings.map((s) => s.vitals.spo2).toList(),
                        ),
                      ],
                      xLabels: List.generate(screenings.length, (i) => '#${i + 1}'),
                    ),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 14),
            AppCard(
              padding: const EdgeInsets.symmetric(vertical: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 16),
                    child: Text('Event History', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5)),
                  ),
                  const SizedBox(height: 8),
                  if (_loading)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 24),
                      child: Center(child: CircularProgressIndicator()),
                    )
                  else if (events.isEmpty)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 24),
                      child: EmptyState(title: 'No events yet', subtitle: 'Timeline events appear as this patient is screened and reviewed.'),
                    )
                  else
                    ...events.map(
                      (e) => ListTile(
                        leading: Container(
                          width: 34,
                          height: 34,
                          alignment: Alignment.center,
                          decoration: BoxDecoration(color: AppColors.brand50, borderRadius: BorderRadius.circular(10)),
                          child: Icon(_iconFor(e.type), size: 16, color: AppColors.brand700),
                        ),
                        title: Text(e.summary, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                        subtitle: Text(e.timestamp, style: const TextStyle(fontSize: 11, color: AppColors.slate400)),
                        trailing: AppBadge(text: e.type.replaceAll('_', ' ')),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
