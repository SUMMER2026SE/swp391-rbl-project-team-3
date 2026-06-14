/**
 * ProfileTabs.jsx
 * ───────────────────────────────────────────────────────────────────────────
 * Smooth animated tab bar. The active "pill" is a single shared element that
 * slides between tabs via Framer Motion's `layoutId`, giving the premium
 * morphing effect rather than a hard snap.
 */
import React from 'react';
import { motion } from 'framer-motion';

export default function ProfileTabs({ tabs, activeTab, onChange }) {
  return (
    <div className="glass-3d-soft rounded-2xl p-1.5 flex items-center gap-1 overflow-x-auto custom-scrollbar">
      {tabs?.map?.((tab) => {
        const Icon = tab.icon;
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold
                        whitespace-nowrap border-none cursor-pointer transition-colors duration-200 z-10
                        ${isActive ? 'text-white' : 'text-on-surface-variant hover:text-on-surface bg-transparent'}`}
          >
            {isActive && (
              <motion.span
                layoutId="profile-tab-pill"
                className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#00685f] to-[#0058be] shadow-md shadow-emerald-600/25 -z-10"
                transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              />
            )}
            <Icon className="w-4 h-4" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
