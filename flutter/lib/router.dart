import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'features/home/home_page.dart';
import 'features/venues/venues_list_page.dart';
import 'features/venues/venue_detail_page.dart';
import 'features/admin/admin_shell.dart';
import 'features/admin/dashboard/dashboard_page.dart';
import 'features/admin/analytics/analytics_page.dart';
import 'features/admin/calendar/calendar_page.dart';

GoRouter buildRouter() {
  return GoRouter(
    routes: [
      GoRoute(
        path: '/',
        builder: (context, state) => const HomePage(),
      ),
      GoRoute(
        path: '/locali',
        builder: (context, state) => const VenuesListPage(),
      ),
      GoRoute(
        path: '/locale/:id',
        builder: (context, state) => VenueDetailPage(id: state.pathParameters['id']!),
      ),
      ShellRoute(
        builder: (context, state, child) => AdminShell(child: child),
        routes: [
          GoRoute(
            path: '/admin',
            builder: (context, state) => const AdminDashboardPage(),
            routes: [
              GoRoute(
                path: 'statistiche',
                builder: (context, state) => const AnalyticsPage(),
              ),
              GoRoute(
                path: 'calendario',
                builder: (context, state) => const CalendarPage(),
              ),
            ],
          ),
        ],
      ),
    ],
  );
}
