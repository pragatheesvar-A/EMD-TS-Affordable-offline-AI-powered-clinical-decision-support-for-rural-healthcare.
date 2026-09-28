/// Offline SMS fallback alert -- EMD-TS spec section 21. Mirrors the
/// backend's `sms_alerts` table / `/sms-alerts` JSON contract exactly.
/// `message` is always the already-minimal SMS body (see
/// SmsService.buildMinimalSmsBody) -- this model never carries vitals,
/// ECG data, or diagnosis, by construction.
class SmsAlert {
  final String id;
  final String patientId;
  final String? screeningId;
  final String priority; // LOW | MODERATE | HIGH
  final String reference; // e.g. EMD-4F2A9B
  final String message;
  final String status; // PENDING | SENT | SYNCED
  final String createdAt;
  final String updatedAt;

  /// Client-only bookkeeping -- NOT part of the backend's wire format.
  /// Tracks whether this device has told the backend about this alert
  /// yet (for the blockchain audit trail), which is a separate concern
  /// from `status` (the SMS-send lifecycle: PENDING/SENT/SYNCED). A
  /// device can send the SMS itself (status=SENT) long before it has
  /// any data connection to also inform the backend -- that's the
  /// entire point of the offline-first design.
  final bool syncedToServer;

  const SmsAlert({
    required this.id,
    required this.patientId,
    required this.screeningId,
    required this.priority,
    required this.reference,
    required this.message,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
    this.syncedToServer = false,
  });

  factory SmsAlert.fromJson(Map<String, dynamic> json) {
    return SmsAlert(
      id: json['id'] as String,
      patientId: json['patientId'] as String,
      screeningId: json['screeningId'] as String?,
      priority: json['priority'] as String,
      reference: json['reference'] as String,
      message: json['message'] as String,
      status: json['status'] as String? ?? 'PENDING',
      createdAt: json['createdAt'] as String,
      updatedAt: json['updatedAt'] as String? ?? (json['createdAt'] as String),
      syncedToServer: json['syncedToServer'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'patientId': patientId,
        'screeningId': screeningId,
        'priority': priority,
        'reference': reference,
        'message': message,
        'status': status,
        'createdAt': createdAt,
        'updatedAt': updatedAt,
        'syncedToServer': syncedToServer,
      };

  SmsAlert copyWith({String? status, String? updatedAt, bool? syncedToServer}) {
    return SmsAlert(
      id: id,
      patientId: patientId,
      screeningId: screeningId,
      priority: priority,
      reference: reference,
      message: message,
      status: status ?? this.status,
      createdAt: createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      syncedToServer: syncedToServer ?? this.syncedToServer,
    );
  }
}
