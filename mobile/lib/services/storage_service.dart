// Local offline-first cache. Mirrors src/lib/storage.ts in the web
// prototype: everything the app needs to keep working with zero
// network access is mirrored into SharedPreferences as JSON, and the
// UI reads from this cache first, refreshing it opportunistically
// whenever a backend call succeeds.

import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class StorageService {
  static const _namespace = 'emdts';

  Future<SharedPreferences> get _prefs => SharedPreferences.getInstance();

  String _key(String name) => '$_namespace:$name';

  Future<List<dynamic>> loadList(String name) async {
    final prefs = await _prefs;
    final raw = prefs.getString(_key(name));
    if (raw == null) return [];
    try {
      final decoded = jsonDecode(raw);
      return decoded is List ? decoded : [];
    } catch (_) {
      return [];
    }
  }

  Future<void> saveList(String name, List<dynamic> value) async {
    final prefs = await _prefs;
    await prefs.setString(_key(name), jsonEncode(value));
  }

  Future<String?> loadString(String name) async {
    final prefs = await _prefs;
    return prefs.getString(_key(name));
  }

  Future<void> saveString(String name, String value) async {
    final prefs = await _prefs;
    await prefs.setString(_key(name), value);
  }

  Future<void> clearAll() async {
    final prefs = await _prefs;
    final keys = prefs.getKeys().where((k) => k.startsWith('$_namespace:'));
    for (final k in keys.toList()) {
      await prefs.remove(k);
    }
  }
}

class StorageKeys {
  static const patients = 'patients';
  static const screenings = 'screenings';
  static const referrals = 'referrals';
  static const reviews = 'reviews';
  static const timeline = 'timeline';
  static const blockchainTx = 'blockchainTx';
  static const syncQueue = 'syncQueue';
  static const baseUrl = 'baseUrl';
  static const language = 'language';
  static const role = 'role';
}
