import React from 'react';
import { NavLink } from 'react-router-dom';
import { X } from 'lucide-react';
import {
  LayoutDashboard,
  UserPlus,
  Activity,
  BrainCircuit,
  History,
  Stethoscope,
  Send,
  ClipboardList,
  ShieldCheck,
  Link2,
  Network,
  Briefcase,
  Settings as SettingsIcon,
  CreditCard,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/registration', label: 'Patient Registration', icon: UserPlus },
  { to: '/monitoring', label: 'Live Monitoring', icon: Activity },
  { to: '/screening', label: 'AI Screening', icon: BrainCircuit },
  { to: '/timeline', label: 'Patient Timeline', icon: History },
  { to: '/copilot', label: 'Clinical Copilot', icon: Stethoscope },
  { to: '/referral', label: 'Smart Referral', icon: Send },
  { to: '/doctor', label: 'Doctor Dashboard', icon: ClipboardList },
  { to: '/consultation-payment', label: 'Consultation & Payment', icon: CreditCard },
  { to: '/security', label: 'Security Center', icon: ShieldCheck },
  { to: '/blockchain', label: 'Blockchain Audit', icon: Link2 },
  { to: '/architecture', label: 'Architecture', icon: Network },
  { to: '/business', label: 'Business Model', icon: Briefcase },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

export function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100">
          <span className="font-bold text-slate-900">EMD-TS</span>
          <button onClick={onClose} className="p-1 text-slate-500">
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-2 px-3 space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'
                }`
              }
            >
              <item.icon size={17} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
