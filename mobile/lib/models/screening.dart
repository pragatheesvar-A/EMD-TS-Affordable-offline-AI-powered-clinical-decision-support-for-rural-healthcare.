import 'vitals.dart';

class ScreeningFinding {
  final String code;
  final String label;
  final String severity;

  const ScreeningFinding({required this.code, required this.label, required this.severity});

  factory ScreeningFinding.fromJson(Map<String, dynamic> json) {
    return ScreeningFinding(
      code: json['code'] as String,
      label: json['label'] as String,
      severity: json['severity'] as String,
    );
  }

  Map<String, dynamic> toJson() => {'code': code, 'label': label, 'severity': severity};
}

class ModuleResults {
  final String vitalSignAnalysis;
  final String ecgAnalysis;
  final String heartSoundAnalysis;
  final String lungSoundAnalysis;
  final String trendAnalysis;

  const ModuleResults({
    required this.vitalSignAnalysis,
    required this.ecgAnalysis,
    required this.heartSoundAnalysis,
    required this.lungSoundAnalysis,
    required this.trendAnalysis,
  });

  factory ModuleResults.fromJson(Map<String, dynamic> json) {
    return ModuleResults(
      vitalSignAnalysis: json['vitalSignAnalysis'] as String? ?? 'Completed',
      ecgAnalysis: json['ecgAnalysis'] as String? ?? 'Completed',
      heartSoundAnalysis: json['heartSoundAnalysis'] as String? ?? 'Completed',
      lungSoundAnalysis: json['lungSoundAnalysis'] as String? ?? 'Completed',
      trendAnalysis: json['trendAnalysis'] as String? ?? 'Completed',
    );
  }

  Map<String, dynamic> toJson() => {
        'vitalSignAnalysis': vitalSignAnalysis,
        'ecgAnalysis': ecgAnalysis,
        'heartSoundAnalysis': heartSoundAnalysis,
        'lungSoundAnalysis': lungSoundAnalysis,
        'trendAnalysis': trendAnalysis,
      };
}

class ScreeningResult {
  final String id;
  final String patientId;
  final String timestamp;
  final int riskScore;
  final String riskLevel; // LOW | MODERATE | HIGH
  final List<ScreeningFinding> findings;
  final List<String> reasons;
  final VitalsReading vitals;
  final bool ecgAbnormal;
  final ModuleResults moduleResults;
  final String recommendation;

  const ScreeningResult({
    required this.id,
    required this.patientId,
    required this.timestamp,
    required this.riskScore,
    required this.riskLevel,
    required this.findings,
    required this.reasons,
    required this.vitals,
    required this.ecgAbnormal,
    required this.moduleResults,
    required this.recommendation,
  });

  factory ScreeningResult.fromJson(Map<String, dynamic> json) {
    return ScreeningResult(
      id: json['id'] as String,
      patientId: json['patientId'] as String,
      timestamp: json['timestamp'] as String,
      riskScore: (json['riskScore'] as num).toInt(),
      riskLevel: json['riskLevel'] as String,
      findings: (json['findings'] as List<dynamic>? ?? [])
          .map((f) => ScreeningFinding.fromJson(f as Map<String, dynamic>))
          .toList(),
      reasons: (json['reasons'] as List<dynamic>? ?? []).map((r) => r as String).toList(),
      vitals: VitalsReading.fromJson(json['vitals'] as Map<String, dynamic>),
      ecgAbnormal: json['ecgAbnormal'] as bool? ?? false,
      moduleResults: ModuleResults.fromJson(
        (json['moduleResults'] as Map<String, dynamic>?) ?? const {},
      ),
      recommendation: json['recommendation'] as String,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'patientId': patientId,
        'timestamp': timestamp,
        'riskScore': riskScore,
        'riskLevel': riskLevel,
        'findings': findings.map((f) => f.toJson()).toList(),
        'reasons': reasons,
        'vitals': vitals.toJson(),
        'ecgAbnormal': ecgAbnormal,
        'moduleResults': moduleResults.toJson(),
        'recommendation': recommendation,
      };
}
