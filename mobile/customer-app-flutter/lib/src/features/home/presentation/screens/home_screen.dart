import 'package:flutter/material.dart';

import '../../../../core/config/app_environment.dart';
import '../../../../core/widgets/app_section_header.dart';
import '../../../../core/widgets/bitehub_logo.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 18, 20, 120),
        children: [
          Row(
            children: [
              const Expanded(child: BiteHubLogo()),
              IconButton.filledTonal(
                onPressed: () {},
                icon: const Icon(Icons.notifications_none_rounded),
              ),
            ],
          ),
          const SizedBox(height: 22),
          Text('Good afternoon', style: theme.textTheme.bodyLarge),
          const SizedBox(height: 6),
          Text(
            'What are you craving today?',
            style: theme.textTheme.headlineMedium,
          ),
          const SizedBox(height: 18),
          TextField(
            decoration: const InputDecoration(
              prefixIcon: Icon(Icons.search_rounded),
              hintText: 'Search restaurants, meals, or collections',
            ),
          ),
          const SizedBox(height: 18),
          _DeliveryAddressCard(apiBaseUrl: AppEnvironment.apiBaseUrl),
          const SizedBox(height: 24),
          const AppSectionHeader(title: 'Quick actions'),
          const SizedBox(height: 14),
          const Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              _ActionChip(
                icon: Icons.lunch_dining_outlined,
                label: 'Browse meals',
              ),
              _ActionChip(
                icon: Icons.delivery_dining_rounded,
                label: 'Track order',
              ),
              _ActionChip(
                icon: Icons.favorite_border_rounded,
                label: 'Saved stores',
              ),
              _ActionChip(icon: Icons.local_offer_outlined, label: 'Deals'),
            ],
          ),
          const SizedBox(height: 24),
          const AppSectionHeader(title: 'Platform focus'),
          const SizedBox(height: 14),
          const _FeatureShowcase(),
          const SizedBox(height: 24),
          const AppSectionHeader(title: 'Restaurant feed'),
          const SizedBox(height: 14),
          const _EmptyCatalogCard(),
        ],
      ),
    );
  }
}

class _DeliveryAddressCard extends StatelessWidget {
  const _DeliveryAddressCard({required this.apiBaseUrl});

  final String apiBaseUrl;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFEFE1),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: const Icon(
                    Icons.location_on_outlined,
                    color: Color(0xFFFF8A34),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Deliver to', style: theme.textTheme.bodyMedium),
                      const SizedBox(height: 4),
                      Text(
                        'Set your primary delivery address',
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 18),
            Text(
              'API target',
              style: theme.textTheme.labelLarge?.copyWith(
                color: const Color(0xFF66726A),
              ),
            ),
            const SizedBox(height: 6),
            Text(
              apiBaseUrl,
              style: theme.textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ActionChip extends StatelessWidget {
  const _ActionChip({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Chip(
      avatar: Icon(icon, size: 18),
      label: Text(label),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(18),
        side: const BorderSide(color: Color(0xFFE7E1D6)),
      ),
      backgroundColor: Colors.white,
    );
  }
}

class _FeatureShowcase extends StatelessWidget {
  const _FeatureShowcase();

  @override
  Widget build(BuildContext context) {
    return Column(
      children: const [
        _FeatureCard(
          title: 'Fast checkout foundation',
          body:
              'We already have sign-in, routing, theme tokens, and environment loading in place for API integration.',
          accent: Color(0xFFFF8A34),
          icon: Icons.bolt_rounded,
        ),
        SizedBox(height: 12),
        _FeatureCard(
          title: 'Delivery-first shell',
          body:
              'The bottom-tab architecture matches the existing BiteHub customer product: home, orders, saved, and profile.',
          accent: Color(0xFF31C467),
          icon: Icons.delivery_dining_rounded,
        ),
      ],
    );
  }
}

class _FeatureCard extends StatelessWidget {
  const _FeatureCard({
    required this.title,
    required this.body,
    required this.accent,
    required this.icon,
  });

  final String title;
  final String body;
  final Color accent;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: accent.withValues(alpha: 0.14),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Icon(icon, color: accent),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(body, style: theme.textTheme.bodyMedium),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _EmptyCatalogCard extends StatelessWidget {
  const _EmptyCatalogCard();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Image.asset('assets/images/bitehub-mark.png', height: 70),
            const SizedBox(height: 18),
            Text(
              'Restaurant data will appear here',
              style: theme.textTheme.titleLarge,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              'This Flutter foundation is ready for your BiteHub restaurant, collections, and cart endpoints.',
              style: theme.textTheme.bodyMedium,
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
