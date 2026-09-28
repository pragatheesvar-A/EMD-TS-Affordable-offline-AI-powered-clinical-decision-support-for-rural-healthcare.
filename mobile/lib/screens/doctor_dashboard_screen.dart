import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/enums.dart';
import '../models/patient.dart';
import '../services/api_service.dart';
import '../state/app_state.dart';
import '../theme/app_theme.dart';
import '../widgets/app_scaffold.dart';
import '../widgets/common.dart';

/// Doctor / specialist worklist: every patient with their latest risk
/// level, with a quick action to record a doctor review (Reviewed /
/// Refer / Monitor / Additional Investigation). Mirrors
/// DoctorDashboard.tsx.
class DoctorDashboardScreen extends StatefulWidget {
  const DoctorDashboardScreen({super.key});

  @override
  State<DoctorDashboardScreen> createState() => _DoctorDashboardScreenState();
}

class _DoctorDashboardScreenState extends State<DoctorDashboardScreen> {
  bool _highPriorityOnly = false;

  Future<void> _openReviewSheet(BuildContext context, AppState appState, Patient patient) async {
    final notesController = TextEditingController();
    DoctorAction selectedAction = DoctorAction.reviewed;
    bool submitting = false;
    String? error;

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (sheetContext) {
        return StatefulBuilder(
          builder: (sheetContext, setSheetState) {
            final screening = appState.latestScreeningFor(patient.id);
            return Padding(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 20,
                bottom: MediaQuery.of(sheetContext).viewInsets.bottom + 20,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Review — ${patient.name}', style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                  const SizedBox(height: 4),
                  if (screening != null)
                    Text(
                      'Latest score: ${screening.riskScore}/100 (${screening.riskLevel})',
                      style: const TextStyle(fontSize: 12, color: AppColors.slate500),
                    ),
                  const SizedBox(height: 14),
                  const Text('Action', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.slate600)),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: DoctorAction.values.map((a) {
                      final selected = a == selectedAction;
                      return ChoiceChip(
                        label: Text(a.label),
                        selected: selected,
                        onSelected: (_) => setSheetState(() => selectedAction = a),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 14),
                  const Text('Notes', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.slate600)),
                  const SizedBox(height: 8),
                  TextField(
                    controller: notesController,
                    maxLines: 3,
                    decoration: const InputDecoration(hintText: 'Clinical notes for this review…'),
                  ),
                  if (error != null) ...[
                    const SizedBox(height: 8),
                    Text(error!, style: const TextStyle(color: AppColors.riskHigh, fontSize: 12.5)),
                  ],
                  const SizedBox(height: 14),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: submitting
                          ? null
                          : () async {
                              if (notesController.text.trim().isEmpty) {
                                setSheetState(() => error = 'Notes are required for a doctor review.');
                                return;
                              }
                              setSheetState(() {
                                submitting = true;
                                error = null;
                              });
                              try {
                                await appState.addDoctorReview(
                                  patient.id,
                                  notesController.text.trim(),
                                  selectedAction,
                                  screeningId: screening?.id,
                                );
                                if (sheetContext.mounted) Navigator.of(sheetContext).pop();
                              } on ApiException catch (e) {
                                setSheetState(() {
                                  submitting = false;
                                  error = 'Could not save review: ${e.message}';
                                });
                              } catch (e) {
                                setSheetState(() {
                                  submitting = false;
                                  error = 'Could not save review. Check the backend connection.';
                                });
                              }
                            },
                      child: Text(submitting ? 'Saving…' : 'Save Review'),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();
    var patients = List.of(appState.patients);

    patients.sort((a, b) {
      final ra = appState.latestScreeningFor(a.id)?.riskScore ?? -1;
      final rb = appState.latestScreeningFor(b.id)?.riskScore ?? -1;
      return rb.compareTo(ra);
    });

    if (_highPriorityOnly) {
      patients = patients.where((p) => appState.latestScreeningFor(p.id)?.riskLevel == 'HIGH').toList();
    }

    return AppScaffold(
      currentRoute: '/doctor',
      title: 'Doctor Dashboard',
      body: RefreshIndicator(
        onRefresh: () => appState.refreshPatients(),
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            SectionHeader(
              title: 'Doctor Worklist',
              subtitle: 'Reviewing as ${appState.currentRole.displayName}. Sorted by risk score, highest first.',
              action: FilterChip(
                label: const Text('High Priority Only'),
                selected: _highPriorityOnly,
                onSelected: (v) => setState(() => _highPriorityOnly = v),
              ),
            ),
            if (patients.isEmpty)
              const AppCard(child: EmptyState(title: 'No patients found', subtitle: 'Register patients or adjust the filter above.'))
            else
              ...patients.map((p) {
                final screening = appState.latestScreeningFor(p.id);
                final reviewCount = appState.reviewsFor(p.id).length;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: AppCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            CircleAvatar(
                              backgroundColor: AppColors.brand50,
                              child: Text(
                                p.name.isNotEmpty ? p.name[0] : '?',
                                style: const TextStyle(color: AppColors.brand700, fontWeight: FontWeight.w700),
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(p.name, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
                                  Text('${p.age} yrs · ${p.gender} · ${p.village}', style: const TextStyle(fontSize: 11.5, color: AppColors.slate500)),
                                ],
                              ),
                            ),
                            screening != null ? RiskBadge(level: screening.riskLevel) : const AppBadge(text: 'Not screened'),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Text(p.symptoms, style: const TextStyle(fontSize: 12.5, color: AppColors.slate700)),
                        const SizedBox(height: 10),
                        Row(
                          children: [
                            const Icon(Icons.assignment_ind_outlined, size: 14, color: AppColors.slate400),
                            const SizedBox(width: 4),
                            Text('$reviewCount review${reviewCount == 1 ? '' : 's'}', style: const TextStyle(fontSize: 11.5, color: AppColors.slate400)),
                            const Spacer(),
                            TextButton(
                              onPressed: () {
                                appState.setActivePatientId(p.id);
                                Navigator.of(context).pushNamed('/payment');
                              },
                              child: const Text('Pay Fee'),
                            ),
                            TextButton(
                              onPressed: () {
                                appState.setActivePatientId(p.id);
                                Navigator.of(context).pushNamed('/timeline');
                              },
                              child: const Text('Timeline'),
                            ),
                            ElevatedButton(
                              onPressed: () {
                                appState.setActivePatientId(p.id);
                                _openReviewSheet(context, appState, p);
                              },
                              child: const Text('Review'),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                );
              }),
          ],
        ),
      ),
    );
  }
}
