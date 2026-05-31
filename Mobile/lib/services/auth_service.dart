import 'api_service.dart';

class AuthService {
  static Future<Map<String, dynamic>> login(String email, String password) async {
    final result = await ApiService.post('/auth/login', body: {
      'email': email,
      'password': password,
    });
    if (result['token'] != null && result['refreshToken'] != null) {
      await ApiService.setTokens(result['token'], result['refreshToken']);
    }
    return result;
  }

  static Future<Map<String, dynamic>> register(Map<String, dynamic> userData) async {
    return await ApiService.post('/auth/register', body: userData);
  }

  static Future<Map<String, dynamic>> getMe() async {
    return await ApiService.get('/auth/me');
  }

  static Future<Map<String, dynamic>> updateProfile(Map<String, dynamic> data) async {
    return await ApiService.put('/auth/me', body: data);
  }

  static Future<Map<String, dynamic>> validateEmail(String email) async {
    return await ApiService.post('/auth/validate-email', body: {'email': email});
  }

  static Future<Map<String, dynamic>> forgotPassword(String email) async {
    return await ApiService.post('/auth/forgot-password', body: {'email': email});
  }

  static Future<Map<String, dynamic>> resetPassword(String token, String newPassword, String confirmPassword) async {
    return await ApiService.post('/auth/reset-password', body: {
      'token': token,
      'newPassword': newPassword,
      'confirmPassword': confirmPassword,
    });
  }

  static Future<Map<String, dynamic>> googleAuth(String idToken, {String mode = 'login', String? role}) async {
    final body = <String, dynamic>{'credential': idToken, 'mode': mode};
    if (role != null) body['role'] = role;
    final result = await ApiService.post('/auth/google', body: body);
    if (result['token'] != null && result['refreshToken'] != null) {
      await ApiService.setTokens(result['token'], result['refreshToken']);
    }
    return result;
  }

  static Future<void> logout() async {
    await ApiService.clearTokens();
  }
}
