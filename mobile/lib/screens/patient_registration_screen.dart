import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../services/api_service.dart';
import '../state/app_state.dart';
import '../theme/app_theme.dart';
import '../widgets/app_scaffold.dart';
import '../widgets/common.dart';

class PatientRegistrationScreen extends StatefulWidget {
  const PatientRegistrationScreen({super.key});

  @override
  State<PatientRegistrationScreen> createState() => _PatientRegistrationScreenState();
}

class _PatientRegistrationScreenState extends State<PatientRegistrationScreen> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _age = TextEditingController();
  final _phone = TextEditingController();
  final _village = TextEditingController();
  final _symptoms = TextEditingController();
  final _duration = TextEditingController();
  final _conditions = TextEditingController();
  final _medications = TextEditingController();
  final _allergies = TextEditingController();
  String _gender = 'Male';
  bool _saving = false;
  String? _savedId;
  String? _error;

  @override
  void dispose() {
    _name.dispose();
    _age.dispose();
    _phone.dispose();
    _village.dispose();
    _symptoms.dispose();
    _duration.dispose();
    _conditions.dispose();
    _medications.dispose();
    _allergies.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _saving = true;
      _error = null;
    });
    final appState = context.read<AppState>();
    try {
      final patient = await appState.addPatient(
        name: _name.text.trim(),
        age: int.parse(_age.text.trim()),
        gender: _gender,
        phone: _phone.text.trim(),
        village: _village.text.trim(),
        symptoms: _symptoms.text.trim(),
        duration: _duration.text.trim().isEmpty ? 'Not specified' : _duration.text.trim(),
        knownConditions: _conditions.text.trim().isEmpty ? 'None reported' : _conditions.text.trim(),
        medications: _medications.text.trim().isEmpty ? 'None reported' : _medications.text.trim(),
        allergies: _allergies.text.trim().isEmpty ? 'None known' : _allergies.text.trim(),
      );
      appState.setActivePatientId(patient.id);
      setState(() => _savedId = patient.id);
      await Future.delayed(const Duration(milliseconds: 700));
      if (!mounted) return;
      Navigator.of(context).pushReplacementNamed('/monitoring');
    } on ApiException catch (e) {
      setState(() => _error = 'Could not save patient: ${e.message}');
    } catch (e) {
      setState(() => _error = 'Could not save patient. Check the backend connection in Settings.');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  InputDecoration _dec(String label, {String? hint}) => InputDecoration(labelText: label, hintText: hint);

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      currentRoute: '/registration',
      title: 'Patient Registration',
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            const SectionHeader(
              title: 'Patient Registration',
              subtitle: 'Register a new patient before starting live monitoring and AI-assisted screening.',
            ),
            AppCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  TextFormField(
                    controller: _name,
                    decoration: _dec('Full Name', hint: 'e.g. Lakshmi Narayanan'),
                    validator: (v) => (v == null || v.trim().isEmpty) ? 'Name is required' : null,
                  ),
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: _age,
                          keyboardType: TextInputType.number,
                          decoration: _dec('Age'),
                          validator: (v) {
                            final n = int.tryParse(v?.trim() ?? '');
                            if (n == null || n <= 0 || n > 120) return 'Invalid age';
                            return null;
                          },
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          initialValue: _gender,
                          decoration: _dec('Gender'),
                          items: const [
                            DropdownMenuItem(value: 'Male', child: Text('Male')),
                            DropdownMenuItem(value: 'Female', child: Text('Female')),
                            DropdownMenuItem(value: 'Other', child: Text('Other')),
                          ],
                          onChanged: (v) => setState(() => _gender = v ?? 'Male'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  TextFormField(
                    controller: _phone,
                    keyboardType: TextInputType.phone,
                    decoration: _dec('Phone', hint: '+91 XXXXX XXXXX'),
                    validator: (v) => (v == null || v.trim().isEmpty) ? 'Phone is required' : null,
                  ),
                  const SizedBox(height: 14),
                  TextFormField(
                    controller: _village,
                    decoration: _dec('Village / Location'),
                    validator: (v) => (v == null || v.trim().isEmpty) ? 'Village is required' : null,
                  ),
                  const SizedBox(height: 14),
                  TextFormField(
                    controller: _symptoms,
                    maxLines: 3,
                    decoration: _dec('Symptoms', hint: 'e.g. Chest discomfort and breathing difficulty'),
                    validator: (v) => (v == null || v.trim().isEmpty) ? 'Please describe symptoms (or "None")' : null,
                  ),
                  const SizedBox(height: 14),
                  TextFormField(controller: _duration, decoration: _dec('Duration of Symptoms', hint: 'e.g. 2 Days')),
                  const SizedBox(height: 14),
                  TextFormField(controller: _conditions, decoration: _dec('Known Conditions')),
                  const SizedBox(height: 14),
                  TextFormField(controller: _medications, decoration: _dec('Current Medications')),
                  const SizedBox(height: 14),
                  TextFormField(controller: _allergies, decoration: _dec('Allergies')),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(color: AppColors.brand50, borderRadius: BorderRadius.circular(10)),
                    child: const Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(Icons.shield_outlined, size: 18, color: AppColors.brand600),
                        SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'On save, EMD-TS generates a pseudonymous Patient ID, computes a SHA-256 hash of this record, and writes a PATIENT_CREATED transaction to the local audit blockchain.',
                            style: TextStyle(fontSize: 11.5, color: AppColors.slate600),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  if (_error != null) ...[
                    Text(_error!, style: const TextStyle(color: AppColors.riskHigh, fontSize: 12.5)),
                    const SizedBox(height: 10),
                  ],
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _saving ? null : _submit,
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4),
                        child: Text(_saving ? 'Saving…' : 'Start Screening'),
                      ),
                    ),
                  ),
                  if (_savedId != null) ...[
                    const SizedBox(height: 10),
                    Text('Saved as $_savedId — opening live monitoring…', style: const TextStyle(color: AppColors.riskLow, fontSize: 12.5)),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
