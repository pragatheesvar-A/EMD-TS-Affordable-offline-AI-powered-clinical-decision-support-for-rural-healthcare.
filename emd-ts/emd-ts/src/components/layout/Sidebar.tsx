import React from 'react';
import { NavLink } from 'react-router-dom';
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
import { useApp } from '../../context/AppContext';
import { t } from '../../i18n/translations';

const NAV_ITEMS = [
  { to: '/', label: 'nav_dashboard', icon: LayoutDashboard, end: true },
  { to: '/registration', label: 'nav_registration', icon: UserPlus },
  { to: '/monitoring', label: 'nav_monitoring', icon: Activity },
  { to: '/screening', label: 'nav_screening', icon: BrainCircuit },
  { to: '/timeline', label: 'nav_timeline', icon: History },
  { to: '/copilot', label: 'nav_copilot', icon: Stethoscope },
  { to: '/referral', label: 'nav_referral', icon: Send },
  { to: '/doctor', label: 'nav_doctor', icon: ClipboardList },
  { to: '/consultation-payment', label: 'nav_payment', icon: CreditCard },
  { to: '/security', label: 'nav_security', icon: ShieldCheck },
  { to: '/blockchain', label: 'nav_blockchain', icon: Link2 },
  { to: '/architecture', label: 'nav_architecture', icon: Network },
  { to: '/business', label: 'nav_business', icon: Briefcase },
  { to: '/settings', label: 'nav_settings', icon: SettingsIcon },
];

export function Sidebar() {
  const { language } = useApp();
  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-white border-r border-slate-200 h-screen sticky top-0">
      <div className="px-5 py-5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center text-white font-bold text-sm">
            E
          </div>
          <div>
            <p className="font-bold text-slate-900 leading-none tracking-tight">EMD-TS</p>
            <p className="text-[10px] text-slate-400 leading-none mt-1">Edge Medical Diagnostics</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <item.icon size={17} strokeWidth={2} />
            <span>{t(language, item.label)}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-100">
        <p className="text-[11px] text-slate-400 leading-snug">
          AI-assisted screening prototype. Not a diagnostic device. Clinician makes the final decision.
        </p>
      </div>
    </aside>
  );
}
