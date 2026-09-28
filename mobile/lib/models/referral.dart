class ReferralRecord {
  final String id;
  final String patientId;
  final String createdAt;
  final String priority; // LOW | MODERATE | HIGH
  final String careLevel;
  final String specialist;
  final String reason;
  final String note;

  const ReferralRecord({
    required this.id,
    required this.patientId,
    required this.createdAt,
    required this.priority,
    required this.careLevel,
    required this.specialist,
    required this.reason,
    required this.note,
  });

  factory ReferralRecord.fromJson(Map<String, dynamic> json) {
    return ReferralRecord(
      id: json['id'] as String,
      patientId: json['patientId'] as String,
      createdAt: json['createdAt'] as String,
      priority: json['priority'] as String,
      careLevel: json['careLevel'] as String,
      specialist: json['specialist'] as String,
      reason: json['reason'] as String,
      note: json['note'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'patientId': patientId,
        'createdAt': createdAt,
        'priority': priority,
        'careLevel': careLevel,
        'specialist': specialist,
        'reason': reason,
        'note': note,
      };
}
