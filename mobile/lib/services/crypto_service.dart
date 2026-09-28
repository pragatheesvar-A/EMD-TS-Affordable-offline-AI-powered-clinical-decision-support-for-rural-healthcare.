// SHA-256 helpers, mirroring src/lib/crypto.ts. Used for local display
// purposes (e.g. showing a hash immediately while a request is
// in-flight); the backend is always the source of truth for the
// value actually committed to the blockchain.

import 'dart:convert';
import 'package:crypto/crypto.dart';

String sha256Hex(String input) {
  return sha256.convert(utf8.encode(input)).toString();
}

String shortHash(String hash, {int length = 16}) {
  if (hash.isEmpty) return '';
  return '${hash.substring(0, length > hash.length ? hash.length : length)}...';
}

/// Deterministic JSON (sorted keys) matching crypto_utils.canonicalize
/// on the backend, so a client-computed hash equals the server's.
String canonicalize(Map<String, dynamic> obj) {
  final sortedKeys = obj.keys.toList()..sort();
  final buffer = StringBuffer('{');
  for (var i = 0; i < sortedKeys.length; i++) {
    final key = sortedKeys[i];
    buffer.write(jsonEncode(key));
    buffer.write(':');
    buffer.write(jsonEncode(obj[key]));
    if (i != sortedKeys.length - 1) buffer.write(',');
  }
  buffer.write('}');
  return buffer.toString();
}
