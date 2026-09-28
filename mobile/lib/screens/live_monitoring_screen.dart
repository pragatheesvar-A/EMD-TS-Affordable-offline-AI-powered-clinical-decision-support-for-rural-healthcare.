import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../services/vitals_simulator.dart';
import '../state/app_state.dart';
import '../theme/app_theme.dart';
import '../widgets/app_scaffold.dart';
import '../widgets/common.dart';
import '../widgets/ecg_widget.dart';

/// Simulated "EMD-TS Wearable Patch" screen: connect/disconnect a fake
/// BLE sensor, stream simulated vitals every 2 seconds via
/// vitals_simulator.dart, and render a live animated ECG using
/// EcgWaveformWidget. Mirrors LiveMonitoring.tsx in the web prototype.
class LiveMonitoringScreen extends StatefulWidget {
  const LiveMonitoringScreen({super.key});

  @override
  State<LiveMonitoringScreen> createState() => _LiveMonitoringScreenState();
}

class _LiveMonitoringScreenState extends State<LiveMonitoringScreen> {
  Timer? _timer;
  String _mode = 'NORMAL';
  int _ecgResetSignal = 0;

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _startStreaming(AppState appState) {
    _timer?.cancel();
    appState.setLiveVitals(generateVitalsReading(_mode));
    _timer = Timer.periodic(const Duration(seconds: 2), (_) {
      appState.setLiveVitals(generateVitalsReading(_mode));
    });
  }

  void _stopStreaming() {
    _timer?.cancel();
    _timer = null;
  }

  void _connect(AppState appState) {
    appState.setWearableConnected(true);
    _startStreaming(appState);
  }

  void _disconnect(AppState appState) {
    appState.setWearableConnected(false);
    _stopStreaming();
  }

  void _setMode(AppState appState, String mode) {
    setState(() => _mode = mode);
    if (appState.wearableConnected) {
      _startStreaming(appState);
    }
  }

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();
    final patientId = appState.activePatientId;
    final patient = patientId != null ? appState.patientById(patientId) : null;

    if (patient == null) {
      return AppScaffold(
        currentRoute: '/monitoring',
        title: 'Live Monitoring',
        body: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              const SizedBox(height: 40),
              const EmptyState(
                title: 'No active patient',
                subtitle: 'Register a patient first to start live wearable monitoring.',
                icon: Icons.monitor_heart_outlined,
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

    final vitals = appState.liveVitals;

    return AppScaffold(
      currentRoute: '/monitoring',
      title: 'Live Monitoring',
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          SectionHeader(
            title: 'EMD-TS Wearable Patch',
            subtitle:
                'Simulated Bluetooth Low Energy patch for ${patient.name} — heart rate, SpO2, temperature, and single-lead ECG.',
          ),
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: appState.wearableConnected ? AppColors.riskLowBg : AppColors.slate100,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(
                        Icons.bluetooth_connected,
                        color: appState.wearableConnected ? AppColors.riskLow : AppColors.slate400,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            appState.wearableConnected ? 'Wearable Connected (BLE)' : 'Wearable Disconnected',
                            style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
                          ),
                          Text(
                            appState.wearableConnected
                                ? 'Streaming live vitals every 2 seconds'
                                : 'Tap connect to start streaming simulated vitals',
                            style: const TextStyle(fontSize: 12, color: AppColors.slate500),
                          ),
                        ],
                      ),
                    ),
                    ElevatedButton(
                      onPressed: () =>
                          appState.wearableConnected ? _disconnect(appState) : _connect(appState),
                      child: Text(appState.wearableConnected ? 'Disconnect' : 'Connect'),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                Wrap(
                  crossAxisAlignment: WrapCrossAlignment.center,
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    const Text('Demo Mode:', style: TextStyle(fontSize: 12.5, color: AppColors.slate600)),
                    ChoiceChip(
                      label: const Text('Normal'),
                      selected: _mode == 'NORMAL',
                      onSelected: (_) => _setMode(appState, 'NORMAL'),
                    ),
                    ChoiceChip(
                      label: const Text('High Risk'),
                      selected: _mode == 'HIGH_RISK',
                      onSelected: (_) => _setMode(appState, 'HIGH_RISK'),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: _VitalTile(
                  label: 'Heart Rate',
                  value: vitals != null ? vitals.heartRate.toStringAsFixed(0) : '--',
                  unit: 'bpm',
                  icon: Icons.favorite_outline,
                  tint: AppColors.riskHigh,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _VitalTile(
                  label: 'SpO2',
                  value: vitals != null ? vitals.spo2.toStringAsFixed(0) : '--',
                  unit: '%',
                  icon: Icons.air,
                  tint: AppColors.brand600,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _VitalTile(
                  label: 'Temp',
                  value: vitals != null ? vitals.temperature.toStringAsFixed(1) : '--',
                  unit: '°C',
                  icon: Icons.thermostat_outlined,
                  tint: AppColors.riskModerate,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Single-Lead ECG (Simulated)', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Text('Abnormal', style: TextStyle(fontSize: 11.5, color: AppColors.slate500)),
                        Switch(
                          value: appState.liveEcgAbnormal,
                          onChanged: (v) => appState.setLiveEcgAbnormal(v),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                EcgWaveformWidget(
                  running: appState.wearableConnected,
                  bpm: vitals?.heartRate ?? 78,
                  abnormal: appState.liveEcgAbnormal,
                  resetSignal: _ecgResetSignal,
                ),
                const SizedBox(height: 8),
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton.icon(
                    onPressed: () => setState(() => _ecgResetSignal++),
                    icon: const Icon(Icons.refresh, size: 16),
                    label: const Text('Reset trace'),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: vitals == null ? null : () => Navigator.of(context).pushNamed('/screening'),
              icon: const Icon(Icons.psychology_outlined, size: 18),
              label: const Text('Continue to AI Screening'),
            ),
          ),
          if (vitals == null) ...[
            const SizedBox(height: 8),
            const Text(
              'Connect the wearable to capture at least one vitals reading before running AI screening.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 11.5, color: AppColors.slate400),
            ),
          ],
        ],
      ),
    );
  }
}

class _VitalTile extends StatelessWidget {
  final String label;
  final String value;
  final String unit;
  final IconData icon;
  final Color tint;

  const _VitalTile({
    required this.label,
    required this.value,
    required this.unit,
    required this.icon,
    required this.tint,
  });

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: tint),
          const SizedBox(height: 6),
          Text(label, style: const TextStyle(fontSize: 11, color: AppColors.slate500)),
          const SizedBox(height: 2),
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(value, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: AppColors.slate900)),
              const SizedBox(width: 3),
              Text(unit, style: const TextStyle(fontSize: 11, color: AppColors.slate400)),
            ],
          ),
        ],
      ),
    );
  }
}
