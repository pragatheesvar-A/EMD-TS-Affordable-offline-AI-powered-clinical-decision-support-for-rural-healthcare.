import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/screening.dart';
import '../services/translations.dart';
import '../state/app_state.dart';
import '../theme/app_theme.dart';
import '../widgets/app_scaffold.dart';
import '../widgets/common.dart';

/// AI Clinical Copilot: turns the explainable screening result into a
/// short clinical note and a set of suggested follow-up questions for
/// the healthcare worker to ask, and demonstrates Tamil/English
/// multilingual symptom capture. All generated on-device from the
/// already-fetched ScreeningResult -- no separate backend endpoint is
/// required since the underlying data (vitals, reasons, findings) is
/// already explainable by design. Mirrors ClinicalCopilot.tsx.
class ClinicalCopilotScreen extends StatelessWidget {
  const ClinicalCopilotScreen({super.key});

  String _generateNote(String patientName, int age, String gender, ScreeningResult? result) {
    if (result == null) {
      return '$patientName ($age, $gender) has not yet completed an AI screening. '
          'Run a screening on the AI Screening tab to generate a clinical note.';
    }
    final reasonsText = result.reasons.isEmpty ? 'no significant abnormal findings' : result.reasons.join('; ');
    return '$patientName ($age, $gender) screened at ${result.riskLevel} risk (score ${result.riskScore}/100). '
        'Contributing factors: $reasonsText. ${result.recommendation}';
  }

  List<String> _suggestedQuestions(ScreeningResult? result) {
    if (result == null) {
      return const [
        'What symptoms are you experiencing today, and for how long?',
        'Do you have any known conditions such as diabetes, hypertension, or heart disease?',
        'Are you currently taking any medications?',
      ];
    }
    final questions = <String>[
      'Can you describe how the symptoms have changed since they started?',
      'Have you experienced anything like this before?',
    ];
    if (result.riskLevel == 'HIGH') {
      questions.insertAll(0, [
        'Are you experiencing chest pain, severe breathlessness, or fainting right now?',
        'Is there a family history of heart disease or sudden cardiac events?',
      ]);
    } else if (result.riskLevel == 'MODERATE') {
      questions.add('Have your symptoms affected your ability to do daily activities?');
    }
    questions.add('Are you allergic to any medications?');
    return questions;
  }

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();
    final patientId = appState.activePatientId;
    final patient = patientId != null ? appState.patientById(patientId) : null;

    if (patient == null) {
      return const AppScaffold(
        currentRoute: '/copilot',
        title: 'Clinical Copilot',
        body: Padding(
          padding: EdgeInsets.all(16),
          child: EmptyState(
            title: 'No active patient',
            subtitle: 'Select a patient from the Dashboard to use the Clinical Copilot.',
            icon: Icons.medical_information_outlined,
          ),
        ),
      );
    }

    final result = appState.latestScreeningFor(patient.id);
    final note = _generateNote(patient.name, patient.age, patient.gender, result);
    final questions = _suggestedQuestions(result);

    return AppScaffold(
      currentRoute: '/copilot',
      title: 'Clinical Copilot',
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          SectionHeader(
            title: 'Clinical Copilot',
            subtitle: 'Structured, explainable assistance for ${patient.name} — never a black-box diagnosis.',
          ),
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.description_outlined, size: 18, color: AppColors.brand600),
                    const SizedBox(width: 8),
                    const Text('AI-Generated Clinical Note', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5)),
                    const Spacer(),
                    if (result != null) RiskBadge(level: result.riskLevel),
                  ],
                ),
                const SizedBox(height: 10),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: AppColors.slate50, borderRadius: BorderRadius.circular(10)),
                  child: Text(note, style: const TextStyle(fontSize: 12.5, color: AppColors.slate700, height: 1.4)),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Generated from the deterministic AI risk-screening engine — every statement here traces back to a specific vital, ECG reading, or symptom keyword.',
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
                    Icon(Icons.help_outline, size: 18, color: AppColors.brand600),
                    SizedBox(width: 8),
                    Text('Suggested Questions', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5)),
                  ],
                ),
                const SizedBox(height: 10),
                ...questions.asMap().entries.map(
                      (entry) => Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              width: 20,
                              height: 20,
                              alignment: Alignment.center,
                              decoration: const BoxDecoration(color: AppColors.brand50, shape: BoxShape.circle),
                              child: Text('${entry.key + 1}', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.brand700)),
                            ),
                            const SizedBox(width: 8),
                            Expanded(child: Text(entry.value, style: const TextStyle(fontSize: 12.5, color: AppColors.slate700))),
                          ],
                        ),
                      ),
                    ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          const AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.translate, size: 18, color: AppColors.brand600),
                    SizedBox(width: 8),
                    Text('Multilingual Symptom Capture', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5)),
                  ],
                ),
                SizedBox(height: 10),
                _LangRow(label: 'English', text: MultilingualDemo.english),
                SizedBox(height: 6),
                _LangRow(label: 'Tamil (தமிழ்)', text: MultilingualDemo.tamil),
                SizedBox(height: 6),
                _LangRow(label: 'Transliteration', text: MultilingualDemo.transliteration),
                SizedBox(height: 10),
                Row(
                  children: [
                    AppBadge(text: 'Symptom: ${MultilingualDemo.symptom}', background: AppColors.brand50, color: AppColors.brand700),
                    SizedBox(width: 8),
                    AppBadge(text: 'Duration: ${MultilingualDemo.duration}', background: AppColors.brand50, color: AppColors.brand700),
                  ],
                ),
                SizedBox(height: 10),
                Text(
                  'A village-side health worker can record symptoms in Tamil, English, or a transliterated mix — the copilot understands all three for keyword-based risk scoring.',
                  style: TextStyle(fontSize: 11, color: AppColors.slate400),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _LangRow extends StatelessWidget {
  final String label;
  final String text;
  const _LangRow({required this.label, required this.text});

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 90,
          child: Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.slate500)),
        ),
        Expanded(child: Text(text, style: const TextStyle(fontSize: 12.5, color: AppColors.slate700))),
      ],
    );
  }
}
