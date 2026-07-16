/**
 * GlassPagination.jsx
 * ───────────────────────────────────────────────────────────────────────────
 * Shared numbered pager for every long list in the profile area (appointments,
 * feedback history, clinical timeline, …). True pagination: the current page
 * REPLACES its content — older entries live on the next pages instead of being
 * appended below. Renders nothing when everything fits on one page.
 *
 * Shows a sliding window of up to 5 page numbers with leading/trailing
 * ellipses, plus prev / next chevrons. Active page uses the brand gradient
 * pill (same recipe as ProfileTabs).
 */
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function GlassPagination({ total, page, pageSize = 5, onPageChange, className = '' }) {
  const totalPages = Math.ceil((total || 0) / pageSize);
  if (totalPages <= 1) return null;

  let start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);
  start = Math.max(1, end - 4);
  const pages = [];
  for (let i = start; i <= end; i += 1) pages.push(i);

  const navBtn =
    'w-9 h-9 rounded-xl flex items-center justify-center border border-slate-200 bg-white text-slate-500 ' +
    'hover:text-teal-700 hover:border-teal-300 hover:bg-teal-50/70 transition-all cursor-pointer ' +
    'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-slate-500 disabled:hover:border-slate-200';

  return (
    <nav className={`flex items-center justify-center gap-1.5 ${className}`} aria-label="Phân trang">
      <button type="button" onClick={() => onPageChange(page - 1)} disabled={page <= 1} className={navBtn} aria-label="Trang trước">
        <ChevronLeft className="w-4 h-4" />
      </button>

      {start > 1 && <span className="w-6 text-center text-xs font-bold text-slate-400 select-none">…</span>}

      {pages.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onPageChange(p)}
          aria-current={p === page ? 'page' : undefined}
          className={`w-9 h-9 rounded-xl text-xs font-bold flex items-center justify-center transition-all cursor-pointer border ${
            p === page
              ? 'bg-gradient-to-br from-[#00685f] to-[#0058be] text-white border-transparent shadow-md shadow-emerald-600/25'
              : 'bg-white text-slate-600 border-slate-200 hover:text-teal-700 hover:border-teal-300 hover:bg-teal-50/70'
          }`}
        >
          {p}
        </button>
      ))}

      {end < totalPages && <span className="w-6 text-center text-xs font-bold text-slate-400 select-none">…</span>}

      <button type="button" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} className={navBtn} aria-label="Trang sau">
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
}
