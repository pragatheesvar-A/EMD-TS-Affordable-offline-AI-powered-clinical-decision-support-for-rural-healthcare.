import 'package:flutter/foundation.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'voice_messages.dart';

enum TtsState { playing, stopped, paused }

/// Dedicated service for 100% on-device offline Text-to-Speech (TTS).
/// Keeps health information completely local without any external network calls.
class VoiceService {
  final FlutterTts _flutterTts = FlutterTts();
  bool _isInitialized = false;
  TtsState _ttsState = TtsState.stopped;

  String _currentLangCode = 'en';

  VoidCallback? onStart;
  VoidCallback? onCompletion;
  Function(String message)? onError;

  bool get isSpeaking => _ttsState == TtsState.playing;
  String get currentLangCode => _currentLangCode;

  /// Initializes the TTS engine with standard accessibility speech settings.
  Future<void> initialize({
    String initialLangCode = 'en',
    VoidCallback? onSpeechStart,
    VoidCallback? onSpeechDone,
    Function(String message)? onSpeechError,
  }) async {
    if (_isInitialized) return;

    onStart = onSpeechStart;
    onCompletion = onSpeechDone;
    onError = onSpeechError;
    _currentLangCode = initialLangCode;

    try {
      // Configure TTS audio channel and speech speed
      await _flutterTts.setSpeechRate(0.48); // Natural, clear cadence for rural/emergency listening
      await _flutterTts.setVolume(1.0);
      await _flutterTts.setPitch(1.0);

      _flutterTts.setStartHandler(() {
        _ttsState = TtsState.playing;
        onStart?.call();
      });

      _flutterTts.setCompletionHandler(() {
        _ttsState = TtsState.stopped;
        onCompletion?.call();
      });

      _flutterTts.setCancelHandler(() {
        _ttsState = TtsState.stopped;
        onCompletion?.call();
      });

      _flutterTts.setErrorHandler((msg) {
        _ttsState = TtsState.stopped;
        debugPrint('[VoiceService] TTS Error: $msg');
        onError?.call(msg.toString());
      });

      await setLanguage(_currentLangCode);
      _isInitialized = true;
    } catch (e) {
      debugPrint('[VoiceService] Failed to initialize TTS: $e');
    }
  }

  /// Sets the TTS language by language code ('en', 'ta').
  Future<bool> setLanguage(String langCode) async {
    _currentLangCode = langCode;
    final lang = kSupportedVoiceLanguages.firstWhere(
      (l) => l.code == langCode,
      orElse: () => kSupportedVoiceLanguages[0],
    );

    try {
      final isAvailable = await _flutterTts.isLanguageAvailable(lang.locale);
      if (isAvailable == true || isAvailable == 1) {
        await _flutterTts.setLanguage(lang.locale);
        return true;
      } else {
        // Fallback for English dialects
        if (langCode == 'en') {
          await _flutterTts.setLanguage('en-US');
          return true;
        }
        debugPrint('[VoiceService] Locale ${lang.locale} not installed on device.');
        return false;
      }
    } catch (e) {
      debugPrint('[VoiceService] Error setting language to ${lang.locale}: $e');
      return false;
    }
  }

  /// Checks if a voice language is available offline on the device.
  Future<bool> isLanguageInstalled(String langCode) async {
    final lang = kSupportedVoiceLanguages.firstWhere(
      (l) => l.code == langCode,
      orElse: () => kSupportedVoiceLanguages[0],
    );
    try {
      final result = await _flutterTts.isLanguageAvailable(lang.locale);
      return result == true || result == 1;
    } catch (_) {
      return false;
    }
  }

  /// Speaks the given text aloud.
  Future<bool> speak(String text, {String? langCode}) async {
    final targetLang = langCode ?? _currentLangCode;
    await stop(); // Cancel any current speech first

    final langSupported = await setLanguage(targetLang);
    if (!langSupported && targetLang != 'en') {
      // Fallback to English if target language pack is missing
      await setLanguage('en');
    }

    try {
      final result = await _flutterTts.speak(text);
      return result == 1 || result == true;
    } catch (e) {
      debugPrint('[VoiceService] Error during speak: $e');
      return false;
    }
  }

  /// Speaks the screening risk alert directly.
  Future<bool> speakRiskAlert({
    required String riskLevel,
    required bool isChestPain,
    String? langCode,
  }) async {
    final targetLang = langCode ?? _currentLangCode;
    final message = VoiceMessages.getMessage(
      langCode: targetLang,
      riskLevel: riskLevel,
      isChestPain: isChestPain,
    );
    return await speak(message, langCode: targetLang);
  }

  /// Stops current speech output immediately.
  Future<void> stop() async {
    try {
      await _flutterTts.stop();
      _ttsState = TtsState.stopped;
    } catch (e) {
      debugPrint('[VoiceService] Error stopping TTS: $e');
    }
  }

  /// Disposes TTS listeners and halts audio playback.
  void dispose() {
    stop();
    onStart = null;
    onCompletion = null;
    onError = null;
    _isInitialized = false;
  }
}
