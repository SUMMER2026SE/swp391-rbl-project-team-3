import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Loader2, SearchX, CheckCircle2 } from 'lucide-react';
import { GLASS_BASE, GLASS_INPUT, GLASS_INPUT_FILLED } from './GlassCard';

// ─────────────────────────────────────────────────────────────────────────────
// GlassAutoComplete — a Liquid Glass, database-backed type-ahead.
//
// Drop-in for a controlled native text <input>: the parent still owns the text
// via `value` / `onChange(text)` exactly as before. On top of that it queries a
// data source as the doctor types (debounced 300ms) and renders a frosted,
// animated suggestion popover.
//
//   • value            — current input text (controlled, like a native input).
//   • onChange(text)   — fired on every keystroke AND on selection, with the
//                        plain string the parent should store. Keeps existing
//                        parent state wiring (diagnosis / newMedication.name)
//                        byte-for-byte identical to the old native input.
//   • fetchSuggestions(query) — async (string) => item[].  Debounced caller.
//   • getOptionLabel(item)    — item => string written into `value` on select.
//   • renderOption(item)      — optional custom row content (defaults to label).
//   • onSelect(item)          — optional hook fired with the raw picked item.
//
// Input uses the GLASS_INPUT token; the popover uses GLASS_BASE (heavy blur,
// white/60 rim, blue-tinted shadow) and animates its entrance (no exit
// animation — see the note above the popover render).
// ─────────────────────────────────────────────────────────────────────────────
export default function GlassAutoComplete({
  value = '',
  onChange,
  fetchSuggestions,
  getOptionLabel = (item) => String(item ?? ''),
  renderOption,
  onSelect,
  allowCustomInput = true,
  placeholder = '',
  readOnly = false,
  minChars = 1,
  debounceMs = 300,
  className = '',
  inputClassName = '',
  emptyMessage = 'Không tìm thấy kết quả phù hợp.',
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);

  const wrapperRef = useRef(null);
  // Suppress the debounced fetch on the value change caused by a selection, so
  // picking an option doesn't immediately re-open the dropdown.
  const skipNextFetch = useRef(false);
  // Guards against out-of-order async responses (stale query overwriting fresh).
  const requestId = useRef(0);

  // Creatable behaviour. When allowCustomInput is FALSE (e.g. standardized
  // ICD-10 diagnoses) free text that never resolves to a real option is reverted
  // on blur to the last committed value — a selection, or whatever the parent
  // loaded in. When TRUE (e.g. prescriptions) typed text is always kept so the
  // doctor can prescribe a brand-new drug not yet in the `medicines` table.
  const committedRef = useRef(value);
  const typedRef = useRef(false);

  // Externally-supplied values (initial load, parent reset) count as committed.
  useEffect(() => {
    if (!typedRef.current) committedRef.current = value;
  }, [value]);

  // Close on outside click + Escape.
  useEffect(() => {
    const onDoc = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  // Debounced, race-safe query against the data source.
  useEffect(() => {
    if (readOnly) return;
    if (skipNextFetch.current) {
      skipNextFetch.current = false;
      return;
    }
    // Only user KEYSTROKES may query and open the popover. Programmatic value
    // changes (seeded defaults, DB hydration, AI scribe apply, parent resets)
    // must never pop a dropdown on their own — that made every prefilled
    // medicine row open its suggestions uninvited.
    if (!typedRef.current) {
      setResults([]);
      setOpen(false);
      setLoading(false);
      return;
    }
    const query = (value || '').trim();
    if (query.length < minChars || typeof fetchSuggestions !== 'function') {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const id = ++requestId.current;
    const handle = setTimeout(async () => {
      try {
        const data = await fetchSuggestions(query);
        if (id !== requestId.current) return; // a newer keystroke superseded us
        setResults(Array.isArray(data) ? data : []);
        setActiveIndex(-1);
        setOpen(true);
      } catch (e) {
        if (id !== requestId.current) return;
        console.warn('GlassAutoComplete fetch error:', e?.message || e);
        setResults([]);
        setOpen(true);
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    }, debounceMs);

    return () => clearTimeout(handle);
  }, [value, readOnly, minChars, debounceMs, fetchSuggestions]);

  const pick = (item) => {
    const label = getOptionLabel(item);
    typedRef.current = false;
    committedRef.current = label;
    skipNextFetch.current = true;
    onChange?.(label);
    onSelect?.(item);
    setOpen(false);
    setResults([]);
    setActiveIndex(-1);
  };

  // Enforce the "not creatable" contract for standardized fields — but never at
  // the cost of erasing fast, valid input. Option clicks keep input focus
  // (onMouseDown preventDefault) so they never trigger this.
  const handleBlur = () => {
    const wasTyped = typedRef.current;
    // Leaving the field ends the "typing" episode in every mode, so a later
    // programmatic value change is treated as external (no auto-popover).
    typedRef.current = false;
    if (allowCustomInput || !wasTyped) return;
    const v = (value || '').trim();

    // An intentional clear is always honoured.
    if (!v) {
      committedRef.current = '';
      return;
    }

    // Only a COMPLETED, non-empty result set is authoritative enough to overrule
    // the doctor. If a fetch is still in flight (debounce pending / loading) or
    // the current list is empty (not loaded yet, or zero server results), trust
    // the typed text — wiping it here is the bug we're guarding against.
    if (loading || results.length === 0) {
      committedRef.current = v;
      return;
    }

    // Real list back: keep an exact match, otherwise revert the stray free text.
    const matches = results.some((r) => getOptionLabel?.(r)?.trim() === v);
    committedRef.current = matches ? v : committedRef.current;
    if (!matches) onChange?.(committedRef.current || '');
  };

  const handleKeyDown = (e) => {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      pick(results[activeIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const showPopover = open && !readOnly && (value || '').trim().length >= minChars;
  // "Done" state: field holds content and no suggestion flow is in progress —
  // tint it brand-teal with a check so filled fields read at a glance.
  const isFilled = !readOnly && (value || '').trim().length > 0 && !showPopover && !loading;

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            typedRef.current = true;
            onChange?.(e.target.value);
          }}
          onFocus={() => !readOnly && results.length > 0 && setOpen(true)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          readOnly={readOnly}
          autoComplete="off"
          placeholder={placeholder}
          className={`${isFilled ? GLASS_INPUT_FILLED : GLASS_INPUT} w-full py-3 pl-4 pr-10 text-sm font-semibold rounded-xl ${
            readOnly ? 'bg-slate-100/50 cursor-not-allowed' : ''
          } ${inputClassName}`}
        />
        {!readOnly && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
            ) : isFilled ? (
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </span>
        )}
      </div>

      {/* No AnimatePresence here: with framer v12 + StrictMode the exiting
          popover can get stuck in the DOM at opacity 0 and silently swallow
          clicks on the fields underneath. Enter still animates; close is
          instant unmount. */}
      {showPopover && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute z-50 left-0 right-0 mt-2 p-1.5 max-h-64 overflow-auto origin-top custom-scrollbar bg-white border border-slate-200/60 shadow-xl rounded-2xl"
          >
            {results.length > 0 ? (
              results.map((item, idx) => (
                <div
                  key={item?.id ?? item?.diagnosis_id ?? item?.medicine_id ?? idx}
                  role="option"
                  aria-selected={idx === activeIndex}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onMouseDown={(e) => e.preventDefault() /* keep input focus */}
                  onClick={() => pick(item)}
                  className={`px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                    idx === activeIndex ? 'bg-slate-100/80 text-teal-700' : 'hover:bg-slate-50 text-gray-800'
                  }`}
                >
                  {renderOption ? renderOption(item) : (
                    <span className="text-sm font-medium text-gray-800">{getOptionLabel(item)}</span>
                  )}
                </div>
              ))
            ) : (
              !loading && (
                <div className="flex items-center gap-2.5 px-3 py-4 text-sm text-gray-500">
                  <SearchX className="w-4 h-4 shrink-0 text-gray-400" />
                  <span className="font-medium">{emptyMessage}</span>
                </div>
              )
            )}
          </motion.div>
      )}
    </div>
  );
}
