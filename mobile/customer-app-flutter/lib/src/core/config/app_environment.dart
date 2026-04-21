import 'package:flutter_dotenv/flutter_dotenv.dart';

class AppEnvironment {
  AppEnvironment._();

  static String get apiBaseUrl {
    final configured =
        dotenv.maybeGet('API_BASE_URL') ??
        dotenv.maybeGet('EXPO_PUBLIC_API_BASE_URL');
    return (configured?.trim().isNotEmpty ?? false)
        ? configured!.trim()
        : 'http://localhost:4000/api/v1';
  }

  static String get googleMapsApiKey {
    final configured =
        dotenv.maybeGet('GOOGLE_MAPS_API_KEY') ??
        dotenv.maybeGet('EXPO_PUBLIC_GOOGLE_MAPS_API_KEY');
    return configured?.trim() ?? '';
  }
}
