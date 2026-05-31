import 'api_service.dart';

class StartupService {
  static Future<Map<String, dynamic>> getProfile() async {
    return await ApiService.get('/startups/me');
  }

  static Future<Map<String, dynamic>> createProfile(Map<String, dynamic> data) async {
    return await ApiService.post('/startups/profile', body: data);
  }

  static Future<Map<String, dynamic>> updateProfile(Map<String, dynamic> data) async {
    return await ApiService.put('/startups/profile', body: data);
  }

  static Future<Map<String, dynamic>> getDashboardInfo() async {
    return await ApiService.get('/startups/dashboard/info');
  }

  static Future<Map<String, dynamic>> getDashboardStatus() async {
    return await ApiService.get('/startups/dashboard/status');
  }

  static Future<Map<String, dynamic>> getDashboardProgress() async {
    return await ApiService.get('/startups/dashboard/project-progress');
  }

  static Future<Map<String, dynamic>> getFundingSummary() async {
    return await ApiService.get('/startups/dashboard/funding-summary');
  }

  static Future<Map<String, dynamic>> getDocumentsStatus() async {
    return await ApiService.get('/startups/dashboard/documents-status');
  }

  static Future<Map<String, dynamic>> getFeedback({int limit = 5}) async {
    return await ApiService.get('/startups/dashboard/feedback', queryParams: {'limit': limit.toString()});
  }

  static Future<Map<String, dynamic>> getEvents() async {
    return await ApiService.get('/startups/dashboard/events');
  }

  static Future<Map<String, dynamic>> getActivity({int limit = 10}) async {
    return await ApiService.get('/startups/dashboard/activity', queryParams: {'limit': limit.toString()});
  }

  static Future<Map<String, dynamic>> quickAction(Map<String, dynamic> action) async {
    return await ApiService.post('/startups/dashboard/quick-actions', body: action);
  }

  static Future<Map<String, dynamic>> searchStartups({String? q, String? industry, String? stage, int page = 1, int limit = 20}) async {
    final params = <String, String>{
      'page': page.toString(),
      'limit': limit.toString(),
    };
    if (q != null) params['q'] = q;
    if (industry != null) params['industry'] = industry;
    if (stage != null) params['stage'] = stage;
    return await ApiService.get('/startups/search', queryParams: params);
  }

  static Future<Map<String, dynamic>> getFeatured({int limit = 10, int offset = 0}) async {
    return await ApiService.get('/startups/featured', queryParams: {'limit': limit.toString(), 'offset': offset.toString()});
  }

  static Future<Map<String, dynamic>> getProjects() async {
    return await ApiService.get('/startups/projects');
  }

  static Future<Map<String, dynamic>> createProject(Map<String, dynamic> data) async {
    return await ApiService.post('/startups/projects', body: data);
  }

  static Future<Map<String, dynamic>> getProject(int projectId) async {
    return await ApiService.get('/startups/projects/$projectId');
  }

  static Future<Map<String, dynamic>> updateProject(int projectId, Map<String, dynamic> data) async {
    return await ApiService.put('/startups/projects/$projectId', body: data);
  }

  static Future<Map<String, dynamic>> getDocuments() async {
    return await ApiService.get('/startups/documents');
  }

  static Future<Map<String, dynamic>> getOffers() async {
    return await ApiService.get('/startups/offers');
  }

  static Future<Map<String, dynamic>> updateOfferStatus(String offerType, int offerId, String status) async {
    return await ApiService.patch('/startups/offers/$offerType/$offerId', body: {'status': status});
  }

  static Future<Map<String, dynamic>> getSessions() async {
    return await ApiService.get('/startups/sessions');
  }

  static Future<Map<String, dynamic>> createSession(Map<String, dynamic> data) async {
    return await ApiService.post('/startups/sessions', body: data);
  }

  static Future<Map<String, dynamic>> getInvestorRecommendations({int limit = 10}) async {
    return await ApiService.get('/startups/recommendations/investors', queryParams: {'limit': limit.toString()});
  }

  static Future<Map<String, dynamic>> getMentorRecommendations() async {
    return await ApiService.get('/startups/recommendations/mentors');
  }

  static Future<Map<String, dynamic>> discoverInvestors({String? search, String? industry}) async {
    final params = <String, String>{};
    if (search != null) params['search'] = search;
    if (industry != null) params['industry'] = industry;
    return await ApiService.get('/startups/discover/investors', queryParams: params);
  }

  static Future<Map<String, dynamic>> discoverMentors({String? search, String? industry}) async {
    final params = <String, String>{};
    if (search != null) params['search'] = search;
    if (industry != null) params['industry'] = industry;
    return await ApiService.get('/startups/discover/mentors', queryParams: params);
  }

  static Future<Map<String, dynamic>> getInvestorDetail(int investorId) async {
    return await ApiService.get('/startups/discover/investors/$investorId');
  }

  static Future<Map<String, dynamic>> getMentorDetail(int mentorId) async {
    return await ApiService.get('/startups/discover/mentors/$mentorId');
  }

  static Future<Map<String, dynamic>> expressInterest(int investorId) async {
    return await ApiService.post('/startups/discover/investors/$investorId/interest');
  }

  static Future<Map<String, dynamic>> applyToInvestor(int investorId, String message) async {
    return await ApiService.post('/startups/discover/investors/$investorId/apply', body: {'message': message});
  }

  static Future<Map<String, dynamic>> requestMentor(int mentorId, String message) async {
    return await ApiService.post('/startups/discover/mentors/$mentorId/request', body: {'message': message});
  }

  static Future<Map<String, dynamic>> createInvestmentRequest(Map<String, dynamic> data) async {
    return await ApiService.post('/startups/investment-requests', body: data);
  }

  static Future<Map<String, dynamic>> createMentorshipRequest(Map<String, dynamic> data) async {
    return await ApiService.post('/startups/mentorship-requests', body: data);
  }
}
