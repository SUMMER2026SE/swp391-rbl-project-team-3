import React, { useState } from 'react';
import { motion } from 'framer-motion';

// ─────────────────────────────────────────────────────────────────────────────
// GlassCheckbox — Liquid Glass replacement for <input type="checkbox">.
//
// Renders a real (but visually-hidden) <input> overlaid transparently on a
// custom glass box, so it keeps FULL native parity: it works as the control of
// a surrounding <label>, via an external <label htmlFor>, in forms, and with
// keyboard focus. The wrapper is a <span> (never a <label>) so it is safe to
// drop inside an existing <label> without illegal nesting.
//
//   • Unchecked: faint frosted glass (bg-white/10 + white/30 border).
//   • Checked:   glowing emerald glass (scale-up + emerald glow shadow).
//   • The checkmark SVG draws itself (framer-motion pathLength) on select.
//
// Controlled (`checked` + `onChange`) or uncontrolled (`defaultChecked`).
// `onChange` receives the native event — e.target.checked is valid, so existing
// handlers are drop-in.
// ─────────────────────────────────────────────────────────────────────────────
export default function GlassCheckbox({
  checked,
  defaultChecked,
  onChange,
  disabled = false,
  className = '',
  ...rest
}) {
  const isControlled = checked !== undefined;
  const [internal, setInternal] = useState(defaultChecked ?? false);
  const on = isControlled ? checked : internal;

  const handle = (e) => {
    if (!isControlled) setInternal(e.target.checked);
    onChange?.(e);
  };

  return (
    <span className={`relative inline-flex w-5 h-5 shrink-0 align-middle ${className}`}>
      <input
        type="checkbox"
        checked={isControlled ? checked : undefined}
        defaultChecked={isControlled ? undefined : defaultChecked}
        onChange={handle}
        disabled={disabled}
        className="peer absolute inset-0 w-full h-full m-0 opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
        {...rest}
      />
      <motion.span
        aria-hidden="true"
        initial={false}
        animate={{ scale: on ? 1.05 : 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 26 }}
        className={`pointer-events-none w-5 h-5 rounded-md flex items-center justify-center backdrop-blur-md border transition-all duration-300 peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-400/50 ${
          on
            ? 'bg-emerald-500/80 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]'
            : 'bg-white/10 border-gray-300'
        }`}
      >
        <motion.svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5">
          <motion.path
            d="M5 12.5l4.5 4.5L19 7"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={false}
            animate={{ pathLength: on ? 1 : 0, opacity: on ? 1 : 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          />
        </motion.svg>
      </motion.span>
    </span>
  );
}
