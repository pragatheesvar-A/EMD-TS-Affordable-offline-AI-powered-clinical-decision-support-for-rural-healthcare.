import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/enums.dart';
import '../state/app_state.dart';
import '../theme/app_theme.dart';

class NavDestination {
  final String route;
  final String label;
  final IconData icon;
  const NavDestination({required this.route, required this.label, required this.icon});
}

const List<NavDestination> kNavDestinations = [
  NavDestination(route: '/', label: 'Dashboard', icon: Icons.dashboard_outlined),
  NavDestination(route: '/registration', label: 'Patient Registration', icon: Icons.person_add_alt_outlined),
  NavDestination(route: '/monitoring', label: 'Live Monitoring', icon: Icons.monitor_heart_outlined),
  NavDestination(route: '/screening', label: 'AI Screening', icon: Icons.psychology_outlined),
  NavDestination(route: '/timeline', label: 'Patient Timeline', icon: Icons.history_outlined),
  NavDestination(route: '/copilot', label: 'Clinical Copilot', icon: Icons.medical_information_outlined),
  NavDestination(route: '/referral', label: 'Smart Referral', icon: Icons.send_outlined),
  NavDestination(route: '/doctor', label: 'Doctor Dashboard', icon: Icons.assignment_ind_outlined),
  NavDestination(route: '/payment', label: 'Consultation Payment', icon: Icons.payment_outlined),
  NavDestination(route: '/security', label: 'Security Center', icon: Icons.security_outlined),
  NavDestination(route: '/blockchain', label: 'Blockchain Audit', icon: Icons.link_outlined),
  NavDestination(route: '/architecture', label: 'Architecture', icon: Icons.account_tree_outlined),
  NavDestination(route: '/business', label: 'Business Model', icon: Icons.business_center_outlined),
  NavDestination(route: '/settings', label: 'Settings', icon: Icons.settings_outlined),
];

class AppScaffold extends StatelessWidget {
  final String currentRoute;
  final String title;
  final Widget body;
  final Widget? floatingActionButton;

  const AppScaffold({
    super.key,
    required this.currentRoute,
    required this.title,
    required this.body,
    this.floatingActionButton,
  });

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
            const Text('EMD-TS', style: TextStyle(fontSize: 11, color: AppColors.slate400)),
          ],
        ),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 12),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: appState.backendReachable ? AppColors.riskLowBg : AppColors.slate100,
              borderRadius: BorderRadius.circular(999),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  appState.backendReachable ? Icons.wifi : Icons.wifi_off,
                  size: 13,
                  color: appState.backendReachable ? AppColors.riskLow : AppColors.slate500,
                ),
                const SizedBox(width: 4),
                Text(
                  appState.backendReachable ? 'ONLINE' : 'OFFLINE MODE',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: appState.backendReachable ? AppColors.riskLow : AppColors.slate600,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      drawer: _AppDrawer(currentRoute: currentRoute),
      body: SafeArea(child: body),
      floatingActionButton: floatingActionButton,
    );
  }
}

class _AppDrawer extends StatelessWidget {
  final String currentRoute;
  const _AppDrawer({required this.currentRoute});

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();
    return Drawer(
      child: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
              child: Row(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(colors: [AppColors.brand600, AppColors.brand800]),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Text('E', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800)),
                  ),
                  const SizedBox(width: 10),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('EMD-TS', style: TextStyle(fontWeight: FontWeight.w800)),
                        Text('Edge Medical Diagnostics', style: TextStyle(fontSize: 10, color: AppColors.slate400)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const Divider(height: 1),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(vertical: 8),
                children: kNavDestinations.map((d) {
                  final selected = d.route == currentRoute;
                  return ListTile(
                    leading: Icon(d.icon, size: 20, color: selected ? AppColors.brand700 : AppColors.slate600),
                    title: Text(
                      d.label,
                      style: TextStyle(
                        fontSize: 13.5,
                        fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                        color: selected ? AppColors.brand700 : AppColors.slate700,
                      ),
                    ),
                    selected: selected,
                    selectedTileColor: AppColors.brand50,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16),
                    onTap: () {
                      Navigator.pop(context);
                      if (!selected) Navigator.of(context).pushReplacementNamed(d.route);
                    },
                  );
                }).toList(),
              ),
            ),
            const Divider(height: 1),
            Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Role: ${appState.currentRole.displayName}', style: const TextStyle(fontSize: 11, color: AppColors.slate500)),
                  const SizedBox(height: 6),
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: UserRole.values.map((r) {
                      final selected = r == appState.currentRole;
                      return GestureDetector(
                        onTap: () => appState.setRole(r),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: selected ? AppColors.brand50 : AppColors.slate100,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            r.code.replaceAll('_', ' '),
                            style: TextStyle(
                              fontSize: 9.5,
                              fontWeight: FontWeight.w700,
                              color: selected ? AppColors.brand700 : AppColors.slate500,
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
