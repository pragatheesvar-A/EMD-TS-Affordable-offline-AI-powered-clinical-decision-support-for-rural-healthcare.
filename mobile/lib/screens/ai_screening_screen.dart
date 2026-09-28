import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/patient.dart';
import '../models/screening.dart';
import '../services/api_service.dart';
import '../services/vitals_simulator.dart';
import '../services/voice_messages.dart';
import '../services/voice_service.dart';
import '../state/app_state.dart';
import '../theme/app_theme.dart';
import '../widgets/app_scaffold.dart';
import '../widgets/common.dart';

/// Runs the explainable AI risk-screening engine against the patient's
/// current vitals + ECG reading, then renders the risk score, reasons,
/// per-module results, and speaks offline voice alerts in English/Tamil.
class AiScreeningScreen extends StatefulWidget {
  const AiScreeningScreen({super.key});

  @override
  State<AiScreeningScreen> createState() => _AiScreeningScreenState();
}

class _AiScreeningScreenState extends State<AiScreeningScreen> {
  final VoiceService _voiceService = VoiceService();
  bool _running = false;
  String? _error;
  String _selectedLangCode = 'en';
  bool _isSpeaking = false;
  String? _ttsNotice;
  String? _lastAutoSpokenScreeningId;

  @override
  void initState() {
    super.initState();
    _initVoiceService();
  }

  Future<void> _initVoiceService() async {
    await _voiceService.initialize(
      initialLangCode: _selectedLangCode,
      onSpeechStart: () {
        if (mounted) setState(() => _isSpeaking = true);
      },
      onSpeechDone: () {
        if (mounted) setState(() => _isSpeaking = false);
      },
      onSpeechError: (msg) {
        if (mounted) {
          setState(() {
            _isSpeaking = false;
            _ttsNotice = 'Voice error: $msg';
          });
        }
      },
    );
  }

  @override
  void dispose() {
    _voiceService.dispose();
    super.dispose();
  }

  bool _isChestPainContext(Patient patient, ScreeningResult result) {
    final sym = patient.symptoms.toLowerCase();
    final hasChestSymptom = sym.contains('chest') || sym.contains('pain') || sym.contains('angina');
    final hasChestReason = result.reasons.any(
      (r) => r.toLowerCase().contains('chest') ||
          r.toLowerCase().contains('ecg') ||
          r.toLowerCase().contains('infarction') ||
          r.toLowerCase().contains('st elevation'),
    );
    return hasChestSymptom || hasChestReason;
  }

  Future<void> _speakResult(Patient patient, ScreeningResult result, {bool isAuto = false}) async {
    final isChestPain = _isChestPainContext(patient, result);

    // Check offline language pack availability
    final isInstalled = await _voiceService.isLanguageInstalled(_selectedLangCode);
    if (!isInstalled && _selectedLangCode == 'ta') {
      if (mounted) {
        setState(() {
          _ttsNotice =
              'Tamil offline voice is not installed on this device. Speaking in English fallback or install the Tamil voice pack in Android Settings.';
        });
      }
    } else {
      if (mounted && _ttsNotice != null) {
        setState(() => _ttsNotice = null);
      }
    }

    await _voiceService.speakRiskAlert(
      riskLevel: result.riskLevel,
      isChestPain: isChestPain,
      langCode: _selectedLangCode,
    );
  }

  Future<void> _stopSpeaking() async {
    await _voiceService.stop();
    if (mounted) setState(() => _isSpeaking = false);
  }

