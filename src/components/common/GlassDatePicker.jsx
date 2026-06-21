import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// GlassDatePicker — a Liquid Glass replacement for the native <input type="date">.
//
// The native date popup is opaque and unstyleable, which breaks the frosted
// aesthetic. This component renders a glass trigger + an animated calendar popup
// and behaves like a controlled input:
//   • `value`    — selected date as a 'YYYY-MM-DD' string ('' when empty).
//   • `onChange` — called with the SAME 'YYYY-MM-DD' string format the native
//                  <input type="date"> would emit, so parent state (and the
//                  getAllShifts / workingDocs date comparisons) stay unbroken.
//   • `min`      — earliest selectable date as 'YYYY-MM-DD' (inclusive).
//
// Calendar math (days-in-month, first-weekday offset) uses plain JS Date in the
// LOCAL timezone to mirror native <input type="date"> semantics exactly.
// ─────────────────────────────────────────────────────────────────────────────

// Date → 'YYYY-MM-DD' (local, never UTC — avoids the off-by-one from toISOString).
function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// 'YYYY-MM-DD' → Date at local midnight. Returns null for empty/invalid input.
function parseISODate(s) {
  if (!s || typeof s !== 'string') return null;
  const [y, m, d] = s.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const MONTHS = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
];

export default function GlassDatePicker({
  value,
  onChange,
  min,
  placeholder = 'Chọn ngày khám',
  className = '',
  buttonClassName = '',
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const selectedDate = useMemo(() => parseISODate(value), [value]);
  const minDate = useMemo(() => parseISODate(min), [min]);
  const minMidnight = minDate
    ? new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())
    : null;

  // The month currently shown in the calendar grid.
  const [viewDate, setViewDate] = useState(() => selectedDate || minDate || new Date());

  // Re-sync the visible month if the selected value changes from the parent.
  useEffect(() => {
    if (selectedDate) setViewDate(selectedDate);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // ── Calendar math ──
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay(); // 0 = Sun … 6 = Sat
  const startOffset = (firstWeekday + 6) % 7; // shift to Monday-first

  const isBeforeMin = (d) => (minMidnight ? d < minMidnight : false);
  const isSameDay = (a, b) =>
    a && b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const handlePick = (day) => {
    const picked = new Date(year, month, day);
    if (isBeforeMin(picked)) return;
    onChange?.(toISODate(picked));
    setOpen(false);
  };

  const goPrevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const goNextMonth = () => setViewDate(new Date(year, month + 1, 1));

  // Disable "previous month" once every day of that month is before `min`.
  const prevMonthDisabled =
    minMidnight && new Date(year, month, 0) < minMidnight;

  const triggerLabel = selectedDate
    ? `${String(selectedDate.getDate()).padStart(2, '0')}/${String(
        selectedDate.getMonth() + 1
      ).padStart(2, '0')}/${selectedDate.getFullYear()}`
    : placeholder;

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`bg-white/50 border border-white/40 text-gray-900 rounded-xl p-4 w-full cursor-pointer flex justify-between items-center outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all ${buttonClassName}`}
      >
        <span className={selectedDate ? 'text-slate-900 text-sm font-medium' : 'text-slate-800 text-sm font-medium'}>
          {triggerLabel}
        </span>
        <CalendarIcon className="w-5 h-5 text-teal-500 shrink-0" />
      </button>

      {/* Popup */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute z-[100] mt-2 bg-white/60 backdrop-blur-3xl border border-white/60 shadow-2xl rounded-2xl p-5 w-80 origin-top"
          >
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={goPrevMonth}
                disabled={prevMonthDisabled}
                aria-label="Tháng trước"
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-transparent border-none text-gray-600 hover:bg-white/60 hover:text-emerald-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm font-bold text-gray-800">
                {MONTHS[month]} {year}
              </span>
              <button
                type="button"
                onClick={goNextMonth}
                aria-label="Tháng sau"
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-transparent border-none text-gray-600 hover:bg-white/60 hover:text-emerald-700 cursor-pointer transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {WEEKDAYS.map((w) => (
                <div key={w} className="text-center text-[11px] font-bold text-slate-600 uppercase py-1">
                  {w}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: startOffset }).map((_, i) => (
                <div key={`pad-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dayDate = new Date(year, month, day);
                const disabled = isBeforeMin(dayDate);
                const selected = isSameDay(dayDate, selectedDate);
                return (
                  <button
                    key={day}
                    type="button"
                    disabled={disabled}
                    onClick={() => handlePick(day)}
                    className={`text-sm text-center rounded-xl py-2 border-none transition-all ${
                      disabled
                        ? 'bg-transparent text-slate-400 cursor-not-allowed'
                        : selected
                        ? 'bg-emerald-500 text-white font-bold shadow-lg scale-105 cursor-pointer'
                        : 'bg-transparent text-gray-700 hover:bg-white/60 hover:text-emerald-700 cursor-pointer'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
