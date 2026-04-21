import 'package:flutter/material.dart';

class SavedScreen extends StatelessWidget {
  const SavedScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 18, 20, 120),
        children: [
          Text('Saved', style: theme.textTheme.headlineMedium),
          const SizedBox(height: 8),
          Text(
            'Favorite restaurants, meals, and quick reorder lists will live here.',
            style: theme.textTheme.bodyLarge,
          ),
          const SizedBox(height: 18),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  const Icon(
                    Icons.favorite_outline_rounded,
                    size: 52,
                    color: Color(0xFF31C467),
                  ),
                  const SizedBox(height: 14),
                  Text('Nothing saved yet', style: theme.textTheme.titleLarge),
                  const SizedBox(height: 8),
                  Text(
                    'This starter leaves room for wishlists, saved restaurants, and personalized reorder shortcuts.',
                    style: theme.textTheme.bodyMedium,
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
