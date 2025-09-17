import 'package:flutter/material.dart';

class ServicePill extends StatelessWidget {
  final String label;
  final bool selected;
  const ServicePill({super.key, required this.label, this.selected = false});

  @override
  Widget build(BuildContext context) {
    final border = Theme.of(context).dividerColor;
    final color = selected ? Theme.of(context).colorScheme.primary : border;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: color),
      ),
      child: Text(label, style: TextStyle(fontWeight: FontWeight.w600, color: selected ? Theme.of(context).colorScheme.primary : null)),
    );
  }
}


