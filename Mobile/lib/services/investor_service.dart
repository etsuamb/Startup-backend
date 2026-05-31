import 'api_service.dart';

class InvestorService {
  static Future<Map<String, dynamic>> getProfile() async {
    return await ApiService.get('/investors/profile');
  }

  static Future<Map<String, dynamic>> createProfile(Map<String, dynamic> data) async {
    return await ApiService.post('/investors/profile', body: data);
  }

  static Future<Map<String, dynamic>> getSettings() async {
    return await ApiService.get('/investors/settings');
  }

  static Future<Map<String, dynamic>> updateSettings(Map<String, dynamic> data) async {
    return await ApiService.put('/investors/settings', body: data);
  }

  static Future<Map<String, dynamic>> changePassword(String currentPassword, String newPassword) async {
    return await ApiService.patch('/investors/settings/password', body: {
      'currentPassword': currentPassword,
      'newPassword': newPassword,
    });
  }

  static Future<Map<String, dynamic>> getStartups({int page = 1, int limit = 20}) async {
    return await ApiService.get('/investors/startups', queryParams: {
      'page': page.toString(),
      'limit': limit.toString(),
    });
  }

  static Future<Map<String, dynamic>> searchStartups({String? search, String? industry, String? stage}) async {
    final params = <String, String>{};
    if (search != null) params['search'] = search;
    if (industry != null) params['industry'] = industry;
    if (stage != null) params['stage'] = stage;
    return await ApiService.get('/investors/startups/search', queryParams: params);
  }

  static Future<Map<String, dynamic>> getStartupDetail(int startupId) async {
    return await ApiService.get('/investors/startups/$startupId');
  }

  static Future<Map<String, dynamic>> getRecommendations({int limit = 10}) async {
    return await ApiService.get('/investors/recommendations', queryParams: {'limit': limit.toString()});
  }

  static Future<Map<String, dynamic>> getFundingOffers() async {
    return await ApiService.get('/investors/funding-offers');
  }

  static Future<Map<String, dynamic>> createFundingOffer(Map<String, dynamic> data) async {
    return await ApiService.post('/investors/funding-offers', body: data);
  }

  static Future<Map<String, dynamic>> acceptFundingOffer(int offerId) async {
    return await ApiService.patch('/investors/funding-offers/$offerId/accept');
  }

  static Future<Map<String, dynamic>> withdrawFundingOffer(int offerId) async {
    return await ApiService.patch('/investors/funding-offers/$offerId/withdraw');
  }

  static Future<Map<String, dynamic>> getPortfolio() async {
    return await ApiService.get('/investors/portfolio');
  }

  static Future<Map<String, dynamic>> getMeetings() async {
    return await ApiService.get('/investors/meetings');
  }

  static Future<Map<String, dynamic>> createMeeting(Map<String, dynamic> data) async {
    return await ApiService.post('/investors/meetings', body: data);
  }

  static Future<Map<String, dynamic>> updateMeeting(int meetingId, Map<String, dynamic> data) async {
    return await ApiService.patch('/investors/meetings/$meetingId', body: data);
  }

  static Future<Map<String, dynamic>> sendFeedback(int startupId, String comment, {int? rating}) async {
    return await ApiService.post('/investors/startups/$startupId/feedback', body: {
      'comment': comment,
      if (rating != null) 'rating': rating,
    });
  }
}
