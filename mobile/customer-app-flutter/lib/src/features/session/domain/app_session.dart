enum SessionStatus { authenticated, unauthenticated }

class AppSession {
  const AppSession.authenticated({required this.firstName, required this.email})
    : status = SessionStatus.authenticated;

  const AppSession.unauthenticated()
    : status = SessionStatus.unauthenticated,
      firstName = null,
      email = null;

  final SessionStatus status;
  final String? firstName;
  final String? email;

  bool get isAuthenticated => status == SessionStatus.authenticated;
}
