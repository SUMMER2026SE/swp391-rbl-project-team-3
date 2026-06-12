import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LiquidSidebarMenu({ items, activeId, onChange, isSidebarExpanded }) {
  return (
    <nav className="space-y-1.5 w-full">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeId === item.id;

        return (
          <div key={item.id} className="relative group w-full">
            <button
              onClick={() => onChange(item.id)}
              className={`relative w-full flex items-center gap-3 rounded-xl transition-all active:scale-[0.98] ${
                isSidebarExpanded ? 'px-4 py-3' : 'px-0 py-3 justify-center'
              } ${
                isActive
                  ? 'text-emerald-700 font-bold'
                  : 'text-slate-500 hover:text-slate-700 font-medium'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="global-sidebar-pill"
                  transition={{ type: 'spring', stiffness: 350, damping: 25, mass: 1 }}
                  className="absolute inset-0 z-0 bg-emerald-500/15 backdrop-blur-md border border-white/40 shadow-[inset_0_0_12px_rgba(255,255,255,0.4)] rounded-xl"
                />
              )}
              
              <span className={`relative z-10 flex items-center gap-3 ${!isSidebarExpanded ? 'justify-center w-full' : ''}`}>
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-emerald-700' : 'text-slate-400 group-hover:text-slate-600'}`} />
                
                <AnimatePresence>
                  {isSidebarExpanded && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.15 }}
                      className="text-[14px] whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>
            </button>
            
            {/* Tooltip for collapsed state */}
            {!isSidebarExpanded && (
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                {item.label}
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-800"></div>
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
