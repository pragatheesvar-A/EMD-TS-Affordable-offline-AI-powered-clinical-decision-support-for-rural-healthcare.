import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:emd_ts/main.dart';
import 'package:emd_ts/services/payment_service.dart';
import 'package:emd_ts/services/sms_service.dart';
import 'package:emd_ts/services/voice_messages.dart';
import 'package:emd_ts/widgets/common.dart';

void main() {
  testWidgets('App renders splash screen initially', (WidgetTester tester) async {
    await tester.pumpWidget(const EmdTsApp());
    expect(find.text('EMD-TS'), findsWidgets);
    expect(find.byType(CircularProgressIndicator), findsOneWidget);
  });

  testWidgets('RiskBadge renders correct text and colors', (WidgetTester tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: RiskBadge(level: 'HIGH'),
        ),
      ),
    );
    expect(find.text('High Priority'), findsOneWidget);
  });

  test('buildMinimalSmsBody formats SMS correctly without clinical vitals', () {
    final body = buildMinimalSmsBody(
      patientRef: 'PAT-001',
      priority: 'HIGH',
      reference: 'REF-12345',
    );
    expect(body, contains('EMD-TS ALERT'));
    expect(body, contains('Patient Ref: PAT-001'));
    expect(body, contains('Priority: HIGH'));
    expect(body, contains('Reference: REF-12345'));
    expect(body, isNot(contains('Heart Rate')));
    expect(body, isNot(contains('SpO2')));
  });

  test('Consultation plans have correct amounts and paise calculations', () {
    expect(demoConsultationPlans.length, equals(2));
    final basic = demoConsultationPlans.firstWhere((p) => p.id == 'plan_basic');
    final specialist = demoConsultationPlans.firstWhere((p) => p.id == 'plan_specialist');

    expect(basic.amountInRupees, equals(199));
    expect(basic.amountInPaise, equals(19900));

    expect(specialist.amountInRupees, equals(399));
    expect(specialist.amountInPaise, equals(39900));
  });

  test('PaymentService initializes and disposes cleanly without leaking listeners', () {
    final service = PaymentService();
    service.init(
      onSuccess: (_) {},
      onFailure: (_) {},
    );
    service.dispose();
  });

  test('VoiceMessages generates appropriate English and Tamil alerts across risk levels', () {
    // English risk levels
    final enLow = VoiceMessages.getMessage(langCode: 'en', riskLevel: 'LOW');
    final enMod = VoiceMessages.getMessage(langCode: 'en', riskLevel: 'MODERATE');
    final enHigh = VoiceMessages.getMessage(langCode: 'en', riskLevel: 'HIGH');
    final enChest = VoiceMessages.getMessage(langCode: 'en', riskLevel: 'HIGH', isChestPain: true);

    expect(enLow, contains('low risk'));
    expect(enMod, contains('moderate risk'));
    expect(enHigh, contains('high risk'));
    expect(enChest, contains('chest pain-related risk'));

    // Tamil risk levels
    final taLow = VoiceMessages.getMessage(langCode: 'ta', riskLevel: 'LOW');
    final taMod = VoiceMessages.getMessage(langCode: 'ta', riskLevel: 'MODERATE');
    final taHigh = VoiceMessages.getMessage(langCode: 'ta', riskLevel: 'HIGH');
    final taChest = VoiceMessages.getMessage(langCode: 'ta', riskLevel: 'HIGH', isChestPain: true);

    expect(taLow, contains('குறைந்த ஆபத்தை'));
    expect(taMod, contains('மிதமான ஆபத்தை'));
    expect(taHigh, contains('அதிக ஆபத்தை'));
    expect(taChest, contains('மார்பு வலி'));
  });
}
