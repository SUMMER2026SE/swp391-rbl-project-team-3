import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import { GLASS_BASE, GLASS_INPUT } from './GlassCard';

// ─────────────────────────────────────────────────────────────────────────────
// GlassSelect — a Liquid Glass replacement for the native <select>.
//
// Native <select> can't be styled with glassmorphism or animated, so this is a
// custom div/ul/li implementation that behaves like a controlled <select>:
//   • `value`    — the currently selected value (compared loosely by String()).
//   • `onChange` — called with the RAW option value (same value a native select
//                  would put in e.target.value), so parents stay drop-in.
//   • `options`  — array of `{ value, label }` OR plain strings.
//
// Trigger uses the GLASS_INPUT token; the popup uses GLASS_BASE (heavy blur,
// border, inset-light shadow) and animates via <AnimatePresence>.
// ─────────────────────────────────────────────────────────────────────────────
export default function GlassSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Chọn...',
  disabled = false,
  className = '',
  buttonClassName = 'px-3.5 py-2.5 text-sm',
  menuClassName = '',
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const items = (Array.isArray(options) ? options : []).map((o) =>
    o && typeof o === 'object'
      ? { value: o.value, label: o.label ?? String(o.value) }
      : { value: o, label: String(o) }
  );
  const selected = items.find((o) => String(o.value) === String(value));

  // Close on outside click + Escape.
  useEffect(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const pick = (v) => {
    onChange?.(v);
    setOpen(false);
  };

  return (
    <div ref={ref} className={`relative ${open ? 'z-[100]' : ''} ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`${GLASS_INPUT} w-full flex items-center justify-between gap-2 cursor-pointer disabled:opacity-50 ${buttonClassName}`}
      >
        <span className={`truncate ${selected ? '' : 'text-slate-800'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 text-slate-800"
        >
          <ChevronDown className="w-4 h-4" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className={`${GLASS_BASE} !bg-white/95 absolute z-50 left-0 right-0 mt-2 p-1.5 max-h-60 overflow-auto origin-top ${menuClassName}`}
          >
            {items.length === 0 ? (
              <li className="px-3 py-2 text-sm text-slate-800">Không có lựa chọn</li>
            ) : (
              items.map((o) => {
                const active = String(o.value) === String(value);
                return (
                  <li
                    key={String(o.value)}
                    role="option"
                    aria-selected={active}
                    onClick={() => pick(o.value)}
                    className={`flex items-center justify-between gap-2 px-3 py-2 rounded-2xl text-sm font-medium text-gray-800 hover:bg-white/40 cursor-pointer transition-colors ${
                      active ? 'bg-white/30' : ''
                    }`}
                  >
                    <span className="truncate">{o.label}</span>
                    {active && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                  </li>
                );
              })
            )}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
