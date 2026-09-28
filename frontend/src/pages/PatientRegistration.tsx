import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Card, SectionTitle, Button, Field, inputClass } from '../components/shared/ui';

const emptyForm = {
  name: '',
  age: '',
  gender: 'Male' as 'Male' | 'Female' | 'Other',
  phone: '',
  village: '',
  symptoms: '',
  duration: '',
  knownConditions: '',
  medications: '',
  allergies: '',
};

export function PatientRegistration() {
  const { addPatient, setActivePatientId } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.age || Number(form.age) <= 0 || Number(form.age) > 120) e.age = 'Enter a valid age';
    if (!form.phone.trim()) e.phone = 'Phone number is required';
    if (!form.village.trim()) e.village = 'Village / location is required';
    if (!form.symptoms.trim()) e.symptoms = 'Please describe symptoms (or write "None")';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const patient = await addPatient({
        name: form.name.trim(),
        age: Number(form.age),
        gender: form.gender,
        phone: form.phone.trim(),
        village: form.village.trim(),
        symptoms: form.symptoms.trim(),
        duration: form.duration.trim() || 'Not specified',
        knownConditions: form.knownConditions.trim() || 'None reported',
        medications: form.medications.trim() || 'None reported',
        allergies: form.allergies.trim() || 'None known',
      });
      setActivePatientId(patient.id);
      setSavedId(patient.id);
      setTimeout(() => navigate('/monitoring'), 900);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="animate-fade-in max-w-3xl">
      <SectionTitle
        title="Patient Registration"
        subtitle="Register a new patient before starting live monitoring and AI-assisted screening."
      />

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Patient ID" hint="Auto-generated on save">
              <input className={`${inputClass} bg-slate-50 text-slate-400`} value="Generated automatically" disabled />
            </Field>
            <Field label="Full Name">
              <input
                className={inputClass}
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="e.g. Lakshmi Narayanan"
              />
              {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
            </Field>
            <Field label="Age">
              <input
                type="number"
                className={inputClass}
                value={form.age}
                onChange={(e) => update('age', e.target.value)}
                placeholder="e.g. 52"
              />
              {errors.age && <p className="text-xs text-red-600 mt-1">{errors.age}</p>}
            </Field>
            <Field label="Gender">
              <select className={inputClass} value={form.gender} onChange={(e) => update('gender', e.target.value as any)}>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </Field>
            <Field label="Phone">
              <input
                className={inputClass}
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                placeholder="+91 XXXXX XXXXX"
              />
              {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
            </Field>
            <Field label="Village / Location">
              <input
                className={inputClass}
                value={form.village}
                onChange={(e) => update('village', e.target.value)}
                placeholder="e.g. Thuraiyur"
              />
              {errors.village && <p className="text-xs text-red-600 mt-1">{errors.village}</p>}
            </Field>
          </div>

          <Field label="Symptoms">
            <textarea
              className={`${inputClass} min-h-[80px]`}
              value={form.symptoms}
              onChange={(e) => update('symptoms', e.target.value)}
              placeholder="e.g. Chest discomfort and breathing difficulty"
            />
            {errors.symptoms && <p className="text-xs text-red-600 mt-1">{errors.symptoms}</p>}
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Duration of Symptoms">
              <input
                className={inputClass}
                value={form.duration}
                onChange={(e) => update('duration', e.target.value)}
                placeholder="e.g. 2 Days"
              />
            </Field>
            <Field label="Known Conditions">
              <input
                className={inputClass}
                value={form.knownConditions}
                onChange={(e) => update('knownConditions', e.target.value)}
                placeholder="e.g. Hypertension, Diabetes"
              />
            </Field>
            <Field label="Current Medications">
              <input
                className={inputClass}
                value={form.medications}
                onChange={(e) => update('medications', e.target.value)}
                placeholder="e.g. Amlodipine 5mg"
              />
            </Field>
            <Field label="Allergies">
              <input
                className={inputClass}
                value={form.allergies}
                onChange={(e) => update('allergies', e.target.value)}
                placeholder="e.g. Penicillin"
              />
            </Field>
          </div>

          <div className="flex items-start gap-2.5 bg-brand-50/60 border border-brand-100 rounded-xl p-3.5">
            <ShieldCheck size={18} className="text-brand-600 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-600 leading-relaxed">
              On save, EMD-TS generates a pseudonymous Patient ID, computes a SHA-256 hash of this record, and
              writes a <span className="font-semibold">PATIENT_CREATED</span> transaction to the local audit
              blockchain. Raw clinical data always stays off-chain, encrypted in local storage.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={saving} size="lg">
              <UserPlus size={17} /> {saving ? 'Saving…' : 'Start Screening'}
            </Button>
            {savedId && (
              <span className="text-sm text-emerald-600 font-medium animate-fade-in">
                Saved as {savedId} — opening live monitoring…
              </span>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}
