import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../session/application/session_controller.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final session = ref.watch(sessionControllerProvider);

    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 18, 20, 120),
        children: [
          Text('Profile', style: theme.textTheme.headlineMedium),
          const SizedBox(height: 18),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 28,
                    backgroundColor: const Color(0xFFFFEFE1),
                    child: Text(
                      (session.firstName ?? 'C').substring(0, 1).toUpperCase(),
                      style: theme.textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          session.firstName ?? 'Customer',
                          style: theme.textTheme.titleLarge,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          session.email ?? 'customer@bitehub.app',
                          style: theme.textTheme.bodyMedium,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 18),
          const _ProfileTile(
            icon: Icons.pin_drop_outlined,
            title: 'Saved addresses',
            subtitle: 'Manage home, office, and delivery notes',
          ),
          const SizedBox(height: 12),
          const _ProfileTile(
            icon: Icons.payments_outlined,
            title: 'Payment methods',
            subtitle: 'Cards, wallets, and checkout preferences',
          ),
          const SizedBox(height: 12),
          const _ProfileTile(
            icon: Icons.support_agent_outlined,
            title: 'Support',
            subtitle: 'Order help, refunds, and delivery issues',
          ),
          const SizedBox(height: 20),
          OutlinedButton(
            onPressed: () {
              ref.read(sessionControllerProvider.notifier).signOut();
              context.go('/sign-in');
            },
            child: const Text('Sign out'),
          ),
        ],
      ),
    );
  }
}

class _ProfileTile extends StatelessWidget {
  const _ProfileTile({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      child: ListTile(
        leading: Icon(icon),
        title: Text(
          title,
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w700,
          ),
        ),
        subtitle: Text(subtitle, style: theme.textTheme.bodyMedium),
        trailing: const Icon(Icons.chevron_right_rounded),
      ),
    );
  }
}
