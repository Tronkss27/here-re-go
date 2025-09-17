import 'package:flutter/material.dart';

class VenueDetailPage extends StatelessWidget {
  final String id;
  const VenueDetailPage({super.key, required this.id});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Locale $id')),
      body: const Center(child: Text('Dettaglio Locale (placeholder)')),
    );
  }
}
