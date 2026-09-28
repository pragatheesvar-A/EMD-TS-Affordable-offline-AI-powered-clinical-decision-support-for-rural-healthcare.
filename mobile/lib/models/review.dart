class DoctorReview {
  final String id;
  final String patientId;
  final String? screeningId;
  final String doctorName;
  final String notes;
  final String action; // Reviewed | Refer | Monitor | Additional Investigation
  final String createdAt;

  const DoctorReview({
    required this.id,
    required this.patientId,
    required this.screeningId,
    required this.doctorName,
    required this.notes,
    required this.action,
    required this.createdAt,
  });

  factory DoctorReview.fromJson(Map<String, dynamic> json) {
    return DoctorReview(
      id: json['id'] as String,
      patientId: json['patientId'] as String,
      screeningId: json['screeningId'] as String?,
      doctorName: json['doctorName'] as String,
      notes: json['notes'] as String,
      action: json['action'] as String,
      createdAt: json['createdAt'] as String,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'patientId': patientId,
        'screeningId': screeningId,
        'doctorName': doctorName,
        'notes': notes,
        'action': action,
        'createdAt': createdAt,
      };
}
