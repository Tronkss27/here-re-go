import 'package:flutter/material.dart';
import 'venue_card.dart';

class VenuesListPage extends StatelessWidget {
  const VenuesListPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Locali')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: const [
          _FiltersRow(),
          SizedBox(height: 16),
          VenueCard(
            title: 'Bar del Centro',
            address: 'Via Roma 10, Milano',
            rating: 4.6,
            imageUrl: 'https://picsum.photos/seed/venue1/800/450',
            hasOffer: true,
          ),
          SizedBox(height: 12),
          VenueCard(
            title: 'Sport Pub Arena',
            address: 'Piazza Duomo 2, Milano',
            rating: 4.3,
            imageUrl: 'https://picsum.photos/seed/venue2/800/450',
          ),
        ],
      ),
    );
  }
}

class _FiltersRow extends StatelessWidget {
  const _FiltersRow();
  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: const [
        FilterChip(label: Text('Pet Friendly'), selected: false, onSelected: null),
        FilterChip(label: Text('Cucina'), selected: false, onSelected: null),
        FilterChip(label: Text('Wi‑Fi'), selected: false, onSelected: null),
        FilterChip(label: Text('Maxischermo'), selected: false, onSelected: null),
      ],
    );
  }
}
