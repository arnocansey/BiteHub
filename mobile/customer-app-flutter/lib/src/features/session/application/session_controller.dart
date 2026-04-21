import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../domain/app_session.dart';

final sessionControllerProvider =
    NotifierProvider<SessionController, AppSession>(SessionController.new);

class SessionController extends Notifier<AppSession> {
  @override
  AppSession build() => const AppSession.unauthenticated();

  void signIn({required String firstName, required String email}) {
    state = AppSession.authenticated(firstName: firstName, email: email);
  }

  void signOut() {
    state = const AppSession.unauthenticated();
  }
}
