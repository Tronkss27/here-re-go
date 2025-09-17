import 'package:flutter/material.dart';
import '../shared/cta_button.dart';

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('HERE,WE,GO'),
        centerTitle: false,
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        children: [
          Row(children: const [
            _ChipFilter(label: 'Più calde'),
            SizedBox(width: 8),
            _ChipFilter(label: 'Domani'),
            SizedBox(width: 8),
            _ChipFilter(label: 'Gio 18'),
          ]),
          const SizedBox(height: 20),
          Text('PARTITE PIÙ CALDE', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 12),
          _MatchCard(league: 'La Liga', home: 'Real Madrid', away: 'Barcellona', date: '18/09 · 20:45'),
          const SizedBox(height: 12),
          _MatchCard(league: 'Serie A', home: 'AC Milan', away: 'Inter', date: '18/09 · 20:45'),
        ],
      ),
    );
  }
}

class _ChipFilter extends StatelessWidget {
  final String label;
  const _ChipFilter({required this.label});
  @override
  Widget build(BuildContext context) {
    return Chip(
      label: Text(label),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
    );
  }
}

class _MatchCard extends StatelessWidget {
  final String league;
  final String home;
  final String away;
  final String date;
  const _MatchCard({required this.league, required this.home, required this.away, required this.date});
  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              Container(width: 20, height: 14, color: Theme.of(context).colorScheme.primary, margin: const EdgeInsets.only(right: 8)),
              Text(league, style: Theme.of(context).textTheme.labelSmall),
            ]),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(child: Text(home, style: Theme.of(context).textTheme.titleLarge)),
                const SizedBox(width: 12),
                Expanded(child: Text(away, textAlign: TextAlign.right, style: Theme.of(context).textTheme.titleLarge)),
              ],
            ),
            const SizedBox(height: 12),
            Row(children: [
              Expanded(child: Text(date, style: Theme.of(context).textTheme.bodyMedium)),
              const SizedBox(width: 12),
              CtaButton(label: 'TROVA LOCALI', onPressed: () {}),
            ])
          ],
        ),
      ),
    );
  }
}
