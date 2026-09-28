// Offline SMS fallback -- EMD-TS spec section 21. This service only
// ever composes and hands off the message; it never sends SMS silently
// in the background (that would need SEND_SMS runtime permission and a
// platform channel this app deliberately avoids). Instead it opens the
// phone's own SMS app pre-filled with the minimal alert text via the
// `sms:` URI scheme, so the healthcare worker sees exactly what is
// about to be sent and taps Send themselves.

import 'package:url_launcher/url_launcher.dart';

/// The ONLY text this app ever sends over SMS. No vitals, no ECG data,
/// no symptoms, no diagnosis -- SMS is not an encrypted medical-data
/// channel, so nothing clinical is allowed in here. Matches the
/// backend's sms_alerts.build_minimal_message exactly.
String buildMinimalSmsBody({
  required String patientRef,
  required String priority,
  required String reference,
}) {
  return 'EMD-TS ALERT\n'
      'Patient Ref: $patientRef\n'
      'Priority: $priority\n'
      'Clinical review required.\n'
      'Reference: $reference';
}

class SmsService {
  /// Opens the device's native SMS composer with [body] pre-filled,
  /// addressed to [phoneNumber] (may be empty -- the user can still
  /// pick a recipient in the composer). Returns true if the composer
  /// was opened, false if it couldn't be (no SMS app, simulator/
  /// desktop with no telephony, permission denied, etc.) -- this never
  /// throws, since a demo running on a laptop or an emulator with no
  /// SIM is an expected, non-fatal case.
  Future<bool> openSmsComposer({
    required String phoneNumber,
    required String body,
  }) async {
    try {
      final uri = Uri(
        scheme: 'sms',
        path: phoneNumber.trim(),
        queryParameters: {'body': body},
      );
      final canLaunch = await canLaunchUrl(uri);
      if (!canLaunch) return false;
      return await launchUrl(uri);
    } catch (_) {
      return false;
    }
  }
}
