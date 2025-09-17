import 'package:flutter/material.dart';
import '../shared/rating_badge.dart';
import '../shared/service_pill.dart';
import '../shared/cta_button.dart';

class VenueDetailPage extends StatelessWidget {
  final String id;
  const VenueDetailPage({super.key, required this.id});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Locale $id')),
      body: ListView(
        children: [
          // Gallery
          Stack(children: [
            AspectRatio(
              aspectRatio: 16 / 9,
              child: Image.network('https://picsum.photos/seed/venue$id/1200/675', fit: BoxFit.cover),
            ),
            const Positioned(top: 12, right: 12, child: RatingBadge(rating: 4.5)),
          ]),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Bar del Centro', style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 4),
              Text('Via Roma 10, Milano', style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Theme.of(context).hintColor)),
              const SizedBox(height: 12),
              Row(children: [
                Expanded(child: CtaButton(label: 'PRENOTA ORA', onPressed: () {})),
              ]),
            ]),
          ),
          const Divider(),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Servizi', style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 8),
              Wrap(spacing: 8, runSpacing: 8, children: const [
                ServicePill(label: 'Pet Friendly'),
                ServicePill(label: 'Cucina'),
                ServicePill(label: 'Wi‑Fi'),
                ServicePill(label: 'Maxischermo'),
              ]),
            ]),
          ),
          const Divider(),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Orari di apertura', style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 8),
              Table(columnWidths: const {0: FlexColumnWidth(), 1: FlexColumnWidth()}, children: const [
                TableRow(children: [Padding(padding: EdgeInsets.all(8), child: Text('Lun')), Padding(padding: EdgeInsets.all(8), child: Text('10:00 - 23:00'))]),
                TableRow(children: [Padding(padding: EdgeInsets.all(8), child: Text('Mar')), Padding(padding: EdgeInsets.all(8), child: Text('10:00 - 23:00'))]),
                TableRow(children: [Padding(padding: EdgeInsets.all(8), child: Text('Mer')), Padding(padding: EdgeInsets.all(8), child: Text('10:00 - 23:00'))]),
              ]),
            ]),
          ),
          const Divider(),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Partite in programma', style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 12),
              // Placeholder per lista match
              Text('• Milan vs Inter — Gio 18 · 20:45', style: Theme.of(context).textTheme.bodyMedium),
              const SizedBox(height: 6),
              Text('• Real Madrid vs Barça — Sab 21 · 21:00', style: Theme.of(context).textTheme.bodyMedium),
              const SizedBox(height: 16),
            ]),
          ),
        ],
      ),
    );
  }
}
