// Thin HTTP client for the EMD-TS FastAPI backend (see ../../../emd-ts-backend).
// Every screen goes through this service rather than calling http directly,
// so the base URL and error handling live in exactly one place.
//
// The backend host is configurable from the Settings screen (persisted via
// StorageService) because on a real device "localhost" means the phone
// itself -- when running the backend on a laptop for a demo, the phone
// needs the laptop's LAN IP instead (e.g. http://192.168.1.20:8080).

import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiException implements Exception {
  final String message;
  final int? statusCode;
  ApiException(this.message, [this.statusCode]);

  @override
  String toString() => 'ApiException($statusCode): $message';
}

class ApiService {
  String baseUrl;
  final http.Client _client;

  ApiService({required this.baseUrl, http.Client? client}) : _client = client ?? http.Client();

  void updateBaseUrl(String url) {
    baseUrl = url;
  }

  Uri _uri(String path, [Map<String, String>? query]) {
    final cleanBase = baseUrl.endsWith('/') ? baseUrl.substring(0, baseUrl.length - 1) : baseUrl;
    return Uri.parse('$cleanBase$path').replace(queryParameters: query);
  }

  Future<dynamic> _decode(http.Response resp) async {
    if (resp.statusCode >= 200 && resp.statusCode < 300) {
      if (resp.body.isEmpty) return null;
      return jsonDecode(resp.body);
    }
    String message = 'Request failed';
    try {
      final body = jsonDecode(resp.body);
      if (body is Map && body['detail'] != null) {
        message = body['detail'].toString();
      }
    } catch (_) {
      // ignore parse errors, use default message
    }
    throw ApiException(message, resp.statusCode);
  }

  Future<dynamic> get(String path, {Map<String, String>? query}) async {
    final resp = await _client.get(_uri(path, query)).timeout(const Duration(seconds: 10));
    return _decode(resp);
  }

  Future<dynamic> post(String path, {Map<String, dynamic>? body}) async {
    final resp = await _client
        .post(
          _uri(path),
          headers: {'Content-Type': 'application/json'},
          body: body != null ? jsonEncode(body) : null,
        )
        .timeout(const Duration(seconds: 10));
    return _decode(resp);
  }

  Future<dynamic> patch(String path, {Map<String, dynamic>? body}) async {
    final resp = await _client
        .patch(
          _uri(path),
          headers: {'Content-Type': 'application/json'},
          body: body != null ? jsonEncode(body) : null,
        )
        .timeout(const Duration(seconds: 10));
    return _decode(resp);
  }

  Future<bool> ping() async {
    try {
      final result = await get('/health');
      return result is Map && result['status'] == 'ok';
    } catch (_) {
      return false;
    }
  }
}
