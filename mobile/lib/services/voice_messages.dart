/// Model representing a voice language option.
class VoiceLanguage {
  final String code; // 'en', 'ta', etc.
  final String locale; // 'en-IN', 'ta-IN'
  final String displayName;
  final String nativeName;
  final String flagEmoji;

  const VoiceLanguage({
    required this.code,
    required this.locale,
    required this.displayName,
    required this.nativeName,
    required this.flagEmoji,
  });
}

/// Available offline voice languages.
const List<VoiceLanguage> kSupportedVoiceLanguages = [
  VoiceLanguage(
    code: 'en',
    locale: 'en-IN',
    displayName: 'English',
    nativeName: 'English',
    flagEmoji: '🇮🇳',
  ),
  VoiceLanguage(
    code: 'ta',
    locale: 'ta-IN',
    displayName: 'Tamil',
    nativeName: 'தமிழ்',
    flagEmoji: '🇮🇳',
  ),
];

/// Structured offline localized voice messages for health risk results.
/// Does not diagnose diseases; communicates safety-oriented screening guidance clearly.
class VoiceMessages {
  static const Map<String, Map<String, String>> _messages = {
    'en': {
      'low_risk':
          'Your screening result shows low risk. Please continue following healthy habits and consult a healthcare professional if you have concerns.',
      'moderate_risk':
          'Your screening result shows moderate risk. Please consider consulting a healthcare professional.',
      'high_risk':
          'Warning. Your screening result shows high risk. Please seek medical attention immediately.',
      'chest_pain_high':
          'Warning. Your screening indicates a potentially serious chest pain-related risk. Please seek immediate medical attention. If you are experiencing severe chest pain, difficulty breathing, fainting, or other serious symptoms, contact emergency medical services.',
      'missing_voice':
          'Offline voice for this language is not installed on this device. Please install the language voice pack in your device settings or switch to English.',
    },
    'ta': {
      'low_risk':
          'உங்கள் பரிசோதனை முடிவு குறைந்த ஆபத்தைக் காட்டுகிறது. ஆரோக்கியமான பழக்கங்களை தொடர்ந்து பின்பற்றுங்கள். ஏதேனும் கவலை இருந்தால் மருத்துவரை அணுகுங்கள்.',
      'moderate_risk':
          'உங்கள் பரிசோதனை முடிவு மிதமான ஆபத்தைக் காட்டுகிறது. தயவுசெய்து ஒரு சுகாதார நிபுணரை அணுகி ஆலோசனை பெறுங்கள்.',
      'high_risk':
          'எச்சரிக்கை. உங்கள் பரிசோதனை முடிவு அதிக ஆபத்தைக் காட்டுகிறது. தயவுசெய்து உடனடியாக மருத்துவ உதவியை நாடுங்கள்.',
      'chest_pain_high':
          'எச்சரிக்கை. உங்கள் பரிசோதனையில் மார்பு வலி தொடர்பான தீவிரமான ஆபத்து இருக்கக்கூடும். தயவுசெய்து உடனடியாக மருத்துவ உதவியை நாடுங்கள். கடுமையான மார்பு வலி, மூச்சுத்திணறல் அல்லது மயக்கம் போன்ற அறிகுறிகள் இருந்தால் அவசர மருத்துவ சேவையை தொடர்பு கொள்ளுங்கள்.',
      'missing_voice':
          'இந்த சாதனத்தில் தமிழ் ஆஃப்லைன் குரல் இல்லை. தயவுசெய்து தமிழ் குரல் பேக்கை நிறுவவும் அல்லது ஆங்கிலத்தைத் தேர்ந்தெடுக்கவும்.',
    },
  };

  /// Builds localized safety message based on risk level and chest pain context.
  static String getMessage({
    required String langCode,
    required String riskLevel,
    bool isChestPain = false,
  }) {
    final langMap = _messages[langCode] ?? _messages['en']!;

    if (riskLevel.toUpperCase() == 'HIGH') {
      if (isChestPain) {
        return langMap['chest_pain_high'] ?? langMap['high_risk']!;
      }
      return langMap['high_risk']!;
    } else if (riskLevel.toUpperCase() == 'MODERATE') {
      return langMap['moderate_risk']!;
    } else {
      return langMap['low_risk']!;
    }
  }

  /// Message when offline voice pack is unavailable.
  static String getMissingVoiceNotice(String langCode) {
    final langMap = _messages[langCode] ?? _messages['en']!;
    return langMap['missing_voice']!;
  }
}
