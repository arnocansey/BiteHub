import 'package:flutter/material.dart';

class BiteHubLogo extends StatelessWidget {
  const BiteHubLogo({super.key, this.showWordmark = true, this.iconSize = 48});

  final bool showWordmark;
  final double iconSize;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Image.asset(
          'assets/images/bitehub-icon.png',
          width: iconSize,
          height: iconSize,
          fit: BoxFit.contain,
        ),
        if (showWordmark) ...[
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'BiteHub',
                style: theme.textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w800,
                ),
              ),
              Text(
                'Fast food, cleaner delivery',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: const Color(0xFF66726A),
                ),
              ),
            ],
          ),
        ],
      ],
    );
  }
}
