/**
 * ProgressiveList.jsx
 * ───────────────────────────────────────────────────────────────────────────
 * Progressive-disclosure primitive. Renders only the first `initialCount`
 * items; the remainder smoothly expand/collapse as a single height-animated
 * block (no per-item jank, no page jump) behind a glassmorphic "Xem thêm".
 *
 * `wrapperClassName` is applied to the inner container so callers can host a
 * timeline spine / spacing on it while we manage the reveal mechanics.
 */
import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export default function ProgressiveList({
  items = [],
  initialCount = 2,
  renderItem,
  wrapperClassName = 'space-y-3',
  tailClassName = 'space-y-3',
  moreLabel,
  lessLabel = 'Thu gọn',
}) {
  const [expanded, setExpanded] = useState(false);
  const head = items.slice(0, initialCount);
  const tail = items.slice(initialCount);
  const remaining = tail.length;

  return (
    <div className="space-y-4">
      <div className={wrapperClassName}>
        {head.map((item, i) => renderItem(item, i))}

        <AnimatePresence initial={false}>
          {expanded && remaining > 0 && (
            <motion.div
              key="tail"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className={`overflow-hidden ${tailClassName}`}
            >
              {tail.map((item, i) => renderItem(item, i + initialCount))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {remaining > 0 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="group w-full flex items-center justify-center gap-2 py-3 rounded-2xl
                     bg-white/45 hover:bg-white/70 border border-white/60 backdrop-blur-xl
                     text-sm font-bold text-on-surface-variant hover:text-primary
                     shadow-sm transition-all cursor-pointer"
        >
          {expanded ? lessLabel : (moreLabel || `Xem thêm ${remaining} mục`)}
          <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.3 }}>
            <ChevronDown className="w-4 h-4" />
          </motion.span>
        </button>
      )}
    </div>
  );
}
