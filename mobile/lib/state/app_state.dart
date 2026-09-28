// Central app state (Provider / ChangeNotifier), mirroring
// src/context/AppContext.tsx in the web prototype: every screen reads
// from here and calls back into it rather than talking to the API or
// local storage directly.
//
// Offline-first behaviour: every list is cached to SharedPreferences.
// On start, the cache is shown immediately; a background refresh then
// talks to the FastAPI backend if reachable, and silently keeps the
// cached data (with a "using cached data" flag) if it is not.

import 'package:flutter/foundation.dart';

import '../models/blockchain_models.dart';
import '../models/dashboard_summary.dart';
import '../models/enums.dart';
import '../models/patient.dart';
import '../models/referral.dart';
import '../models/review.dart';
import '../models/screening.dart';
import '../models/timeline_event.dart';
import '../models/vitals.dart';
import '../services/api_service.dart';
import '../services/storage_service.dart';

class AppState extends ChangeNotifier {
  final ApiService api;
  final StorageService storage;

  AppState({required this.api, required this.storage});

  bool ready = false;
  bool backendReachable = false;
  String? lastError;

  List<Patient> patients = [];
  final Map<String, List<ScreeningResult>> _screeningsByPatient = {};
  final Map<String, List<ReferralRecord>> _referralsByPatient = {};
  final Map<String, List<DoctorReview>> _reviewsByPatient = {};
  final Map<String, List<TimelineEvent>> _timelineByPatient = {};
  List<SyncQueueItem> syncQueue = [];
  List<BlockchainTransaction> blockchainTransactions = [];

  AppLanguage language = AppLanguage.english;
  UserRole currentRole = UserRole.healthcareWorker;
  String? activePatientId;

  // Live wearable simulation state (not persisted -- session only).
  bool wearableConnected = false;
  VitalsReading? liveVitals;
  bool liveEcgAbnormal = false;

  List<ScreeningResult> screeningsFor(String patientId) =>
      List.unmodifiable(_screeningsByPatient[patientId] ?? const []);
  List<ReferralRecord> referralsFor(String patientId) =>
      List.unmodifiable(_referralsByPatient[patientId] ?? const []);
  List<DoctorReview> reviewsFor(String patientId) =>
      List.unmodifiable(_reviewsByPatient[patientId] ?? const []);
  List<TimelineEvent> timelineFor(String patientId) =>
      List.unmodifiable(_timelineByPatient[patientId] ?? const []);

  Patient? patientById(String id) {
    for (final p in patients) {
      if (p.id == id) return p;
    }
    return null;
  }

  ScreeningResult? latestScreeningFor(String patientId) {
    final list = screeningsFor(patientId);
    return list.isEmpty ? null : list.first;
  }

  // ---------------------------------------------------------------- init

  Future<void> init() async {
    final savedUrl = await storage.loadString(StorageKeys.baseUrl);
    if (savedUrl != null && savedUrl.isNotEmpty) {
      api.updateBaseUrl(savedUrl);
    }
    final savedLang = await storage.loadString(StorageKeys.language);
    if (savedLang == 'ta') language = AppLanguage.tamil;
    final savedRole = await storage.loadString(StorageKeys.role);
    if (savedRole != null) currentRole = UserRoleX.fromCode(savedRole);

    await _loadPatientsFromCache();
    ready = true;
    notifyListeners();

    await refreshPatients();
  }

