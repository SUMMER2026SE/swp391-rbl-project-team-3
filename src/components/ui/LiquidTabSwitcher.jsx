import React from 'react';
import { motion } from 'framer-motion';

export default function LiquidTabSwitcher({ tabs, activeTab, onChange }) {
  return (
    <div className="flex flex-row overflow-x-auto hide-scrollbar gap-2 p-1 bg-slate-900/5 backdrop-blur-md rounded-2xl border border-white/30 shadow-inner">
      {tabs?.map?.((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-xl transition-all active:scale-95 whitespace-nowrap ${
              isActive
                ? 'text-emerald-700 font-bold'
                : 'text-slate-500 hover:text-slate-700 font-medium'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="global-horizontal-pill"
                transition={{ type: 'spring', stiffness: 350, damping: 25, mass: 1 }}
                className="absolute inset-0 z-0 bg-emerald-500/15 backdrop-blur-md border border-white/40 shadow-[inset_0_0_12px_rgba(255,255,255,0.4)] rounded-xl"
              />
            )}
            
            <span className="relative z-10 flex items-center gap-2">
              {Icon && <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-700' : 'text-slate-400'}`} />}
              <span className="text-sm">{tab.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
