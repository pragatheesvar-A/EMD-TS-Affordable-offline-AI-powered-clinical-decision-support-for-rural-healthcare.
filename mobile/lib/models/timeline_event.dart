class TimelineEvent {
  final String id;
  final String patientId;
  final String timestamp;
  final String type; // REGISTRATION | VISIT | SCREENING | REFERRAL | DOCTOR_REVIEW | CONSENT
  final String summary;
  final Map<String, dynamic>? data;

  const TimelineEvent({
    required this.id,
    required this.patientId,
    required this.timestamp,
    required this.type,
    required this.summary,
    this.data,
  });

  factory TimelineEvent.fromJson(Map<String, dynamic> json) {
    return TimelineEvent(
      id: json['id'] as String,
      patientId: json['patientId'] as String,
      timestamp: json['timestamp'] as String,
      type: json['type'] as String,
      summary: json['summary'] as String,
      data: json['data'] as Map<String, dynamic>?,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'patientId': patientId,
        'timestamp': timestamp,
        'type': type,
        'summary': summary,
        'data': data,
      };
}