  Future<void> _loadPatientsFromCache() async {
    final raw = await storage.loadList(StorageKeys.patients);
    patients =
        raw.map((e) => Patient.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<void> _cachePatients() async {
    await storage.saveList(
        StorageKeys.patients, patients.map((p) => p.toJson()).toList());
  }

  // ---------------------------------------------------------------- settings

  Future<void> setBaseUrl(String url) async {
    api.updateBaseUrl(url);
    await storage.saveString(StorageKeys.baseUrl, url);
    notifyListeners();
    await refreshPatients();
  }

  Future<void> setLanguage(AppLanguage lang) async {
    language = lang;
    await storage.saveString(
        StorageKeys.language, lang == AppLanguage.tamil ? 'ta' : 'en');
    notifyListeners();
  }

  Future<void> setRole(UserRole role) async {
    currentRole = role;
    await storage.saveString(StorageKeys.role, role.code);
    notifyListeners();
  }

  void setActivePatientId(String? id) {
    activePatientId = id;
    notifyListeners();
  }

  void setWearableConnected(bool value) {
    wearableConnected = value;
    notifyListeners();
  }

  void setLiveVitals(VitalsReading? vitals) {
    liveVitals = vitals;
    notifyListeners();
  }

  void setLiveEcgAbnormal(bool value) {
    liveEcgAbnormal = value;
    notifyListeners();
  }

  // ---------------------------------------------------------------- refresh

  DashboardSummary dashboardSummary = DashboardSummary.empty();

  Future<void> refreshDashboardSummary() async {
    try {
      final result = await api.get('/dashboard/summary');
      dashboardSummary =
          DashboardSummary.fromJson(result as Map<String, dynamic>);
      backendReachable = true;
    } catch (e) {
      backendReachable = false;
      lastError = e.toString();
    }
    notifyListeners();
  }

  Future<void> refreshPatients() async {
    try {
      final result = await api.get('/patients');
      patients = (result as List<dynamic>)
          .map((e) => Patient.fromJson(e as Map<String, dynamic>))
          .toList();
      backendReachable = true;
      lastError = null;
      await _cachePatients();
    } catch (e) {
      backendReachable = false;
      lastError = e.toString();
      // keep whatever was loaded from cache
    }
    notifyListeners();
  }

  Future<void> refreshScreenings(String patientId) async {
    try {
      final result = await api.get('/patients/$patientId/screenings');
      _screeningsByPatient[patientId] = (result as List<dynamic>)
          .map((e) => ScreeningResult.fromJson(e as Map<String, dynamic>))
          .toList();
      backendReachable = true;
    } catch (e) {
      backendReachable = false;
      lastError = e.toString();
    }
    notifyListeners();
  }

  Future<void> refreshReferrals(String patientId) async {
    try {
      final result = await api.get('/patients/$patientId/referrals');
      _referralsByPatient[patientId] = (result as List<dynamic>)
          .map((e) => ReferralRecord.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (e) {
      lastError = e.toString();
    }
    notifyListeners();
  }

  Future<void> refreshReviews(String patientId) async {
    try {
      final result = await api.get('/patients/$patientId/reviews');
      _reviewsByPatient[patientId] = (result as List<dynamic>)
          .map((e) => DoctorReview.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (e) {
      lastError = e.toString();
    }
    notifyListeners();
  }

  Future<void> refreshTimeline(String patientId) async {
    try {
      final result = await api.get('/patients/$patientId/timeline');
      _timelineByPatient[patientId] = (result as List<dynamic>)
          .map((e) => TimelineEvent.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (e) {
      lastError = e.toString();
    }
    notifyListeners();
  }

  Future<void> refreshSyncQueue() async {
    try {
      final result = await api.get('/sync/queue');
      syncQueue = (result as List<dynamic>)
          .map((e) => SyncQueueItem.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (e) {
      lastError = e.toString();
    }
    notifyListeners();
  }

  Future<void> refreshBlockchain({String? patientId}) async {
    try {
      final result = await api.get(
        '/blockchain/transactions',
        query: patientId != null ? {'patient_id': patientId} : null,
      );
      blockchainTransactions = (result as List<dynamic>)
          .map((e) => BlockchainTransaction.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (e) {
      lastError = e.toString();
    }
    notifyListeners();
  }

  Future<Map<String, dynamic>> verifyChain() async {
    try {
      final result = await api.get('/blockchain/verify');
      return result as Map<String, dynamic>;
    } catch (e) {
      return {'valid': null, 'error': e.toString()};
    }
  }

  Future<Map<String, dynamic>> chainStats() async {
    try {
      final result = await api.get('/blockchain/stats');
      return result as Map<String, dynamic>;
    } catch (e) {
      return {
        'totalBlocks': 0,
        'totalTransactions': 0,
        'patientsReferenced': 0,
        'accessDenials': 0
      };
    }
  }

  // ---------------------------------------------------------------- writes

  Future<Patient> addPatient({
    required String name,
    required int age,
    required String gender,
    required String phone,
    required String village,
    required String symptoms,
    String duration = 'Not specified',
    String knownConditions = 'None reported',
    String medications = 'None reported',
    String allergies = 'None known',
  }) async {
    final result = await api.post('/patients', body: {
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
      'userRole': currentRole.code,
    });
    final patient = Patient.fromJson(result as Map<String, dynamic>);
    patients = [patient, ...patients];
    await _cachePatients();
    notifyListeners();
    return patient;
  }

  Future<void> updateConsent(
      String patientId, ConsentType type, bool value) async {
    final result = await api.patch('/patients/$patientId/consent', body: {
      'type': type.key,
      'value': value,
      'userRole': currentRole.code,
    });
    final updated = Patient.fromJson(result as Map<String, dynamic>);
    patients = patients.map((p) => p.id == patientId ? updated : p).toList();
    await _cachePatients();
    notifyListeners();
  }

  Future<ScreeningResult> runScreening(
      String patientId, VitalsReading vitals, bool ecgAbnormal) async {
    final result = await api.post('/patients/$patientId/screenings', body: {
      'vitals': vitals.toJson(),
      'ecgAbnormal': ecgAbnormal,
      'userRole': currentRole.code,
    });
    final screening = ScreeningResult.fromJson(result as Map<String, dynamic>);
    final list =
        List<ScreeningResult>.from(_screeningsByPatient[patientId] ?? []);
    _screeningsByPatient[patientId] = [screening, ...list];
    notifyListeners();
    return screening;
  }

  Future<ReferralRecord> addReferral(
      String patientId, String screeningId, String note) async {
    final result = await api.post('/patients/$patientId/referrals', body: {
      'screeningId': screeningId,
      'note': note,
      'userRole': currentRole.code,
    });
    final referral = ReferralRecord.fromJson(result as Map<String, dynamic>);
    final list =
        List<ReferralRecord>.from(_referralsByPatient[patientId] ?? []);
    _referralsByPatient[patientId] = [referral, ...list];
    notifyListeners();
    return referral;
  }

  Future<DoctorReview> addDoctorReview(
    String patientId,
    String notes,
    DoctorAction action, {
    String? screeningId,
  }) async {
    final result = await api.post('/patients/$patientId/reviews', body: {
      'notes': notes,
      'action': action.label,
      'screeningId': screeningId,
      'doctorName': currentRole.displayName,
      'userRole': currentRole.code,
    });
    final review = DoctorReview.fromJson(result as Map<String, dynamic>);
    final list = List<DoctorReview>.from(_reviewsByPatient[patientId] ?? []);
    _reviewsByPatient[patientId] = [review, ...list];
    notifyListeners();
    return review;
  }

  Future<void> viewRecord(String patientId) async {
    await api.post('/patients/$patientId/view',
        body: {'userRole': currentRole.code});
  }

  Future<Map<String, dynamic>> simulateUnauthorizedAccess(
      String patientId) async {
    final result =
        await api.post('/security/unauthorized-access/$patientId', body: {
      'user': 'Unknown_User',
      'action': 'VIEW_RECORD',
    });
    return result as Map<String, dynamic>;
  }

  Future<void> tamperRecord(String patientId) async {
    await api.post('/security/tamper/$patientId');
  }

  Future<void> restoreRecord(String patientId) async {
    await api.post('/security/restore/$patientId');
  }

  Future<IntegrityStatus> checkIntegrity(String patientId) async {
    final result = await api.get('/security/integrity/$patientId');
    return IntegrityStatus.fromJson(result as Map<String, dynamic>);
  }

  Future<int> syncNow() async {
    final result = await api.post('/sync/run');
    await refreshSyncQueue();
    return (result as Map<String, dynamic>)['synced'] as int? ?? 0;
  }

  Future<void> resetAllData() async {
    await api.post('/admin/reset');
    _screeningsByPatient.clear();
    _referralsByPatient.clear();
    _reviewsByPatient.clear();
    _timelineByPatient.clear();
    syncQueue = [];
    blockchainTransactions = [];
    await storage.clearAll();
    await refreshPatients();
  }
}
