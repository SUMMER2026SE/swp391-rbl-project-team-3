/**
 * WorkHoursTab.jsx — "Chấm công"
 * ───────────────────────────────────────────────────────────────────────────
 * Personal timesheet for staff (Doctor / Technician / Receptionist): total
 * confirmed working hours with a week / month / year period switcher, prev-next
 * navigation, headline stat tiles and a single-series bar breakdown
 * (hours per day / per week / per month).
 *
 * Data source: doctor_shifts (shared by doctors & technicians — staffId goes
 * into doctor_id). Only shifts with status 'Đã xác nhận' are counted; a shift
 * counts as "worked" once its date is today or earlier.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Clock, ChevronLeft, ChevronRight, CalendarCheck, CalendarClock, Timer, Loader2, CalendarX2,
} from 'lucide-react';
import { DoctorScheduleModel } from '../../../models/DoctorScheduleModel';
import { timeToMinutes, startOfWeek, addDays, dateKey } from '../../common/scheduleUtils';

const PERIODS = [
  { id: 'week', label: 'Tuần' },
  { id: 'month', label: 'Tháng' },
  { id: 'year', label: 'Năm' },
];

const WEEK_BAR_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

const shiftHours = (s) => {
  const mins = (timeToMinutes(s.end_time) || 0) - (timeToMinutes(s.start_time) || 0);
  return mins > 0 ? mins / 60 : 0;
};

const fmtH = (h) => {
  const rounded = Math.round(h * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
};

const pad2 = (n) => String(n).padStart(2, '0');

export default function WorkHoursTab({ staffId }) {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('week');
  const [anchor, setAnchor] = useState(() => new Date());

  useEffect(() => {
    let alive = true;
    if (!staffId) { setShifts([]); setLoading(false); return undefined; }
    setLoading(true);
    DoctorScheduleModel.getShiftsByDoctor(staffId)
      .then((rows) => { if (alive) setShifts(Array.isArray(rows) ? rows : []); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [staffId]);

  // ── Period range + label ──────────────────────────────────────────────────
  const { rangeStart, rangeEnd, rangeLabel } = useMemo(() => {
    if (mode === 'week') {
      const start = startOfWeek(anchor);
      const end = addDays(start, 6);
      return {
        rangeStart: start,
        rangeEnd: end,
        rangeLabel: `${pad2(start.getDate())}/${pad2(start.getMonth() + 1)} – ${pad2(end.getDate())}/${pad2(end.getMonth() + 1)}/${end.getFullYear()}`,
      };
    }
    if (mode === 'month') {
      const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
      const end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
      return { rangeStart: start, rangeEnd: end, rangeLabel: `Tháng ${anchor.getMonth() + 1}/${anchor.getFullYear()}` };
    }
    return {
      rangeStart: new Date(anchor.getFullYear(), 0, 1),
      rangeEnd: new Date(anchor.getFullYear(), 11, 31),
      rangeLabel: `Năm ${anchor.getFullYear()}`,
    };
  }, [mode, anchor]);

  const navigate = (dir) => {
    setAnchor((prev) => {
      if (mode === 'week') return addDays(prev, dir * 7);
      if (mode === 'month') return new Date(prev.getFullYear(), prev.getMonth() + dir, 1);
      return new Date(prev.getFullYear() + dir, prev.getMonth(), 1);
    });
  };

  // ── Aggregation (confirmed shifts only) ───────────────────────────────────
  const { doneHours, doneCount, upcomingHours, avgHours, buckets, maxBucket } = useMemo(() => {
    const startKey = dateKey(rangeStart);
    const endKey = dateKey(rangeEnd);
    const todayKey = dateKey(new Date());

    const inRange = shifts.filter((s) => {
      if (s.status !== 'Đã xác nhận') return false;
      const k = String(s.work_date || '').slice(0, 10);
      return k >= startKey && k <= endKey;
    });

    const done = inRange.filter((s) => String(s.work_date).slice(0, 10) <= todayKey);
    const upcoming = inRange.filter((s) => String(s.work_date).slice(0, 10) > todayKey);

    const dHours = done.reduce((acc, s) => acc + shiftHours(s), 0);
    const uHours = upcoming.reduce((acc, s) => acc + shiftHours(s), 0);

    // Bar buckets — worked hours only, so the chart reads as "đã làm".
    let list = [];
    if (mode === 'week') {
      list = WEEK_BAR_LABELS.map((label, i) => ({ label, key: dateKey(addDays(rangeStart, i)), hours: 0 }));
      done.forEach((s) => {
        const b = list.find((x) => x.key === String(s.work_date).slice(0, 10));
        if (b) b.hours += shiftHours(s);
      });
    } else if (mode === 'month') {
      const weeksInMonth = Math.ceil(rangeEnd.getDate() / 7);
      list = Array.from({ length: weeksInMonth }, (_, i) => ({ label: `Tuần ${i + 1}`, hours: 0 }));
      done.forEach((s) => {
        const day = parseInt(String(s.work_date).slice(8, 10), 10);
        const idx = Math.min(Math.floor((day - 1) / 7), weeksInMonth - 1);
        list[idx].hours += shiftHours(s);
      });
    } else {
      list = Array.from({ length: 12 }, (_, i) => ({ label: `T${i + 1}`, hours: 0 }));
      done.forEach((s) => {
        const m = parseInt(String(s.work_date).slice(5, 7), 10) - 1;
        if (m >= 0 && m < 12) list[m].hours += shiftHours(s);
      });
    }

    return {
      doneHours: dHours,
      doneCount: done.length,
      upcomingHours: uHours,
      avgHours: done.length ? dHours / done.length : 0,
      buckets: list,
      maxBucket: Math.max(...list.map((b) => b.hours), 0),
    };
  }, [shifts, rangeStart, rangeEnd, mode]);

  const hasAnyShift = shifts.some((s) => s.status === 'Đã xác nhận');

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-slate-400 text-sm font-semibold">
        <Loader2 className="w-4 h-4 animate-spin" /> Đang tải dữ liệu giờ làm việc…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-teal-50 rounded-xl text-teal-600 border border-teal-100">
          <Clock className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">Thống kê giờ làm việc</h3>
          <p className="text-xs text-slate-500 mt-0.5">Theo dõi số giờ bạn đã làm theo tuần, tháng hoặc năm — chỉ tính các ca đã xác nhận</p>
        </div>
      </div>

      {/* Controls — period switcher + prev/next navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="grid grid-flow-col auto-cols-fr gap-1 bg-slate-900/5 rounded-2xl p-1.5 w-full sm:w-64">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              onClick={() => setMode(p.id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border-none cursor-pointer ${
                mode === p.id
                  ? 'bg-gradient-to-br from-[#00685f] to-[#0058be] text-white shadow-md shadow-emerald-600/25'
                  : 'bg-transparent text-slate-600 hover:bg-white/70'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => navigate(-1)}
            aria-label="Kỳ trước"
            className="w-9 h-9 rounded-xl flex items-center justify-center border border-slate-200 bg-white text-slate-500 hover:text-teal-700 hover:border-teal-300 hover:bg-teal-50/70 transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="min-w-[170px] text-center text-sm font-bold text-slate-700 select-none">{rangeLabel}</span>
          <button
            onClick={() => navigate(1)}
            aria-label="Kỳ sau"
            className="w-9 h-9 rounded-xl flex items-center justify-center border border-slate-200 bg-white text-slate-500 hover:text-teal-700 hover:border-teal-300 hover:bg-teal-50/70 transition-all cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setAnchor(new Date())}
            className="ml-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-500 hover:text-teal-700 hover:border-teal-300 hover:bg-teal-50/70 transition-all cursor-pointer"
          >
            Hiện tại
          </button>
        </div>
      </div>

      {!hasAnyShift ? (
        <div className="text-center py-14 border border-dashed border-slate-200 rounded-2xl bg-white/50">
          <CalendarX2 className="w-9 h-9 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500 font-semibold">Chưa có dữ liệu ca làm việc.</p>
          <p className="text-xs text-slate-400 mt-1">Khi quản trị viên phân ca và bạn xác nhận, số giờ làm sẽ được thống kê tại đây.</p>
        </div>
      ) : (
        <>
          {/* Stat tiles */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-teal-50 border border-teal-100 rounded-2xl p-4">
              <p className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5"><Timer className="w-3.5 h-3.5 text-teal-600" /> Tổng giờ đã làm</p>
              <p className="mt-1.5 text-3xl font-extrabold text-teal-700 leading-none">{fmtH(doneHours)}<span className="text-sm font-bold text-teal-600/70 ml-1">giờ</span></p>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
              <p className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5"><CalendarCheck className="w-3.5 h-3.5 text-emerald-600" /> Ca đã hoàn thành</p>
              <p className="mt-1.5 text-3xl font-extrabold text-emerald-700 leading-none">{doneCount}<span className="text-sm font-bold text-emerald-600/70 ml-1">ca</span></p>
            </div>
            <div className="bg-sky-50 border border-sky-100 rounded-2xl p-4">
              <p className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-sky-600" /> Trung bình / ca</p>
              <p className="mt-1.5 text-3xl font-extrabold text-sky-700 leading-none">{fmtH(avgHours)}<span className="text-sm font-bold text-sky-600/70 ml-1">giờ</span></p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <p className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5"><CalendarClock className="w-3.5 h-3.5 text-slate-500" /> Giờ sắp tới trong kỳ</p>
              <p className="mt-1.5 text-3xl font-extrabold text-slate-600 leading-none">{fmtH(upcomingHours)}<span className="text-sm font-bold text-slate-500/70 ml-1">giờ</span></p>
            </div>
          </div>

          {/* Bar breakdown — single series (worked hours), brand teal */}
          <div className="bg-white/60 border border-white/70 backdrop-blur-xl rounded-2xl p-5">
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-4">
              Giờ đã làm {mode === 'week' ? 'theo ngày' : mode === 'month' ? 'theo tuần' : 'theo tháng'}
            </p>
            {maxBucket > 0 ? (
              <div className="flex items-end gap-1.5 border-b border-slate-200 pb-0 h-[160px]">
                {buckets.map((b) => {
                  const px = b.hours > 0 ? Math.max((b.hours / maxBucket) * 128, 3) : 0;
                  return (
                    <div key={b.label} className="group relative flex-1 min-w-0 h-full flex flex-col items-center justify-end">
                      {/* hover tooltip */}
                      <div className="absolute -top-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded-lg pointer-events-none whitespace-nowrap z-10">
                        {fmtH(b.hours)} giờ
                      </div>
                      {b.hours > 0 && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: px }}
                          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                          className="w-full max-w-[40px] rounded-t-[4px] bg-teal-600/90 group-hover:bg-teal-700 transition-colors"
                          title={`${b.label}: ${fmtH(b.hours)} giờ`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl bg-white/50">
                <p className="text-sm text-slate-400 font-medium">Không có giờ làm nào trong kỳ này.</p>
              </div>
            )}
            {/* bucket labels under the baseline */}
            <div className="flex gap-1.5 mt-2">
              {buckets.map((b) => (
                <span key={b.label} className="flex-1 min-w-0 text-center text-[10px] font-bold text-slate-600 truncate">{b.label}</span>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
