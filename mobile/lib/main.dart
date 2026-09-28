import 'dart:io' show Platform;

import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'services/api_service.dart';
import 'services/storage_service.dart';
import 'state/app_state.dart';
import 'theme/app_theme.dart';

import 'screens/dashboard_screen.dart';
import 'screens/patient_registration_screen.dart';
import 'screens/live_monitoring_screen.dart';
import 'screens/ai_screening_screen.dart';
import 'screens/patient_timeline_screen.dart';
import 'screens/clinical_copilot_screen.dart';
import 'screens/smart_referral_screen.dart';
import 'screens/doctor_dashboard_screen.dart';
import 'screens/security_center_screen.dart';
import 'screens/blockchain_audit_screen.dart';
import 'screens/architecture_screen.dart';
import 'screens/business_model_screen.dart';
import 'screens/settings_screen.dart';
import 'screens/demo_runner_screen.dart';
import 'screens/consultation_payment_screen.dart';

/// Default backend URL. On the Android emulator, "localhost" refers to
/// the emulator itself, not the host machine -- 10.0.2.2 is the special
/// alias Android provides for the host's localhost. On iOS simulator
/// and desktop, localhost works directly. On a physical device this
/// must be changed (in Settings) to the host machine's LAN IP, e.g.
/// http://192.168.1.20:8080.
String _defaultBaseUrl() {
  if (kIsWeb) return 'http://localhost:8080';
  try {
    if (Platform.isAndroid) return 'http://10.0.2.2:8080';
  } catch (_) {
    // Platform lookup can throw on unsupported embedders; fall through.
  }
  return 'http://localhost:8080';
}

void main() {
  runApp(const EmdTsApp());
}

class EmdTsApp extends StatefulWidget {
  const EmdTsApp({super.key});

  @override
  State<EmdTsApp> createState() => _EmdTsAppState();
}

class _EmdTsAppState extends State<EmdTsApp> {
  late final AppState _appState;
  late final Future<void> _initFuture;

  @override
  void initState() {
    super.initState();
    final api = ApiService(baseUrl: _defaultBaseUrl());
    final storage = StorageService();
    _appState = AppState(api: api, storage: storage);
    _initFuture = _appState.init();
  }

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider<AppState>.value(
      value: _appState,
      child: MaterialApp(
        title: 'EMD-TS',
        debugShowCheckedModeBanner: false,
        theme: buildAppTheme(),
        home: FutureBuilder<void>(
          future: _initFuture,
          builder: (context, snapshot) {
            if (snapshot.connectionState != ConnectionState.done) {
              return const _SplashScreen();
            }
            return const DashboardScreen();
          },
        ),
        routes: {
          '/registration': (context) => const PatientRegistrationScreen(),
          '/monitoring': (context) => const LiveMonitoringScreen(),
          '/screening': (context) => const AiScreeningScreen(),
          '/timeline': (context) => const PatientTimelineScreen(),
          '/copilot': (context) => const ClinicalCopilotScreen(),
          '/referral': (context) => const SmartReferralScreen(),
          '/doctor': (context) => const DoctorDashboardScreen(),
          '/security': (context) => const SecurityCenterScreen(),
          '/blockchain': (context) => const BlockchainAuditScreen(),
          '/architecture': (context) => const ArchitectureScreen(),
          '/business': (context) => const BusinessModelScreen(),
          '/settings': (context) => const SettingsScreen(),
          '/demo': (context) => const DemoRunnerScreen(),
          '/payment': (context) => const ConsultationPaymentScreen(),
        },
      ),
    );
  }
}

class _SplashScreen extends StatelessWidget {
  const _SplashScreen();

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: Color(0xFFF4F7FB),
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('EMD-TS', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800, color: Color(0xFF185CEF))),
            SizedBox(height: 12),
            CircularProgressIndicator(),
          ],
        ),
      ),
    );
  }
}
