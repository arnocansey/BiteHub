import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/presentation/sign_in_screen.dart';
import '../../features/home/presentation/customer_shell_screen.dart';
import '../../features/session/application/session_controller.dart';
import '../../features/splash/presentation/splash_screen.dart';

final navigatorKeyProvider = Provider<GlobalKey<NavigatorState>>((ref) {
  return GlobalKey<NavigatorState>();
});

final appRouterProvider = Provider<GoRouter>((ref) {
  final navigatorKey = ref.watch(navigatorKeyProvider);
  final session = ref.watch(sessionControllerProvider);

  return GoRouter(
    navigatorKey: navigatorKey,
    initialLocation: '/splash',
    routes: [
      GoRoute(
        path: '/splash',
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: '/sign-in',
        builder: (context, state) => const SignInScreen(),
      ),
      GoRoute(
        path: '/app',
        builder: (context, state) => const CustomerShellScreen(),
      ),
    ],
    redirect: (_, state) {
      final authenticated = session.isAuthenticated;
      final goingToSplash = state.matchedLocation == '/splash';
      final goingToSignIn = state.matchedLocation == '/sign-in';

      if (goingToSplash) {
        return null;
      }

      if (!authenticated && !goingToSignIn) {
        return '/sign-in';
      }

      if (authenticated && goingToSignIn) {
        return '/app';
      }

      return null;
    },
  );
});
