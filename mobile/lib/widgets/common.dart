import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class AppCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;

  const AppCard({super.key, required this.child, this.padding = const EdgeInsets.all(16)});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: padding,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.slate200),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 6, offset: const Offset(0, 2)),
        ],
      ),
      child: child,
    );
  }
}

class SectionHeader extends StatelessWidget {
  final String title;
  final String? subtitle;
  final Widget? action;

  const SectionHeader({super.key, required this.title, this.subtitle, this.action});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: AppColors.slate900)),
                if (subtitle != null) ...[
                  const SizedBox(height: 4),
                  Text(subtitle!, style: const TextStyle(fontSize: 13, color: AppColors.slate500)),
                ],
              ],
            ),
          ),
          if (action != null) action!,
        ],
      ),
    );
  }
}

class RiskBadge extends StatelessWidget {
  final String level; // LOW | MODERATE | HIGH
  const RiskBadge({super.key, required this.level});

  String get _label {
    switch (level) {
      case 'HIGH':
        return 'High Priority';
      case 'MODERATE':
        return 'Moderate Priority';
      default:
        return 'Low Priority';
    }
  }

  @override
  Widget build(BuildContext context) {
    final color = AppColors.riskColor(level);
    final bg = AppColors.riskBgColor(level);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: color.withValues(alpha: 0.25)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(width: 6, height: 6, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
          const SizedBox(width: 6),
          Text(_label, style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}

class AppBadge extends StatelessWidget {
  final String text;
  final Color color;
  final Color background;

  const AppBadge({super.key, required this.text, this.color = AppColors.slate600, this.background = AppColors.slate100});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(color: background, borderRadius: BorderRadius.circular(6)),
      child: Text(text, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w600)),
    );
  }
}

class StatTile extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color tint;
  final Color tintBg;

  const StatTile({
    super.key,
    required this.label,
    required this.value,
    required this.icon,
    this.tint = AppColors.brand600,
    this.tintBg = AppColors.brand50,
  });

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: const TextStyle(fontSize: 12, color: AppColors.slate500)),
              const SizedBox(height: 6),
              Text(value, style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: AppColors.slate900)),
            ],
          ),
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(color: tintBg, borderRadius: BorderRadius.circular(12)),
            child: Icon(icon, color: tint, size: 20),
          ),
        ],
      ),
    );
  }
}

class EmptyState extends StatelessWidget {
  final String title;
  final String? subtitle;
  final IconData? icon;

  const EmptyState({super.key, required this.title, this.subtitle, this.icon});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 40),
      child: Column(
        children: [
          if (icon != null) Icon(icon, size: 32, color: AppColors.slate400),
          if (icon != null) const SizedBox(height: 10),
          Text(title, style: const TextStyle(color: AppColors.slate600, fontWeight: FontWeight.w600)),
          if (subtitle != null) ...[
            const SizedBox(height: 4),
            Text(subtitle!, textAlign: TextAlign.center, style: const TextStyle(color: AppColors.slate400, fontSize: 13)),
          ],
        ],
      ),
    );
  }
}

class VerifiedPill extends StatelessWidget {
  final bool ok;
  const VerifiedPill({super.key, required this.ok});

  @override
  Widget build(BuildContext context) {
    final color = ok ? AppColors.riskLow : AppColors.riskHigh;
    return Text(
      ok ? '✓ Verified' : '✗ Failed',
      style: TextStyle(color: color, fontWeight: FontWeight.w700, fontSize: 12),
    );
  }
}
