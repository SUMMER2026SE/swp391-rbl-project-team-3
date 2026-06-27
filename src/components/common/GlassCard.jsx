import React from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Liquid Glass — the single source of truth for the frosted "card" surface used
// across every dashboard (Admin · Doctor · Technician · Receptionist).
//
// Before this module each screen rolled its own glassmorphism (bg-white/40…/75,
// blur-md/xl/2xl, rounded-3xl vs rounded-[2rem], a handful of shadow recipes —
// and RevenueStatistics wasn't glass at all). These tokens collapse all of that
// into one formula.
//
// Two ways to consume it:
//   • <GlassCard> … </GlassCard>            → plain static cards / panels.
//   • className={`${GLASS_BASE} ${GLASS_HOVER}`}  → when the element must stay a
//     `motion.*` node (framer-motion variants) or a direct <AnimatePresence>
//     child, where wrapping in a custom component would break exit animations.
// ─────────────────────────────────────────────────────────────────────────────

// Base frosted surface — "Frosted Ice" liquid glass: translucent (/40) + heavy
// 2xl blur for light-bending frost, a crisp white rim, and a subtle BLUE-TINTED
// drop shadow that anchors the card on the bright, airy background and keeps
// dark text legible. Legibility comes from the blur + dark text (gray-900/800).
export const GLASS_BASE =
  'backdrop-blur-2xl bg-white/40 border border-white/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_8px_32px_0_rgba(31,38,135,0.07)] rounded-3xl';

// Premium lift for interactive / clickable cards (hover stays translucent).
export const GLASS_HOVER =
  'hover:-translate-y-1 hover:bg-white/55 hover:shadow-xl transition-all duration-300 ease-out';

// Standard internal padding for a card body.
export const GLASS_PAD = 'p-6';

// Standard card title / header typography — darkest ink for maximum contrast.
export const GLASS_TITLE = 'text-lg font-bold text-gray-900 tracking-tight';

// Recessed-glass form control (inputs, search bars, selects, textareas) — sits
// "inside" the glass: thinner fill than a card, lifts + brightens its rim on
// focus with the clinic BRAND TEAL focus ring (#00685f family → teal-500).
// Pair native checkboxes/radios with `accent-teal-500` so they tint to brand.
// Ships BOTH `focus:` (token applied directly on the <input>) and
// `focus-within:` (token wraps an input group) teal rings so either pattern
// shows the correct ring. NEVER reintroduce emerald/indigo focus rings here.
export const GLASS_INPUT =
  'bg-white/20 backdrop-blur-md border border-white/40 text-gray-900 placeholder-gray-500 rounded-xl focus:bg-white/40 focus:border-white focus:ring-2 focus:ring-teal-500/50 focus:outline-none focus-within:ring-2 focus-within:ring-teal-500/50 transition-all';

// Deeply recessed read-only / inner surface — a darker "pressed into the glass"
// well with an inner shadow, for locked result fields, summary rows and
// read-only textareas (content displayed, not edited). Single source of truth
// for the bespoke `bg-slate-950/5 shadow-inner` recipe previously inlined only
// in TechnicianWorkspace.
export const GLASS_INPUT_RECESSED =
  'w-full bg-slate-950/5 border border-slate-200/50 rounded-2xl p-5 text-slate-900 font-semibold shadow-inner outline-none transition-all';

// Standardized modal overlay — the full-viewport dim + blur backdrop that also
// centers its modal child. Pair with `createPortal(…, document.body)` so it
// escapes the dashboard's `<main z-10>` stacking context. Single source of
// truth for ALL modals; replaces the ad-hoc bg-slate-900/30…/60 + black/80 mix.
export const GLASS_MODAL_BACKDROP =
  'fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-md';

// Equal-height column so cards stretch to fill their grid row.
export const GLASS_FILL = 'h-full flex flex-col';

/**
 * Compose the Liquid Glass class string.
 * @param {{interactive?: boolean, padded?: boolean, fill?: boolean, className?: string}} opts
 */
export const glass = ({ interactive = false, padded = true, fill = false, className = '' } = {}) =>
  [GLASS_BASE, padded && GLASS_PAD, interactive && GLASS_HOVER, fill && GLASS_FILL, className]
    .filter(Boolean)
    .join(' ');

/**
 * GlassCard — reusable frosted container.
 * Polymorphic via `as` (defaults to <div>). Forwards refs and spreads the rest
 * of the props so it stays a drop-in replacement for the wrapper it replaces.
 *
 * NOTE: don't use this as a direct child of <AnimatePresence>; spread
 * GLASS_BASE/GLASS_HOVER onto a real motion.* element there instead.
 */
const GlassCard = React.forwardRef(function GlassCard(
  { as: Component = 'div', interactive = false, padded = true, fill = false, className = '', children, ...rest },
  ref
) {
  return (
    <Component ref={ref} className={glass({ interactive, padded, fill, className })} {...rest}>
      {children}
    </Component>
  );
});

export default GlassCard;
