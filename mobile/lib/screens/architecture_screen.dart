import 'package:flutter/material.dart';

import '../theme/app_theme.dart';
import '../widgets/app_scaffold.dart';
import '../widgets/common.dart';

class _ArchLayer {
  final String title;
  final String description;
  final IconData icon;
  final List<String> items;
  const _ArchLayer({required this.title, required this.description, required this.icon, required this.items});
}

const _layers = [
  _ArchLayer(
    title: 'Edge Layer (Village PHC / Sub-Centre)',
    description: 'Runs fully offline on low-cost Android hardware at the point of care.',
    icon: Icons.sensors_outlined,
    items: [
      'Simulated wearable patch: heart rate, SpO2, temperature, single-lead ECG',
      'Flutter mobile app: registration, live monitoring, AI screening, clinical copilot',
      'Local SQLite cache + SharedPreferences for offline-first operation',
      'On-device SHA-256 hashing for every patient record',
    ],
  ),
  _ArchLayer(
    title: 'AI Screening Layer',
    description: 'Deterministic, explainable rule engine — not a black box.',
    icon: Icons.psychology_outlined,
    items: [
      'Vitals thresholds (HR, SpO2, temperature) scored against clinical ranges',
      'ECG abnormality and short-term trend analysis',
      'Bilingual (Tamil / English) symptom keyword matching',
      'Every score ships with a plain-language list of contributing reasons',
    ],
  ),
  _ArchLayer(
    title: 'Application / API Layer',
    description: 'FastAPI (Python) service — the single source of truth once connectivity is available.',
    icon: Icons.dns_outlined,
    items: [
      'REST API: patients, screenings, referrals, doctor reviews, consent',
      'SQLite backend, portable to PostgreSQL for multi-PHC deployments',
      'Role-based access control (Admin / Healthcare Worker / Doctor / Specialist / Auditor)',
      'Dashboard aggregation endpoint for real-time PHC overview',
    ],
  ),
  _ArchLayer(
    title: 'Trust & Audit Layer',
    description: 'A local permissioned blockchain — not a public chain, no cryptocurrency.',
    icon: Icons.link_outlined,
    items: [
      'Every clinical action becomes a transaction: created, consented, screened, referred, reviewed, accessed',
      'Transactions are grouped into blocks chained by previousHash → currentHash',
      'Full-chain verification detects any tampering in one pass',
      'Only pseudonymous metadata is on-chain; clinical data stays off-chain and encrypted at rest',
    ],
  ),
  _ArchLayer(
    title: 'Telemedicine / Referral Layer',
    description: 'Connects the village to the next level of care.',
    icon: Icons.send_outlined,
    items: [
      'Smart Referral maps risk level → care level (PHC / District Hospital / Tertiary Centre)',
      'Specialist routing (e.g. Cardiology) for high-risk cardiac findings',
      'Sync queue replays pending actions once connectivity returns',
    ],
  ),
];

/// Static architecture overview: edge device, AI engine, API/backend,
/// blockchain audit layer, and telemedicine referral layer. Mirrors
/// Architecture.tsx.
class ArchitectureScreen extends StatelessWidget {
  const ArchitectureScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      currentRoute: '/architecture',
      title: 'Architecture',
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const SectionHeader(
            title: 'System Architecture',
            subtitle: 'Edge-first design: every layer keeps working offline, and syncs upward when connectivity allows.',
          ),
          const AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Data Flow', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5)),
                SizedBox(height: 10),
                Wrap(
                  crossAxisAlignment: WrapCrossAlignment.center,
                  spacing: 6,
                  runSpacing: 8,
                  children: [
                    _FlowChip(label: 'Wearable Sensors'),
                    _FlowArrow(),
                    _FlowChip(label: 'Flutter App (Edge)'),
                    _FlowArrow(),
                    _FlowChip(label: 'AI Screening Engine'),
                    _FlowArrow(),
                    _FlowChip(label: 'FastAPI Backend'),
                    _FlowArrow(),
                    _FlowChip(label: 'Blockchain Audit'),
                    _FlowArrow(),
                    _FlowChip(label: 'Doctor / Telemedicine'),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          ..._layers.map(
            (layer) => Padding(
              padding: const EdgeInsets.only(bottom: 14),
              child: AppCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 36,
                          height: 36,
                          alignment: Alignment.center,
                          decoration: BoxDecoration(color: AppColors.brand50, borderRadius: BorderRadius.circular(10)),
                          child: Icon(layer.icon, size: 18, color: AppColors.brand700),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(layer.title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5)),
                              Text(layer.description, style: const TextStyle(fontSize: 11.5, color: AppColors.slate500)),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    ...layer.items.map(
                      (i) => Padding(
                        padding: const EdgeInsets.only(bottom: 6),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Padding(
                              padding: EdgeInsets.only(top: 3),
                              child: Icon(Icons.circle, size: 5, color: AppColors.slate400),
                            ),
                            const SizedBox(width: 8),
                            Expanded(child: Text(i, style: const TextStyle(fontSize: 12, color: AppColors.slate700))),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Technology Stack', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5)),
                SizedBox(height: 8),
                Text(
                  'Flutter (Dart) mobile app · FastAPI (Python) + SQLite backend · Provider state management · '
                  'shared_preferences offline cache · custom local permissioned blockchain · SHA-256 hashing (crypto package).',
                  style: TextStyle(fontSize: 12, color: AppColors.slate700, height: 1.4),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _FlowChip extends StatelessWidget {
  final String label;
  const _FlowChip({required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(color: AppColors.brand50, borderRadius: BorderRadius.circular(999)),
      child: Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.brand700)),
    );
  }
}

class _FlowArrow extends StatelessWidget {
  const _FlowArrow();

  @override
  Widget build(BuildContext context) {
    return const Icon(Icons.arrow_forward, size: 14, color: AppColors.slate400);
  }
}
