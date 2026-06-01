import 'api_service.dart';

class ChatService {
  static Future<Map<String, dynamic>> getConversations() async {
    return await ApiService.get('/chat/conversations');
  }

  static Future<Map<String, dynamic>> createOrGetConversation(Map<String, dynamic> data) async {
    return await ApiService.post('/chat/conversations', body: data);
  }

  static Future<Map<String, dynamic>> getMessages(int conversationId, {int page = 1, int limit = 50}) async {
    return await ApiService.get('/chat/conversations/$conversationId/messages', queryParams: {
      'page': page.toString(),
      'limit': limit.toString(),
    });
  }

  static Future<Map<String, dynamic>> sendMessage(int conversationId, String body) async {
    return await ApiService.post('/chat/conversations/$conversationId/messages', body: {'body': body});
  }

  static Future<Map<String, dynamic>> getNotifications() async {
    return await ApiService.get('/chat/notifications');
  }

  static Future<Map<String, dynamic>> getMentorConversations() async {
    return await ApiService.get('/startups/mentor-chat/conversations');
  }

  static Future<Map<String, dynamic>> createMentorConversation(int mentorId) async {
    return await ApiService.post('/startups/mentor-chat/conversations', body: {'mentor_id': mentorId});
  }

  static Future<Map<String, dynamic>> getMentorMessages(int conversationId, {int page = 1, int limit = 50}) async {
    return await ApiService.get('/startups/mentor-chat/conversations/$conversationId/messages', queryParams: {
      'page': page.toString(),
      'limit': limit.toString(),
    });
  }

  static Future<Map<String, dynamic>> sendMentorMessage(int conversationId, String body) async {
    return await ApiService.post('/startups/mentor-chat/conversations/$conversationId/messages', body: {'body': body});
  }
}
