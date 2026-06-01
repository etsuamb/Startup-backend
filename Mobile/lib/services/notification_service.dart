import 'api_service.dart';

class NotificationService {
  static Future<Map<String, dynamic>> getNotifications() async {
    return await ApiService.get('/notifications');
  }

  static Future<Map<String, dynamic>> getUnreadCount() async {
    return await ApiService.get('/notifications/unread-count');
  }

  static Future<Map<String, dynamic>> markAllRead() async {
    return await ApiService.put('/notifications/mark-all-read');
  }

  static Future<Map<String, dynamic>> updateNotification(int id, Map<String, dynamic> data) async {
    return await ApiService.patch('/notifications/$id', body: data);
  }

  static Future<Map<String, dynamic>> getSettings() async {
    return await ApiService.get('/notifications/settings');
  }

  static Future<Map<String, dynamic>> updateSettings(Map<String, dynamic> data) async {
    return await ApiService.put('/notifications/settings', body: data);
  }
}
