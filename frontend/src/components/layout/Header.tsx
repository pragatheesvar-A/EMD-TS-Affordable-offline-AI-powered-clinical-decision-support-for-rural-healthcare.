import React, { useState } from 'react';
import { Wifi, WifiOff, ChevronDown, Menu } from 'lucide-react';
import { useApp, DEFAULT_USERS } from '../../context/AppContext';
import type { UserRole } from '../../types';
import { MobileNav } from './MobileNav';

const ROLES: UserRole[] = ['HEALTHCARE_WORKER', 'DOCTOR', 'SPECIALIST', 'ADMIN', 'AUDITOR'];

export function Header() {
  const { isOnline, setIsOnline, currentUser, setCurrentUser } = useApp();
  const [roleOpen, setRoleOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="flex items-center justify-between px-4 lg:px-6 py-3 gap-3">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 -ml-2 text-slate-600"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <div>
              <p className="font-semibold text-slate-900 text-sm leading-tight">EMD-TS</p>
              <p className="text-[11px] text-slate-500 leading-tight hidden sm:block">
                Edge Medical Diagnostics &amp; Telemedicine System
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setIsOnline(!isOnline)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                isOnline
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
              title="Toggle online/offline mode"
            >
              {isOnline ? <Wifi size={13} /> : <WifiOff size={13} />}
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-slate-400 pulse-dot'}`} />
              {isOnline ? 'ONLINE' : 'OFFLINE MODE'}
            </button>

            <div className="relative">
              <button
                onClick={() => setRoleOpen((v) => !v)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-full border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[10px] font-bold">
                  {currentUser.name.charAt(0)}
                </span>
                <span className="hidden sm:inline">{currentUser.name}</span>
                <ChevronDown size={13} />
              </button>
              {roleOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl card-shadow-lg py-1.5 z-40">
                  <p className="px-3 py-1 text-[10px] uppercase tracking-wide text-slate-400 font-semibold">
                    Switch role (demo)
                  </p>
                  {ROLES.map((role) => (
                    <button
                      key={role}
                      onClick={() => {
                        setCurrentUser(role);
                        setRoleOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center justify-between ${
                        currentUser.role === role ? 'text-brand-700 font-semibold' : 'text-slate-700'
                      }`}
                    >
                      <span>{DEFAULT_USERS[role].name}</span>
                      <span className="text-[10px] text-slate-400">{role.replace('_', ' ')}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}
