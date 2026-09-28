import 'package:flutter/material.dart';

import '../theme/app_theme.dart';
import '../widgets/app_scaffold.dart';
import '../widgets/common.dart';

class _RevenueStream {
  final String title;
  final String detail;
  final IconData icon;
  const _RevenueStream({required this.title, required this.detail, required this.icon});
}

const _revenueStreams = [
  _RevenueStream(
    title: 'Government & PHC Licensing (B2G)',
    detail: 'Per-PHC / per-district annual licence for state health departments deploying EMD-TS across primary health centres and sub-centres.',
    icon: Icons.account_balance_outlined,
  ),
  _RevenueStream(
    title: 'NGO & CSR Partnerships',
    detail: 'Sponsored device + software bundles for underserved districts, funded through healthcare CSR programs.',
    icon: Icons.volunteer_activism_outlined,
  ),
  _RevenueStream(
    title: 'Hardware Bundling',
    detail: 'Margin on the low-cost wearable patch and Android tablet bundled with the software for first-time PHC deployments.',
    icon: Icons.watch_outlined,
  ),
  _RevenueStream(
    title: 'Specialist Telemedicine Network (SaaS)',
    detail: 'Subscription for district hospitals and specialists to receive smart referrals and run the Doctor Dashboard / Clinical Copilot.',
    icon: Icons.medical_services_outlined,
  ),
  _RevenueStream(
    title: 'Analytics & Population Health Insights',
    detail: 'Aggregated, de-identified population-health dashboards for health departments and research institutions (opt-in, consent-gated).',
    icon: Icons.insights_outlined,
  ),
];

class _AudienceCard {
  final String title;
  final String detail;
  final IconData icon;
  const _AudienceCard({required this.title, required this.detail, required this.icon});
}

const _audience = [
  _AudienceCard(
    title: 'Village-side Patients',
    detail: 'First-mile access to real diagnostic screening without traveling to a district hospital.',
    icon: Icons.groups_outlined,
  ),
  _AudienceCard(
    title: 'ANMs / Healthcare Workers',
    detail: 'A guided, offline-first tool that turns basic vitals into an explainable risk score in the field.',
    icon: Icons.badge_outlined,
  ),
  _AudienceCard(
    title: 'Doctors & Specialists',
    detail: 'A prioritized worklist and clinical copilot instead of unstructured case notes.',
    icon: Icons.local_hospital_outlined,
  ),
  _AudienceCard(
    title: 'Health Departments / Government',
    detail: 'District and state-level visibility into screening coverage, referral load, and outcomes.',
    icon: Icons.public_outlined,
  ),
];

/// Business model page: revenue streams, target audience, and go-to-market
/// positioning for a village/PHC-first, industry-grade healthcare product.
class BusinessModelScreen extends StatelessWidget {
  const BusinessModelScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      currentRoute: '/business',
      title: 'Business Model',
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const SectionHeader(
            title: 'Business Model',
            subtitle: 'An industry-grade product for public health systems, priced for village-scale reach.',
          ),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [AppColors.brand600, AppColors.brand800]),
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Better Information. Faster Screening. Connected Care.',
                    style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w800, height: 1.3)),
                SizedBox(height: 8),
                Text(
                  'EMD-TS positions itself as critical public-health infrastructure: an offline-first edge diagnostic '
                  'layer for the last mile, backed by an auditable trust layer for regulators and a telemedicine bridge '
                  'to specialists.',
                  style: TextStyle(color: Colors.white70, fontSize: 12.5, height: 1.4),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          const Text('Target Audience', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: AppColors.slate900)),
          const SizedBox(height: 10),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 0.95,
            children: _audience
                .map((a) => AppCard(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            width: 34,
                            height: 34,
                            alignment: Alignment.center,
                            decoration: BoxDecoration(color: AppColors.brand50, borderRadius: BorderRadius.circular(10)),
                            child: Icon(a.icon, size: 17, color: AppColors.brand700),
                          ),
                          const SizedBox(height: 8),
                          Text(a.title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12.5)),
                          const SizedBox(height: 4),
                          Text(a.detail, style: const TextStyle(fontSize: 10.5, color: AppColors.slate500, height: 1.3)),
                        ],
                      ),
                    ))
                .toList(),
          ),
          const SizedBox(height: 20),
          const Text('Revenue Streams', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: AppColors.slate900)),
          const SizedBox(height: 10),
          ..._revenueStreams.map(
            (r) => Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: AppCard(
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 36,
                      height: 36,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(color: AppColors.riskLowBg, borderRadius: BorderRadius.circular(10)),
                      child: Icon(r.icon, size: 18, color: AppColors.riskLow),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(r.title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                          const SizedBox(height: 3),
                          Text(r.detail, style: const TextStyle(fontSize: 11.5, color: AppColors.slate500, height: 1.35)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 6),
          const AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Why Now', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5)),
                SizedBox(height: 8),
                Text(
                  'Rising smartphone/tablet penetration at the PHC level, national digital health mission (ABDM-aligned '
                  'identifiers), growing acceptance of telemedicine post-2020, and a persistent shortage of specialists '
                  'in rural India make an offline-first, explainable, auditable screening layer a timely investment for '
                  'state health missions and CSR-funded rural health programs.',
                  style: TextStyle(fontSize: 12, color: AppColors.slate700, height: 1.45),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
