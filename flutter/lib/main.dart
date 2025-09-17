import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'router.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const SportsApp());
}

class SportsApp extends StatelessWidget {
  const SportsApp({super.key});

  @override
  Widget build(BuildContext context) {
    final router = buildRouter();
    return MaterialApp.router(
      title: 'SPOrTS',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF111827)),
        useMaterial3: true,
      ),
      routerConfig: router,
    );
  }
}
