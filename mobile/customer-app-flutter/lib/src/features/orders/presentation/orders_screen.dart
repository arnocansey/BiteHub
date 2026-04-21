import 'package:flutter/material.dart';

class OrdersScreen extends StatelessWidget {
  const OrdersScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 18, 20, 120),
        children: [
          Text('Orders', style: theme.textTheme.headlineMedium),
          const SizedBox(height: 8),
          Text(
            'Your active and past deliveries will show up here once the order API is connected.',
            style: theme.textTheme.bodyLarge,
          ),
          const SizedBox(height: 18),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  const Icon(
                    Icons.receipt_long_rounded,
                    size: 52,
                    color: Color(0xFFFF8A34),
                  ),
                  const SizedBox(height: 14),
                  Text('No orders yet', style: theme.textTheme.titleLarge),
                  const SizedBox(height: 8),
                  Text(
                    'We can wire this screen next to your customer orders, live tracking, and support timeline endpoints.',
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
