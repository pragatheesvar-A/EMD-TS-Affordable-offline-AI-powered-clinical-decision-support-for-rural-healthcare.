import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../state/app_state.dart';
import '../theme/app_theme.dart';
import '../widgets/app_scaffold.dart';
import '../widgets/common.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AppState>().refreshDashboardSummary();
    });
  }

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();
    final summary = appState.dashboardSummary;

    return AppScaffold(
      currentRoute: '/',
      title: 'Dashboard',
      body: RefreshIndicator(
        onRefresh: () => appState.refreshDashboardSummary(),
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            const SectionHeader(
              title: 'PHC Healthcare Worker Dashboard',
              subtitle: "Overview of today's screening activity across your primary health centre.",
            ),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => Navigator.of(context).pushNamed('/registration'),
                    icon: const Icon(Icons.add_circle_outline, size: 18),
                    label: const Text('New Screening'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () => Navigator.of(context).pushNamed('/demo'),
                    icon: const Icon(Icons.auto_awesome, size: 18),
                    label: const Text('Run Demo'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 1.5,
              children: [
                StatTile(label: 'Total Patients Today', value: '${summary.patientsToday}', icon: Icons.people_outline, tint: AppColors.brand600, tintBg: AppColors.brand50),
                StatTile(label: 'Active Monitoring', value: '${summary.activeMonitoring}', icon: Icons.monitor_heart_outlined, tint: AppColors.riskLow, tintBg: AppColors.riskLowBg),
                StatTile(label: 'High Priority', value: '${summary.highPriority}', icon: Icons.warning_amber_outlined, tint: AppColors.riskHigh, tintBg: AppColors.riskHighBg),
                StatTile(label: 'Pending Referrals', value: '${summary.pendingReferrals}', icon: Icons.send_outlined, tint: AppColors.riskModerate, tintBg: AppColors.riskModerateBg),
              ],
            ),
            const SizedBox(height: 16),
            AppCard(
              padding: const EdgeInsets.symmetric(vertical: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 16),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Recent Patients', style: TextStyle(fontWeight: FontWeight.w700)),
                        AppBadge(text: 'DEMO DATA', color: Color(0xFF7C3AED), background: Color(0xFFF3E8FF)),
                      ],
                    ),
                  ),
                  const SizedBox(height: 8),
                  if (summary.recentPatients.isEmpty)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 24),
                      child: EmptyState(title: 'No patients yet', subtitle: 'Register your first patient to get started.'),
                    )
                  else
                    ...summary.recentPatients.map((rp) {
                      final p = rp.patient;
                      return ListTile(
                        leading: CircleAvatar(
                          backgroundColor: AppColors.brand50,
                          child: Text(p.name.isNotEmpty ? p.name[0] : '?', style: const TextStyle(color: AppColors.brand700, fontWeight: FontWeight.w700)),
                        ),
                        title: Text(p.name, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                        subtitle: Text('${p.age} yrs · ${p.gender} · ${p.village}', style: const TextStyle(fontSize: 12)),
                        trailing: rp.latestRiskLevel != null
                            ? RiskBadge(level: rp.latestRiskLevel!)
                            : const AppBadge(text: 'Not screened'),
                        onTap: () {
                          appState.setActivePatientId(p.id);
                          Navigator.of(context).pushNamed('/timeline');
                        },
                      );
                    }),
                ],
              ),
            ),
            if (!appState.backendReachable) ...[
              const SizedBox(height: 12),
              const AppCard(
                child: Row(
                  children: [
                    Icon(Icons.info_outline, size: 18, color: AppColors.slate500),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        "Showing cached data — couldn't reach the EMD-TS backend. Check the server address in Settings.",
                        style: TextStyle(fontSize: 12, color: AppColors.slate500),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
