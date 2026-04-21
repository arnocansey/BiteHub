import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/widgets/bitehub_logo.dart';
import '../../session/application/session_controller.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> {
  @override
  void initState() {
    super.initState();
    Future<void>.delayed(const Duration(milliseconds: 1100), () {
      if (!mounted) return;
      final session = ref.read(sessionControllerProvider);
      context.go(session.isAuthenticated ? '/app' : '/sign-in');
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: DecoratedBox(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFF0E2717), Color(0xFF07120B)],
          ),
        ),
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: const [
              BiteHubLogo(showWordmark: false, iconSize: 88),
              SizedBox(height: 28),
              Text(
                'BiteHub Customer',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 28,
                  fontWeight: FontWeight.w800,
                ),
              ),
              SizedBox(height: 8),
              Text(
                'Hot meals. Smart routing. Better delivery.',
                style: TextStyle(color: Color(0xFFE7F4EB), fontSize: 15),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
