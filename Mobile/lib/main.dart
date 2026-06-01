import 'package:flutter/material.dart';
import 'ui/theme/app_theme.dart';
import 'ui/home_page.dart';
import 'services/api_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await ApiService.init();
  runApp(const StartupConnectApp());
}

class StartupConnectApp extends StatelessWidget {
  const StartupConnectApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'StartupConnect',
      debugShowCheckedModeBanner: false,
      theme: buildTheme(),
      home: const HomePage(),
    );
  }
}
