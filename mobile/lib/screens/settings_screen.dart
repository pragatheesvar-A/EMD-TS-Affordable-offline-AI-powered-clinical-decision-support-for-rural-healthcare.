import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/enums.dart';
import '../state/app_state.dart';
import '../theme/app_theme.dart';
import '../widgets/app_scaffold.dart';
import '../widgets/common.dart';

/// Backend connection settings, language toggle, and data-reset control.
/// Mirrors Settings.tsx. The backend base URL matters most on a real
/// device: "localhost" on a phone refers to the phone itself, so when
/// the FastAPI server runs on a laptop for a demo, this must be changed
/// to the laptop's LAN IP (e.g. http://192.168.1.20:8080).
class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  late final TextEditingController _urlController;
  bool _testing = false;
  bool? _pingOk;
  bool _saving = false;
  bool _resetting = false;

  @override
  void initState() {
    super.initState();
    final appState = context.read<AppState>();
    _urlController = TextEditingController(text: appState.api.baseUrl);
  }

  @override
  void dispose() {
    _urlController.dispose();
    super.dispose();
  }

  Future<void> _saveUrl(AppState appState) async {
    final url = _urlController.text.trim();
    if (url.isEmpty) return;
    setState(() => _saving = true);
    await appState.setBaseUrl(url);
    if (mounted) setState(() => _saving = false);
  }

  Future<void> _testConnection(AppState appState) async {
    setState(() {
      _testing = true;
      _pingOk = null;
    });
    final ok = await appState.api.ping();
    if (mounted) {
      setState(() {
        _pingOk = ok;
        _testing = false;
      });
    }
  }

  Future<void> _confirmReset(AppState appState) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Reset all data?'),
        content: const Text(
          'This clears the local cache and asks the backend to reseed the three demo patients. '
          'This cannot be undone.',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.of(dialogContext).pop(false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(true),
            child: const Text('Reset', style: TextStyle(color: AppColors.riskHigh)),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    setState(() => _resetting = true);
    try {
      await appState.resetAllData();
    } finally {
      if (mounted) setState(() => _resetting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();

    return AppScaffold(
      currentRoute: '/settings',
      title: 'Settings',
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const SectionHeader(title: 'Settings', subtitle: 'Backend connection, language, and data controls.'),
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Backend Server', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5)),
                const SizedBox(height: 4),
                const Text(
                  'On a physical device, "localhost" means the phone itself. Use your computer\'s LAN IP when running the FastAPI backend on a laptop.',
                  style: TextStyle(fontSize: 11, color: AppColors.slate400),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: _urlController,
                  keyboardType: TextInputType.url,
                  decoration: const InputDecoration(labelText: 'Base URL', hintText: 'http://192.168.1.20:8080'),
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: _saving ? null : () => _saveUrl(appState),
                        child: Text(_saving ? 'Saving…' : 'Save'),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: _testing ? null : () => _testConnection(appState),
                        child: Text(_testing ? 'Testing…' : 'Test Connection'),
                      ),
                    ),
                  ],
                ),
                if (_pingOk != null) ...[
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Icon(
                        _pingOk! ? Icons.check_circle_outline : Icons.error_outline,
                        size: 16,
                        color: _pingOk! ? AppColors.riskLow : AppColors.riskHigh,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        _pingOk! ? 'Backend reachable' : 'Could not reach backend',
                        style: TextStyle(fontSize: 12.5, color: _pingOk! ? AppColors.riskLow : AppColors.riskHigh, fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 14),
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Language', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5)),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        style: OutlinedButton.styleFrom(
                          backgroundColor: appState.language == AppLanguage.english ? AppColors.brand50 : null,
                        ),
                        onPressed: () => appState.setLanguage(AppLanguage.english),
                        child: const Text('English'),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: OutlinedButton(
                        style: OutlinedButton.styleFrom(
                          backgroundColor: appState.language == AppLanguage.tamil ? AppColors.brand50 : null,
                        ),
                        onPressed: () => appState.setLanguage(AppLanguage.tamil),
                        child: const Text('தமிழ்'),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Role', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5)),
                const SizedBox(height: 4),
                Text('Currently signed in as ${appState.currentRole.displayName}.', style: const TextStyle(fontSize: 12, color: AppColors.slate500)),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: UserRole.values.map((r) {
                    final selected = r == appState.currentRole;
                    return ChoiceChip(
                      label: Text(r.code.replaceAll('_', ' ')),
                      selected: selected,
                      onSelected: (_) => appState.setRole(r),
                    );
                  }).toList(),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Data', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5, color: AppColors.riskHigh)),
                const SizedBox(height: 8),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: _resetting ? null : () => _confirmReset(appState),
                    icon: const Icon(Icons.restore_outlined, size: 16, color: AppColors.riskHigh),
                    label: Text(
                      _resetting ? 'Resetting…' : 'Reset All Data',
                      style: const TextStyle(color: AppColors.riskHigh),
                    ),
                    style: OutlinedButton.styleFrom(side: const BorderSide(color: AppColors.riskHigh)),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          const AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('About EMD-TS', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5)),
                SizedBox(height: 6),
                Text(
                  'Edge Medical Diagnostics & Telemedicine System — an offline-first screening and referral platform '
                  'for primary health centres. Flutter mobile app + FastAPI/Python backend.',
                  style: TextStyle(fontSize: 12, color: AppColors.slate500, height: 1.4),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
