// Core enums shared across the EMD-TS app. Mirrors src/types/index.ts
// in the original web prototype so both implementations agree on the
// same vocabulary (risk levels, roles, transaction types).

enum RiskLevel { low, moderate, high }

extension RiskLevelX on RiskLevel {
  static RiskLevel fromCode(String code) {
    switch (code.toUpperCase()) {
      case 'HIGH':
        return RiskLevel.high;
      case 'MODERATE':
        return RiskLevel.moderate;
      default:
        return RiskLevel.low;
    }
  }

  String get code {
    switch (this) {
      case RiskLevel.high:
        return 'HIGH';
      case RiskLevel.moderate:
        return 'MODERATE';
      case RiskLevel.low:
        return 'LOW';
    }
  }

  String get label {
    switch (this) {
      case RiskLevel.high:
        return 'High Priority';
      case RiskLevel.moderate:
        return 'Moderate Priority';
      case RiskLevel.low:
        return 'Low Priority';
    }
  }
}

enum UserRole { admin, healthcareWorker, doctor, specialist, auditor }

extension UserRoleX on UserRole {
  static UserRole fromCode(String code) {
    switch (code.toUpperCase()) {
      case 'ADMIN':
        return UserRole.admin;
      case 'DOCTOR':
        return UserRole.doctor;
      case 'SPECIALIST':
        return UserRole.specialist;
      case 'AUDITOR':
        return UserRole.auditor;
      default:
        return UserRole.healthcareWorker;
    }
  }

  String get code {
    switch (this) {
      case UserRole.admin:
        return 'ADMIN';
      case UserRole.healthcareWorker:
        return 'HEALTHCARE_WORKER';
      case UserRole.doctor:
        return 'DOCTOR';
      case UserRole.specialist:
        return 'SPECIALIST';
      case UserRole.auditor:
        return 'AUDITOR';
    }
  }

  String get displayName {
    switch (this) {
      case UserRole.admin:
        return 'S. Vignesh (Admin)';
      case UserRole.healthcareWorker:
        return 'Priya R. (ANM)';
      case UserRole.doctor:
        return 'Dr. Kavitha Subramaniam';
      case UserRole.specialist:
        return 'Dr. Arjun Rao (Cardiology)';
      case UserRole.auditor:
        return 'M. Elango (Auditor)';
    }
  }
}

enum AppLanguage { english, tamil }

enum DoctorAction { reviewed, refer, monitor, additionalInvestigation }

extension DoctorActionX on DoctorAction {
  String get label {
    switch (this) {
      case DoctorAction.reviewed:
        return 'Reviewed';
      case DoctorAction.refer:
        return 'Refer';
      case DoctorAction.monitor:
        return 'Monitor';
      case DoctorAction.additionalInvestigation:
        return 'Additional Investigation';
    }
  }
}

enum ConsentType { clinicalScreening, doctorReview, telemedicineSharing, dataStorage }

extension ConsentTypeX on ConsentType {
  String get key {
    switch (this) {
      case ConsentType.clinicalScreening:
        return 'clinicalScreening';
      case ConsentType.doctorReview:
        return 'doctorReview';
      case ConsentType.telemedicineSharing:
        return 'telemedicineSharing';
      case ConsentType.dataStorage:
        return 'dataStorage';
    }
  }

  String get label {
    switch (this) {
      case ConsentType.clinicalScreening:
        return 'Clinical Screening';
      case ConsentType.doctorReview:
        return 'Doctor Review';
      case ConsentType.telemedicineSharing:
        return 'Telemedicine Sharing';
      case ConsentType.dataStorage:
        return 'Data Storage';
    }
  }
}
