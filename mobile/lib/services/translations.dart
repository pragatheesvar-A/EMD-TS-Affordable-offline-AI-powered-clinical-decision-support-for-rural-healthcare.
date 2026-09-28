import '../models/enums.dart';

final Map<AppLanguage, Map<String, String>> _translations = {
  AppLanguage.english: {
    'appName': 'EMD-TS',
    'appFullName': 'Edge Medical Diagnostics & Telemedicine System',
    'tagline': 'Better Information. Faster Screening. Connected Care.',
    'offline': 'OFFLINE MODE',
    'online': 'ONLINE',
    'nav_dashboard': 'Dashboard',
    'nav_registration': 'Patient Registration',
    'nav_monitoring': 'Live Monitoring',
    'nav_screening': 'AI Screening',
    'nav_timeline': 'Patient Timeline',
    'nav_copilot': 'Clinical Copilot',
    'nav_referral': 'Smart Referral',
    'nav_doctor': 'Doctor Dashboard',
    'nav_security': 'Security Center',
    'nav_blockchain': 'Blockchain Audit',
    'nav_architecture': 'Architecture',
    'nav_business': 'Business Model',
    'nav_settings': 'Settings',
  },
  AppLanguage.tamil: {
    'appName': 'EMD-TS',
    'appFullName': 'விளிம்பு மருத்துவ கண்டறிதல் & தொலைமருத்துவ அமைப்பு',
    'tagline': 'சிறந்த தகவல். வேகமான பரிசோதனை. இணைக்கப்பட்ட பராமரிப்பு.',
    'offline': 'ஆஃப்லைன் பயன்முறை',
    'online': 'ஆன்லைன்',
    'nav_dashboard': 'டாஷ்போர்டு',
    'nav_registration': 'நோயாளி பதிவு',
    'nav_monitoring': 'நேரடி கண்காணிப்பு',
    'nav_screening': 'AI பரிசோதனை',
    'nav_timeline': 'நோயாளி காலவரிசை',
    'nav_copilot': 'மருத்துவ உதவியாளர்',
    'nav_referral': 'ஸ்மார்ட் பரிந்துரை',
    'nav_doctor': 'மருத்துவர் டாஷ்போர்டு',
    'nav_security': 'பாதுகாப்பு மையம்',
    'nav_blockchain': 'பிளாக்செயின் தணிக்கை',
    'nav_architecture': 'கட்டமைப்பு',
    'nav_business': 'வணிக மாதிரி',
    'nav_settings': 'அமைப்புகள்',
  },
};

String t(AppLanguage lang, String key) {
  return _translations[lang]?[key] ?? _translations[AppLanguage.english]?[key] ?? key;
}

class MultilingualDemo {
  static const english = 'Patient has chest pain for two days.';
  static const tamil = 'நோயாளிக்கு இரண்டு நாட்களாக மார்பு வலி உள்ளது.';
  static const transliteration = 'Patient-ku rendu naala chest pain irukku.';
  static const symptom = 'Chest Pain';
  static const duration = '2 Days';
}
