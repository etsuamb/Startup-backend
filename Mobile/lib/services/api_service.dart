import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart' show MediaType;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  static String baseUrl = 'http://127.0.0.1:5050/api';

  static String? _token;
  static String? _refreshToken;

  static Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('token');
    _refreshToken = prefs.getString('refreshToken');
  }

  static Future<void> setTokens(String token, String refreshToken) async {
    _token = token;
    _refreshToken = refreshToken;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('token', token);
    await prefs.setString('refreshToken', refreshToken);
  }

  static Future<void> clearTokens() async {
    _token = null;
    _refreshToken = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    await prefs.remove('refreshToken');
  }

  static bool get isLoggedIn => _token != null;

  static Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (_token != null) 'Authorization': 'Bearer $_token',
      };

  static String _cleanError(dynamic e) {
    final s = e.toString();
    if (s.contains('SocketException') || s.contains('Connection refused')) return 'Could not connect to server. Check your connection.';
    if (s.contains('TimeoutException')) return 'Request timed out. Please try again.';
    if (s.contains('HttpException')) return 'Server communication error.';
    if (s.startsWith('NoSuchMethodError')) return 'Unexpected server response format.';
    return s;
  }

  static Future<Map<String, dynamic>> get(String path, {Map<String, String>? queryParams}) async {
    try {
      final uri = Uri.parse('$baseUrl$path').replace(queryParameters: queryParams);
      final response = await http.get(uri, headers: _headers);
      return _handleResponse(response);
    } catch (e) {
      return {'error': _cleanError(e)};
    }
  }

  static Future<Map<String, dynamic>> post(String path, {Map<String, dynamic>? body}) async {
    try {
      final uri = Uri.parse('$baseUrl$path');
      final response = await http.post(uri, headers: _headers, body: body != null ? jsonEncode(body) : null);
      return _handleResponse(response);
    } catch (e) {
      return {'error': _cleanError(e)};
    }
  }

  static Future<Map<String, dynamic>> put(String path, {Map<String, dynamic>? body}) async {
    try {
      final uri = Uri.parse('$baseUrl$path');
      final response = await http.put(uri, headers: _headers, body: body != null ? jsonEncode(body) : null);
      return _handleResponse(response);
    } catch (e) {
      return {'error': _cleanError(e)};
    }
  }

  static Future<Map<String, dynamic>> patch(String path, {Map<String, dynamic>? body}) async {
    try {
      final uri = Uri.parse('$baseUrl$path');
      final response = await http.patch(uri, headers: _headers, body: body != null ? jsonEncode(body) : null);
      return _handleResponse(response);
    } catch (e) {
      return {'error': _cleanError(e)};
    }
  }

  static Future<Map<String, dynamic>> delete(String path) async {
    try {
      final uri = Uri.parse('$baseUrl$path');
      final response = await http.delete(uri, headers: _headers);
      return _handleResponse(response);
    } catch (e) {
      return {'error': _cleanError(e)};
    }
  }

  static String _mimeFromPath(String path) {
    final ext = path.split('.').last.toLowerCase();
    switch (ext) {
      case 'jpg': case 'jpeg': return 'image/jpeg';
      case 'png': return 'image/png';
      case 'gif': return 'image/gif';
      case 'webp': return 'image/webp';
      case 'pdf': return 'application/pdf';
      case 'mp4': return 'video/mp4';
      default: return 'application/octet-stream';
    }
  }

  static Future<Map<String, dynamic>> postMultipart(String path, Map<String, dynamic> fields, {Map<String, String>? filePaths}) async {
    try {
      final uri = Uri.parse('$baseUrl$path');
      final request = http.MultipartRequest('POST', uri);
      if (_token != null) {
        request.headers['Authorization'] = 'Bearer $_token';
      }
      request.fields['data'] = jsonEncode(fields);
      if (filePaths != null) {
        for (final entry in filePaths.entries) {
          final mime = _mimeFromPath(entry.value);
          request.files.add(await http.MultipartFile.fromPath(
            entry.key,
            entry.value,
            contentType: MediaType.parse(mime),
          ));
        }
      }
      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);
      return _handleResponse(response);
    } catch (e) {
      final cleaned = _cleanError(e);
      if (cleaned.startsWith('Could not connect') || cleaned.startsWith('Request timed out')) {
        return {'error': cleaned};
      }
      return {'error': cleaned, 'debug': e.toString()};
    }
  }

  static Future<Map<String, dynamic>> uploadFile(
    String path, {
    required File file,
    String fieldName = 'file',
    Map<String, String>? fields,
  }) async {
    try {
      final uri = Uri.parse('$baseUrl$path');
      final request = http.MultipartRequest('POST', uri);
      if (_token != null) {
        request.headers['Authorization'] = 'Bearer $_token';
      }
      request.files.add(await http.MultipartFile.fromPath(fieldName, file.path));
      if (fields != null) {
        request.fields.addAll(fields);
      }
      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);
      return _handleResponse(response);
    } catch (e) {
      return {'error': e.toString()};
    }
  }

  static Map<String, dynamic> _handleResponse(http.Response response) {
    try {
      final body = jsonDecode(response.body) as Map<String, dynamic>;
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return body;
      }
      body['error'] = body['message'] ?? 'Request failed';
      body['statusCode'] = response.statusCode;
      return body;
    } catch (_) {
      return {'error': 'Server error ($response.statusCode)', 'statusCode': response.statusCode};
    }
  }
}
