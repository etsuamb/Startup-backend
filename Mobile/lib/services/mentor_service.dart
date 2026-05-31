import 'api_service.dart';

class MentorService {
  static Future<Map<String, dynamic>> getProfile() async {
    return await ApiService.get('/mentors/profile');
  }

  static Future<Map<String, dynamic>> updateProfile(Map<String, dynamic> data) async {
    return await ApiService.put('/mentors/profile', body: data);
  }

  static Future<Map<String, dynamic>> getDashboard() async {
    return await ApiService.get('/mentors/dashboard');
  }

  static Future<Map<String, dynamic>> getMentorshipRequests() async {
    return await ApiService.get('/mentors/mentorship-requests');
  }

  static Future<Map<String, dynamic>> acceptRequest(int requestId) async {
    return await ApiService.put('/mentors/mentorship-requests/$requestId/accept');
  }

  static Future<Map<String, dynamic>> rejectRequest(int requestId, {String? reason}) async {
    return await ApiService.put('/mentors/mentorship-requests/$requestId/reject', body: {
      if (reason != null) 'reason': reason,
    });
  }

  static Future<Map<String, dynamic>> getAssignedStartups() async {
    return await ApiService.get('/mentors/my-startups');
  }

  static Future<Map<String, dynamic>> getMentorshipHistory() async {
    return await ApiService.get('/mentors/mentorships');
  }

  static Future<Map<String, dynamic>> getAvailableStartups({String? industry, String? stage, String? search}) async {
    final params = <String, String>{};
    if (industry != null) params['industry'] = industry;
    if (stage != null) params['stage'] = stage;
    if (search != null) params['search'] = search;
    return await ApiService.get('/mentors/startups', queryParams: params);
  }

  static Future<Map<String, dynamic>> getStartupDetail(int startupId) async {
    return await ApiService.get('/mentors/startups/$startupId');
  }

  static Future<Map<String, dynamic>> getSessions() async {
    return await ApiService.get('/mentors/sessions');
  }

  static Future<Map<String, dynamic>> createSession(Map<String, dynamic> data) async {
    return await ApiService.post('/mentors/sessions', body: data);
  }

  static Future<Map<String, dynamic>> uploadResource(Map<String, dynamic> data) async {
    return await ApiService.post('/mentors/resources', body: data);
  }

  static Future<Map<String, dynamic>> createReport(Map<String, dynamic> data) async {
    return await ApiService.post('/mentors/reports', body: data);
  }

  static Future<Map<String, dynamic>> sendProposal(Map<String, dynamic> data) async {
    return await ApiService.post('/mentors/proposals', body: data);
  }
}
