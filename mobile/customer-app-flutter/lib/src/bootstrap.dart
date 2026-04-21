import 'package:flutter_dotenv/flutter_dotenv.dart';

Future<void> bootstrap() async {
  await dotenv.load(fileName: '.env');
}
