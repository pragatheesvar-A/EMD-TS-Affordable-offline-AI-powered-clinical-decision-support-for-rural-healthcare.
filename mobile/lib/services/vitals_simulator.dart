import 'dart:math';
import '../models/vitals.dart';

class VitalsPreset {
  final double heartRate;
  final double spo2;
  final double temperature;
  const VitalsPreset({required this.heartRate, required this.spo2, required this.temperature});
}

const Map<String, VitalsPreset> vitalsPresets = {
  'NORMAL': VitalsPreset(heartRate: 78, spo2: 98, temperature: 36.8),
  'HIGH_RISK': VitalsPreset(heartRate: 118, spo2: 88, temperature: 38.5),
};

final _random = Random();

double _jitter(double base, double spread) {
  return base + (_random.nextDouble() * 2 - 1) * spread;
}

VitalsReading generateVitalsReading(String mode) {
  final preset = vitalsPresets[mode] ?? vitalsPresets['NORMAL']!;
  final isNormal = mode == 'NORMAL';
  final heartRate = (_jitter(preset.heartRate, isNormal ? 3 : 4)).roundToDouble();
  final spo2 = _jitter(preset.spo2, isNormal ? 1 : 1.5).clamp(0, 100).roundToDouble();
  final temperature = double.parse(_jitter(preset.temperature, 0.15).toStringAsFixed(1));
  return VitalsReading(
    timestamp: DateTime.now().toUtc().toIso8601String(),
    heartRate: heartRate,
    spo2: spo2,
    temperature: temperature,
    activity: isNormal ? 'Resting' : 'Light Activity',
    mode: mode,
  );
}
