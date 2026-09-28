class VitalsReading {
  final String timestamp;
  final double heartRate;
  final double spo2;
  final double temperature;
  final String activity;
  final String mode; // NORMAL | HIGH_RISK

  const VitalsReading({
    required this.timestamp,
    required this.heartRate,
    required this.spo2,
    required this.temperature,
    required this.activity,
    required this.mode,
  });

  factory VitalsReading.fromJson(Map<String, dynamic> json) {
    return VitalsReading(
      timestamp: json['timestamp'] as String? ?? DateTime.now().toIso8601String(),
      heartRate: (json['heartRate'] as num).toDouble(),
      spo2: (json['spo2'] as num).toDouble(),
      temperature: (json['temperature'] as num).toDouble(),
      activity: json['activity'] as String? ?? 'Resting',
      mode: json['mode'] as String? ?? 'NORMAL',
    );
  }

  Map<String, dynamic> toJson() => {
        'timestamp': timestamp,
        'heartRate': heartRate,
        'spo2': spo2,
        'temperature': temperature,
        'activity': activity,
        'mode': mode,
      };
}
