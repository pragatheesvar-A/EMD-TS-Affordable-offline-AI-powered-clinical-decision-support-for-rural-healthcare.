import 'patient.dart';

class RecentPatient {
  final Patient patient;
  final String? latestRiskLevel;

  const RecentPatient({required this.patient, required this.latestRiskLevel});

  factory RecentPatient.fromJson(Map<String, dynamic> json) {
    return RecentPatient(
      patient: Patient.fromJson(json),
      latestRiskLevel: json['latestRiskLevel'] as String?,
    );
  }
}

class DashboardSummary {
  final int patientsToday;
  final int activeMonitoring;
  final int highPriority;
  final int pendingReferrals;
  final List<RecentPatient> recentPatients;

  const DashboardSummary({
    required this.patientsToday,
    required this.activeMonitoring,
    required this.highPriority,
    required this.pendingReferrals,
    required this.recentPatients,
  });

  factory DashboardSummary.empty() => const DashboardSummary(
        patientsToday: 0,
        activeMonitoring: 0,
        highPriority: 0,
        pendingReferrals: 0,
        recentPatients: [],
      );

  factory DashboardSummary.fromJson(Map<String, dynamic> json) {
    return DashboardSummary(
      patientsToday: (json['patientsToday'] as num?)?.toInt() ?? 0,
      activeMonitoring: (json['activeMonitoring'] as num?)?.toInt() ?? 0,
      highPriority: (json['highPriority'] as num?)?.toInt() ?? 0,
      pendingReferrals: (json['pendingReferrals'] as num?)?.toInt() ?? 0,
      recentPatients: (json['recentPatients'] as List<dynamic>? ?? [])
          .map((e) => RecentPatient.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}
