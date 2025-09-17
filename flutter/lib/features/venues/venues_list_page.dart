import 'package:flutter/material.dart';

class VenuesListPage extends StatelessWidget {
  const VenuesListPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Locali')),
      body: const Center(child: Text('Lista Locali (placeholder)')),
    );
  }
}
