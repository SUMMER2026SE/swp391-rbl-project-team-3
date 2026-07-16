/**
 * ProfileTabs.jsx
 * ───────────────────────────────────────────────────────────────────────────
 * Smooth animated tab bar. The active "pill" is a single shared element that
 * slides between tabs via Framer Motion's `layoutId`, giving the premium
 * morphing effect rather than a hard snap.
 *
 * Uses CSS Grid with `grid-cols-[repeat(N,1fr)]` to force ALL tabs onto
 * exactly one row, evenly balanced regardless of label length.
 */
import React from 'react';
import { motion } from 'framer-motion';

export default function ProfileTabs({ tabs, activeTab, onChange }) {
  return (
    <div className="bg-slate-900/5 backdrop-blur-md border border-slate-200/50 rounded-2xl p-1.5 grid grid-flow-col auto-cols-fr w-full gap-1">
      {tabs?.map?.((tab) => {
        const Icon = tab.icon;
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            title={tab.label}
            className={`relative flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl text-[11px] sm:text-[13px] font-bold tracking-tight
                        border-none cursor-pointer transition-colors duration-200 z-10 min-w-0
                        ${isActive ? 'text-white' : 'text-slate-800 hover:text-black bg-transparent'}`}
          >
            {isActive && (
              <motion.span
                layoutId="profile-tab-pill"
                className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#00685f] to-[#0058be] shadow-md shadow-emerald-600/25 -z-10"
                transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              />
            )}
            <Icon className="w-4 h-4 shrink-0" />
            <span className="truncate whitespace-nowrap">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
