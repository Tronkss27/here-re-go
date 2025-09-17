import 'package:dio/dio.dart';

class SportsApiClient {
  final Dio _dio;
  final String baseUrl;

  SportsApiClient({String? base})
      : baseUrl = base ?? const String.fromEnvironment('API_BASE', defaultValue: 'http://localhost:3001/api'),
        _dio = Dio(BaseOptions(baseUrl: base ?? const String.fromEnvironment('API_BASE', defaultValue: 'http://localhost:3001/api')));

  Future<Map<String, dynamic>> health() async {
    final res = await _dio.get('/health');
    return res.data as Map<String, dynamic>;
  }

  Future<Response> trackMatchClick(String matchId) {
    return _dio.post('/analytics/match-click', data: {'matchId': matchId});
  }

  Future<Response> getPublicVenues() {
    return _dio.get('/venues/public');
  }

  Future<Response> getGlobalMatches() {
    return _dio.get('/global-matches');
  }
}