  Future<void> _runScreening(AppState appState, Patient patient) async {
    setState(() {
      _running = true;
      _error = null;
      _ttsNotice = null;
    });

    try {
      final vitals = appState.liveVitals ?? generateVitalsReading('NORMAL');
      final result = await appState.runScreening(patient.id, vitals, appState.liveEcgAbnormal);

      // Auto-trigger voice alert once for High Risk or Chest Pain results
      if (result.riskLevel == 'HIGH' || _isChestPainContext(patient, result)) {
        if (_lastAutoSpokenScreeningId != result.id) {
          _lastAutoSpokenScreeningId = result.id;
          Future.delayed(const Duration(milliseconds: 400), () {
            if (mounted) {
              _speakResult(patient, result, isAuto: true);
            }
          });
        }
      }
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = 'Screening failed: ${e.message}');
    } catch (e) {
      if (mounted) setState(() => _error = 'Screening failed. Check the backend connection in Settings.');
    } finally {
      if (mounted) setState(() => _running = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();
    final patientId = appState.activePatientId;
    final patient = patientId != null ? appState.patientById(patientId) : null;

    if (patient == null) {
      return AppScaffold(
        currentRoute: '/screening',
        title: 'AI Screening',
        body: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              const SizedBox(height: 40),
              const EmptyState(
                title: 'No active patient',
                subtitle: 'Register a patient and connect the wearable before running AI screening.',
                icon: Icons.psychology_outlined,
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => Navigator.of(context).pushNamed('/registration'),
                child: const Text('Register a Patient'),
              ),
            ],
          ),
        ),
      );
    }

    final result = appState.latestScreeningFor(patient.id);

    return AppScaffold(
      currentRoute: '/screening',
      title: 'AI Screening',
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          SectionHeader(
            title: 'AI-Assisted Risk Screening',
            subtitle: 'Explainable rule-based screening for ${patient.name} — with offline voice guidance.',
          ),
          AppCard(
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Latest Vitals Snapshot', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5)),
                      const SizedBox(height: 6),
                      Text(
                        appState.liveVitals != null
                            ? 'HR ${appState.liveVitals!.heartRate.toStringAsFixed(0)} bpm · '
                                'SpO2 ${appState.liveVitals!.spo2.toStringAsFixed(0)}% · '
                                'Temp ${appState.liveVitals!.temperature.toStringAsFixed(1)}°C · '
                                'ECG ${appState.liveEcgAbnormal ? "Abnormal" : "Normal"}'
                            : 'No live reading yet — connect the wearable on Live Monitoring, or run with default normal vitals.',
                        style: const TextStyle(fontSize: 12, color: AppColors.slate500),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          if (_error != null) ...[
            Text(_error!, style: const TextStyle(color: AppColors.riskHigh, fontSize: 12.5)),
            const SizedBox(height: 10),
          ],
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _running ? null : () => _runScreening(appState, patient),
              icon: _running
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Icon(Icons.psychology_outlined, size: 18),
              label: Text(_running ? 'Analyzing…' : (result == null ? 'Run AI Screening' : 'Re-run AI Screening')),
            ),
          ),
          if (result != null) ...[
            const SizedBox(height: 16),

            // Voice Assistant Accessibility Card
            AppCard(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: _isSpeaking ? const Color(0xFFDCFCE7) : AppColors.brand50,
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          _isSpeaking ? Icons.volume_up : Icons.record_voice_over_outlined,
                          size: 18,
                          color: _isSpeaking ? const Color(0xFF16A34A) : AppColors.brand700,
                        ),
                      ),
                      const SizedBox(width: 8),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Offline Voice Assistant',
                              style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5),
                            ),
                            Text(
                              'On-device synthesized voice (No internet needed)',
                              style: TextStyle(fontSize: 11, color: AppColors.slate500),
                            ),
                          ],
                        ),
                      ),
                      // Language Selector Dropdown
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8),
                        decoration: BoxDecoration(
                          color: AppColors.slate100,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: DropdownButtonHideUnderline(
                          child: DropdownButton<String>(
                            value: _selectedLangCode,
                            isDense: true,
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.slate900),
                            items: kSupportedVoiceLanguages.map((l) {
                              return DropdownMenuItem<String>(
                                value: l.code,
                                child: Text('${l.flagEmoji} ${l.nativeName}'),
                              );
                            }).toList(),
                            onChanged: (newLang) {
                              if (newLang != null) {
                                setState(() {
                                  _selectedLangCode = newLang;
                                  _ttsNotice = null;
                                });
                                _voiceService.setLanguage(newLang);
                              }
                            },
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  if (_ttsNotice != null) ...[
                    Container(
                      padding: const EdgeInsets.all(8),
                      margin: const EdgeInsets.only(bottom: 10),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFFBEB),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: const Color(0xFFFDE68A)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.info_outline, size: 14, color: Color(0xFFD97706)),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              _ttsNotice!,
                              style: const TextStyle(fontSize: 11, color: Color(0xFF92400E)),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: () => _speakResult(patient, result),
                          icon: Icon(
                            _lastAutoSpokenScreeningId == result.id ? Icons.replay : Icons.volume_up,
                            size: 16,
                          ),
                          label: Text(
                            _lastAutoSpokenScreeningId == result.id ? 'Hear Again' : 'Hear Result',
                            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: _isSpeaking ? const Color(0xFF16A34A) : AppColors.brand600,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 10),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                        ),
                      ),
                      if (_isSpeaking) ...[
                        const SizedBox(width: 8),
                        OutlinedButton.icon(
                          onPressed: _stopSpeaking,
                          icon: const Icon(Icons.stop, size: 16, color: AppColors.riskHigh),
                          label: const Text('Stop Voice', style: TextStyle(color: AppColors.riskHigh, fontSize: 13)),
                          style: OutlinedButton.styleFrom(
                            side: const BorderSide(color: AppColors.riskHigh),
                            padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 14),
            _RiskGaugeCard(result: result),
            const SizedBox(height: 14),
            AppCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Why this score? (Explainability)', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5)),
                  const SizedBox(height: 10),
                  if (result.reasons.isEmpty)
                    const Text('No contributing risk factors detected.', style: TextStyle(fontSize: 12.5, color: AppColors.slate500))
                  else
                    ...result.reasons.map(
                      (r) => Padding(
                        padding: const EdgeInsets.only(bottom: 6),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Padding(
                              padding: EdgeInsets.only(top: 3),
                              child: Icon(Icons.circle, size: 6, color: AppColors.brand600),
                            ),
                            const SizedBox(width: 8),
                            Expanded(child: Text(r, style: const TextStyle(fontSize: 12.5, color: AppColors.slate700))),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
            ),
            if (result.findings.isNotEmpty) ...[
              const SizedBox(height: 14),
              AppCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Findings', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5)),
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: result.findings
                          .map((f) => AppBadge(
                                text: f.label,
                                color: AppColors.riskColor(f.severity),
                                background: AppColors.riskBgColor(f.severity),
                              ))
                          .toList(),
                    ),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 14),
            AppCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Multi-Module Analysis', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5)),
                  const SizedBox(height: 10),
                  _ModuleRow(label: 'Vital Sign Analysis', value: result.moduleResults.vitalSignAnalysis),
                  _ModuleRow(label: 'ECG Analysis', value: result.moduleResults.ecgAnalysis),
                  _ModuleRow(label: 'Heart Sound Analysis', value: result.moduleResults.heartSoundAnalysis),
                  _ModuleRow(label: 'Lung Sound Analysis', value: result.moduleResults.lungSoundAnalysis),
                  _ModuleRow(label: 'Trend Analysis', value: result.moduleResults.trendAnalysis),
                ],
              ),
            ),
            const SizedBox(height: 14),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(color: AppColors.brand50, borderRadius: BorderRadius.circular(12)),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Recommendation', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5, color: AppColors.brand800)),
                  const SizedBox(height: 6),
                  Text(result.recommendation, style: const TextStyle(fontSize: 12.5, color: AppColors.slate700)),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => Navigator.of(context).pushNamed('/timeline'),
                    icon: const Icon(Icons.history_outlined, size: 18),
                    label: const Text('View Timeline'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () => Navigator.of(context).pushNamed('/referral'),
                    icon: const Icon(Icons.send_outlined, size: 18),
                    label: const Text('Smart Referral'),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

class _RiskGaugeCard extends StatelessWidget {
  final ScreeningResult result;

  const _RiskGaugeCard({required this.result});

  @override
  Widget build(BuildContext context) {
    final level = result.riskLevel;
    final score = result.riskScore;
    final color = AppColors.riskColor(level);
    final bg = AppColors.riskBgColor(level);

    return AppCard(
      child: Row(
        children: [
          Container(
            width: 84,
            height: 84,
            alignment: Alignment.center,
            decoration: BoxDecoration(color: bg, shape: BoxShape.circle, border: Border.all(color: color, width: 3)),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text('$score', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: color)),
                const Text('/ 100', style: TextStyle(fontSize: 10, color: AppColors.slate500)),
              ],
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                RiskBadge(level: level),
                const SizedBox(height: 6),
                const Text(
                  'Score is computed from vitals, ECG, symptom keywords, and short-term trends by a deterministic rule engine.',
                  style: TextStyle(fontSize: 11.5, color: AppColors.slate500),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ModuleRow extends StatelessWidget {
  final String label;
  final String value;
  const _ModuleRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 12.5, color: AppColors.slate600)),
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.check_circle, size: 14, color: AppColors.riskLow),
              const SizedBox(width: 4),
              Text(value, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.slate700)),
            ],
          ),
        ],
      ),
    );
  }
}
