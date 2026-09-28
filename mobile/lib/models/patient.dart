class ConsentState {
  final bool clinicalScreening;
  final bool doctorReview;
  final bool telemedicineSharing;
  final bool dataStorage;
  final String updatedAt;

  const ConsentState({
    required this.clinicalScreening,
    required this.doctorReview,
    required this.telemedicineSharing,
    required this.dataStorage,
    required this.updatedAt,
  });

  factory ConsentState.fromJson(Map<String, dynamic> json) {
    return ConsentState(
      clinicalScreening: json['clinicalScreening'] as bool? ?? true,
      doctorReview: json['doctorReview'] as bool? ?? false,
      telemedicineSharing: json['telemedicineSharing'] as bool? ?? false,
      dataStorage: json['dataStorage'] as bool? ?? true,
      updatedAt: json['updatedAt'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
        'clinicalScreening': clinicalScreening,
        'doctorReview': doctorReview,
        'telemedicineSharing': telemedicineSharing,
        'dataStorage': dataStorage,
        'updatedAt': updatedAt,
      };

  ConsentState copyWith({
    bool? clinicalScreening,
    bool? doctorReview,
    bool? telemedicineSharing,
    bool? dataStorage,
    String? updatedAt,
  }) {
    return ConsentState(
      clinicalScreening: clinicalScreening ?? this.clinicalScreening,
      doctorReview: doctorReview ?? this.doctorReview,
      telemedicineSharing: telemedicineSharing ?? this.telemedicineSharing,
      dataStorage: dataStorage ?? this.dataStorage,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  bool valueFor(String type) {
    switch (type) {
      case 'clinicalScreening':
        return clinicalScreening;
      case 'doctorReview':
        return doctorReview;
      case 'telemedicineSharing':
        return telemedicineSharing;
      case 'dataStorage':
        return dataStorage;
      default:
        return false;
    }
  }
}

class Patient {
  final String id;
  final String name;
  final int age;
  final String gender;
  final String phone;
  final String village;
  final String symptoms;
  final String duration;
  final String knownConditions;
  final String medications;
  final String allergies;
  final String createdAt;
  final String recordHash;
  final bool isDemo;
  final ConsentState consent;

  const Patient({
    required this.id,
    required this.name,
    required this.age,
    required this.gender,
    required this.phone,
    required this.village,
    required this.symptoms,
    required this.duration,
    required this.knownConditions,
    required this.medications,
    required this.allergies,
    required this.createdAt,
    required this.recordHash,
    required this.isDemo,
    required this.consent,
  });

  factory Patient.fromJson(Map<String, dynamic> json) {
    return Patient(
      id: json['id'] as String,
      name: json['name'] as String,
      age: (json['age'] as num).toInt(),
      gender: json['gender'] as String,
      phone: json['phone'] as String,
      village: json['village'] as String,
      symptoms: json['symptoms'] as String,
      duration: json['duration'] as String,
      knownConditions: json['knownConditions'] as String,
      medications: json['medications'] as String,
      allergies: json['allergies'] as String,
      createdAt: json['createdAt'] as String,
      recordHash: json['recordHash'] as String,
      isDemo: json['isDemo'] as bool? ?? false,
      consent: ConsentState.fromJson(
        (json['consent'] as Map<String, dynamic>?) ?? const {},
      ),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'age': age,
        'gender': gender,
        'phone': phone,
        'village': village,
        'symptoms': symptoms,
        'duration': duration,
        'knownConditions': knownConditions,
        'medications': medications,
        'allergies': allergies,
        'createdAt': createdAt,
        'recordHash': recordHash,
        'isDemo': isDemo,
        'consent': consent.toJson(),
      };

  Patient copyWith({
    String? symptoms,
    ConsentState? consent,
    String? recordHash,
  }) {
    return Patient(
      id: id,
      name: name,
      age: age,
      gender: gender,
      phone: phone,
      village: village,
      symptoms: symptoms ?? this.symptoms,
      duration: duration,
      knownConditions: knownConditions,
      medications: medications,
      allergies: allergies,
      createdAt: createdAt,
      recordHash: recordHash ?? this.recordHash,
      isDemo: isDemo,
      consent: consent ?? this.consent,
    );
  }
}
