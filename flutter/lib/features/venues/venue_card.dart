import 'package:flutter/material.dart';
import '../shared/rating_badge.dart';
import '../shared/cta_button.dart';

class VenueCard extends StatelessWidget {
  final String title;
  final String address;
  final double rating;
  final String imageUrl;
  final bool hasOffer;
  const VenueCard({super.key, required this.title, required this.address, required this.rating, required this.imageUrl, this.hasOffer = false});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Stack(children: [
            AspectRatio(
              aspectRatio: 16 / 9,
              child: Image.network(imageUrl, fit: BoxFit.cover, errorBuilder: (_, __, ___) => Container(color: Colors.grey.shade200)),
            ),
            Positioned(top: 8, right: 8, child: RatingBadge(rating: rating)),
            if (hasOffer)
              Positioned(
                bottom: 8,
                left: 8,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(color: Colors.black.withOpacity(0.6), borderRadius: BorderRadius.circular(8)),
                  child: const Text('Offerta', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
                ),
              ),
          ]),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(title, style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 4),
              Text(address, style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Theme.of(context).hintColor)),
              const SizedBox(height: 12),
              Row(children: [
                Expanded(child: CtaButton(label: 'VISUALIZZA', onPressed: () {})),
              ])
            ]),
          )
        ],
      ),
    );
  }
}


