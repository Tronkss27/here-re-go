import 'package:flutter/material.dart';

class RatingBadge extends StatelessWidget {
  final double rating;
  const RatingBadge({super.key, required this.rating});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.6),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.star, color: Colors.yellow, size: 14),
          const SizedBox(width: 4),
          Text(rating.toStringAsFixed(1), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}


