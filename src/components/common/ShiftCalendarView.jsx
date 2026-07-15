import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar,
    CalendarDays,
    CalendarX2,
    Check,
    CheckCheck,
    ChevronLeft,
    ChevronRight,
    Clock,
    MapPin,
    X,
    XCircle,
} from 'lucide-react';
import { DoctorScheduleModel } from '../../models/DoctorScheduleModel';
import { GLASS_BASE } from './GlassCard';

// ─────────────────────────────────────────────────────────────────────────────
// ShiftCalendarView — shared work-schedule calendar for Doctor & Technician.
// Renders doctor_shifts rows on a real calendar (week grid with time-of-day
// placement, or month overview) so staff can see at a glance when their shifts
// fall and confirm them (status 'Đã phân công' → 'Đã xác nhận') straight from
// the calendar. Status is persisted in the DB only — no localStorage cache.
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_META = {
    'Đã xác nhận': {
        label: 'Đã xác nhận',
        chip: 'bg-emerald-100 text-emerald-700 border-emerald-200/70',
        block: 'bg-emerald-500/15 border-emerald-400/60 text-emerald-800 hover:bg-emerald-500/25',
        dot: 'bg-emerald-500',
    },
    'Đã hủy': {
        label: 'Đã hủy',
        chip: 'bg-slate-100 text-slate-400 border-slate-200/70',
        block: 'bg-slate-200/40 border-slate-300/60 text-slate-400 line-through hover:bg-slate-200/60',
        dot: 'bg-slate-400',
    },
    default: {
        label: 'Chưa xác nhận',
        chip: 'bg-sky-100 text-sky-700 border-sky-200/70',
        block: 'bg-sky-500/15 border-sky-400/60 text-sky-800 hover:bg-sky-500/25',
        dot: 'bg-sky-500',
    },
};

const statusMeta = (status) => STATUS_META[status] || STATUS_META.default;
const isPending = (s) => s.status !== 'Đã xác nhận' && s.status !== 'Đã hủy';

const DAY_LABELS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];

// Parse 'YYYY-MM-DD' as a LOCAL date (new Date(string) would treat it as UTC
// and can shift the day in GMT+7).
function parseLocalDate(dateString) {
    if (!dateString) return null;
    const [y, m, d] = String(dateString).slice(0, 10).split('-').map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
}

const dateKey = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
        date.getDate()
    ).padStart(2, '0')}`;

const timeToMinutes = (t) => {
    if (!t) return null;
    const [h, m] = String(t).split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
};

const fmtTime = (t) => (t ? String(t).slice(0, 5) : '--:--');

// Monday of the week containing `date`.
function startOfWeek(date) {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dow = (d.getDay() + 6) % 7; // Mon=0 … Sun=6
    d.setDate(d.getDate() - dow);
    return d;
}

const addDays = (date, n) => {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    return d;
};

const fmtDMY = (date) =>
    date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

const HOUR_HEIGHT = 52; // px per hour in the week grid

// Shared motion vocabulary so every transition in the calendar feels identical.
// NOTE: never use <AnimatePresence mode="wait"> here — it deadlocks under
// React StrictMode (see framer-strictmode-animatepresence).
const EASE = [0.22, 1, 0.36, 1];
const DUR = 0.28;
const dialogOverlayMotion = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: DUR * 0.7, ease: 'easeOut' },
};
const dialogPanelMotion = {
    initial: { opacity: 0, scale: 0.94, y: 14 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.96, y: 8 },
    transition: { duration: DUR, ease: EASE },
};

export default function ShiftCalendarView({ staffId }) {
    const [shifts, setShifts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('week'); // 'week' | 'month'
    const [anchorDate, setAnchorDate] = useState(() => new Date());
    // -1 = navigated back, 1 = forward, 0 = view-mode switch / today jump.
    // Drives the slide direction of the calendar-body transition.
    const [navDir, setNavDir] = useState(0);
    const [selectedShift, setSelectedShift] = useState(null);
    const [confirmAllOpen, setConfirmAllOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let alive = true;
        const fetchShifts = async () => {
            if (!staffId) {
                setShifts([]);
                setLoading(false);
                return;
            }
            setLoading(true);
            const data = await DoctorScheduleModel.getShiftsByDoctor(staffId);
            if (!alive) return;
            setShifts(Array.isArray(data) ? data : []);
            setLoading(false);
        };
        fetchShifts();
        return () => {
            alive = false;
        };
    }, [staffId]);

    // ── Derived data ─────────────────────────────────────────────────────────
    const shiftsByDate = useMemo(() => {
        const map = {};
        shifts.forEach((s) => {
            const key = String(s.work_date || '').slice(0, 10);
            if (!key) return;
            (map[key] = map[key] || []).push(s);
        });
        Object.values(map).forEach((list) =>
            list.sort((a, b) => (timeToMinutes(a.start_time) || 0) - (timeToMinutes(b.start_time) || 0))
        );
        return map;
    }, [shifts]);

    const pendingShifts = useMemo(() => shifts.filter(isPending), [shifts]);
    const confirmedCount = useMemo(
        () => shifts.filter((s) => s.status === 'Đã xác nhận').length,
        [shifts]
    );

    const today = new Date();
    const todayKey = dateKey(today);

    const weekDays = useMemo(() => {
        const start = startOfWeek(anchorDate);
        return Array.from({ length: 7 }, (_, i) => addDays(start, i));
    }, [anchorDate]);

    const weekShiftCount = useMemo(
        () => weekDays.reduce((n, d) => n + (shiftsByDate[dateKey(d)]?.length || 0), 0),
        [weekDays, shiftsByDate]
    );

    // Hour bounds for the week grid: default 07:00–17:00, expanded to fit any
    // shift that falls outside that window.
    const [hourStart, hourEnd] = useMemo(() => {
        let min = 7;
        let max = 17;
        weekDays.forEach((d) => {
            (shiftsByDate[dateKey(d)] || []).forEach((s) => {
                const sm = timeToMinutes(s.start_time);
                const em = timeToMinutes(s.end_time);
                if (sm != null) min = Math.min(min, Math.floor(sm / 60));
                if (em != null) max = Math.max(max, Math.ceil(em / 60));
            });
        });
        return [min, Math.max(max, min + 1)];
    }, [weekDays, shiftsByDate]);

    // ── Mutations ────────────────────────────────────────────────────────────
    const applyLocalStatus = useCallback((ids, status) => {
        const idSet = new Set(ids);
        setShifts((prev) => prev.map((s) => (idSet.has(s.id) ? { ...s, status } : s)));
    }, []);

    const confirmShifts = useCallback(
        async (targets) => {
            const pending = targets.filter(isPending);
            if (pending.length === 0) return;
            setSaving(true);
            try {
                await Promise.all(
                    pending.map((s) => DoctorScheduleModel.updateShift(s.id, { status: 'Đã xác nhận' }))
                );
                applyLocalStatus(pending.map((s) => s.id), 'Đã xác nhận');
            } finally {
                setSaving(false);
            }
        },
        [applyLocalStatus]
    );

    const handleConfirmOne = async (shift) => {
        await confirmShifts([shift]);
        setSelectedShift((prev) => (prev && prev.id === shift.id ? { ...prev, status: 'Đã xác nhận' } : prev));
    };

    const handleConfirmAll = async () => {
        await confirmShifts(pendingShifts);
        setConfirmAllOpen(false);
    };

    // ── Navigation ───────────────────────────────────────────────────────────
    const goPrev = () => {
        setNavDir(-1);
        setAnchorDate((d) =>
            viewMode === 'week' ? addDays(d, -7) : new Date(d.getFullYear(), d.getMonth() - 1, 1)
        );
    };
    const goNext = () => {
        setNavDir(1);
        setAnchorDate((d) =>
            viewMode === 'week' ? addDays(d, 7) : new Date(d.getFullYear(), d.getMonth() + 1, 1)
        );
    };
    const goToday = () => {
        setNavDir(0);
        setAnchorDate(new Date());
    };
    const switchView = (mode) => {
        setNavDir(0);
        setViewMode(mode);
    };

    const rangeLabel =
        viewMode === 'week'
            ? `${fmtDMY(weekDays[0])} – ${fmtDMY(weekDays[6])}`
            : anchorDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });

    // ── Empty / loading states ───────────────────────────────────────────────
    if (!loading && shifts.length === 0) {
        return (
            <div className={`${GLASS_BASE} p-12 flex flex-col items-center justify-center text-center`}>
                <div className="w-16 h-16 rounded-2xl bg-white/50 border border-white/60 flex items-center justify-center mb-4 shadow-inner">
                    <CalendarX2 className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-sm font-semibold text-slate-600">Chưa có ca làm việc nào được phân</p>
                <p className="text-xs text-slate-400 mt-1">
                    Lịch làm việc do quản trị viên phân bổ sẽ hiển thị ở đây.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* ── Pending banner ── */}
            <AnimatePresence initial={false}>
                {pendingShifts.length > 0 && (
                    <motion.div
                        key="pending-banner"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: DUR, ease: EASE }}
                        className="overflow-hidden"
                    >
                        <div className={`${GLASS_BASE} px-5 py-4 flex flex-wrap items-center gap-3`}>
                            <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center shadow-inner shrink-0">
                                <Calendar className="w-5 h-5 text-sky-600" />
                            </div>
                            <div className="flex-1 min-w-[180px]">
                                <p className="text-sm font-bold text-slate-800">
                                    Bạn có {pendingShifts.length} ca chưa xác nhận
                                </p>
                                <p className="text-xs text-slate-500 font-medium">
                                    Nhấn vào ô ca trên lịch để xem chi tiết và xác nhận từng ca.
                                </p>
                            </div>
                            <button
                                onClick={() => setConfirmAllOpen(true)}
                                disabled={saving}
                                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 text-white text-sm font-bold flex items-center gap-2 shadow-md shadow-sky-500/20 hover:shadow-lg transition-all active:scale-95 disabled:opacity-60"
                            >
                                <CheckCheck className="w-4 h-4" />
                                Xác nhận tất cả
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Toolbar ── */}
            <div className={`${GLASS_BASE} px-4 py-3 flex flex-wrap items-center gap-3`}>
                {/* view toggle */}
                <div className="flex rounded-xl bg-white/60 border border-slate-200/70 p-1 shadow-inner">
                    {[
                        { id: 'week', label: 'Tuần', Icon: CalendarDays },
                        { id: 'month', label: 'Tháng', Icon: Calendar },
                    ].map(({ id, label, Icon }) => (
                        <button
                            key={id}
                            onClick={() => switchView(id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                                viewMode === id
                                    ? 'bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow'
                                    : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            <Icon className="w-3.5 h-3.5" />
                            {label}
                        </button>
                    ))}
                </div>

                {/* navigation */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={goPrev}
                        className="w-8 h-8 rounded-lg bg-white/60 border border-slate-200/70 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-white transition-all"
                        aria-label="Trước"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        onClick={goToday}
                        className="px-3 h-8 rounded-lg bg-white/60 border border-slate-200/70 text-xs font-bold text-slate-600 hover:bg-white transition-all"
                    >
                        Hôm nay
                    </button>
                    <button
                        onClick={goNext}
                        className="w-8 h-8 rounded-lg bg-white/60 border border-slate-200/70 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-white transition-all"
                        aria-label="Sau"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>

                <span className="text-sm font-extrabold text-slate-800 capitalize">{rangeLabel}</span>

                {/* legend + counters */}
                <div className="ml-auto flex flex-wrap items-center gap-3 text-[11px] font-bold text-slate-500">
                    {viewMode === 'week' && (
                        <span className="px-2.5 py-1 rounded-full bg-white/60 border border-slate-200/70">
                            {weekShiftCount} ca trong tuần
                        </span>
                    )}
                    <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                        Chưa xác nhận
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        Đã xác nhận ({confirmedCount})
                    </span>
                </div>
            </div>

            {/* ── Calendar body — remounts on view/range change so the keyed
                 motion.div replays one uniform slide+fade (direction follows
                 the nav buttons; view switches just fade up) ── */}
            <motion.div
                key={loading ? 'loading' : `${viewMode}-${rangeLabel}`}
                initial={{ opacity: 0, x: navDir * 36, y: navDir === 0 ? 10 : 0 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ duration: DUR, ease: EASE }}
            >
                {loading ? (
                    <div className={`${GLASS_BASE} p-12 text-center text-sm font-semibold text-slate-400`}>
                        Đang tải lịch làm việc…
                    </div>
                ) : viewMode === 'week' ? (
                    <WeekGrid
                        weekDays={weekDays}
                        shiftsByDate={shiftsByDate}
                        todayKey={todayKey}
                        hourStart={hourStart}
                        hourEnd={hourEnd}
                        onSelect={setSelectedShift}
                    />
                ) : (
                    <MonthGrid
                        anchorDate={anchorDate}
                        shiftsByDate={shiftsByDate}
                        todayKey={todayKey}
                        onSelect={setSelectedShift}
                    />
                )}
            </motion.div>

            {/* ── Shift detail dialog ── */}
            <AnimatePresence>
                {selectedShift && (
                    <ShiftDetailDialog
                        key="shift-detail"
                        shift={selectedShift}
                        saving={saving}
                        onClose={() => setSelectedShift(null)}
                        onConfirm={handleConfirmOne}
                    />
                )}
            </AnimatePresence>

            {/* ── Confirm-all dialog ── */}
            <AnimatePresence>
                {confirmAllOpen && (
                    <DialogFrame key="confirm-all" onClose={() => setConfirmAllOpen(false)}>
                        <p className="text-base font-extrabold text-slate-900 mb-1">
                            Xác nhận tất cả ca làm việc?
                        </p>
                        <p className="text-sm text-slate-500 font-medium mb-5">
                            {pendingShifts.length} ca đang chờ sẽ được chuyển sang trạng thái{' '}
                            <span className="font-bold text-emerald-600">Đã xác nhận</span>.
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setConfirmAllOpen(false)}
                                className="py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200 transition-all"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleConfirmAll}
                                disabled={saving}
                                className="py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm shadow-md shadow-emerald-500/20 hover:shadow-lg transition-all disabled:opacity-60"
                            >
                                {saving ? 'Đang lưu…' : 'Xác nhận tất cả'}
                            </button>
                        </div>
                    </DialogFrame>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ────────────────────────── Week grid ────────────────────────── */

// Assign side-by-side lanes to overlapping shifts within one day so
// double-booked slots render next to each other instead of stacking.
function layoutDayShifts(dayShifts, fallbackStart) {
    const items = dayShifts.map((s) => {
        const start = timeToMinutes(s.start_time) ?? fallbackStart;
        const end = Math.max(timeToMinutes(s.end_time) ?? start + 60, start + 15);
        return { shift: s, start, end, lane: 0, cols: 1 };
    });
    items.sort((a, b) => a.start - b.start || a.end - b.end);

    const laneEnds = [];
    let cluster = [];
    let clusterEnd = -1;
    const flush = () => {
        cluster.forEach((it) => (it.cols = laneEnds.length));
        laneEnds.length = 0;
        cluster = [];
    };
    items.forEach((it) => {
        if (cluster.length && it.start >= clusterEnd) flush();
        let lane = laneEnds.findIndex((end) => end <= it.start);
        if (lane === -1) {
            lane = laneEnds.length;
            laneEnds.push(it.end);
        } else {
            laneEnds[lane] = it.end;
        }
        it.lane = lane;
        clusterEnd = Math.max(clusterEnd, it.end);
        cluster.push(it);
    });
    flush();
    return items;
}

function WeekGrid({ weekDays, shiftsByDate, todayKey, hourStart, hourEnd, onSelect }) {
    const totalMinutes = (hourEnd - hourStart) * 60;
    const gridHeight = (hourEnd - hourStart) * HOUR_HEIGHT;
    const hours = Array.from({ length: hourEnd - hourStart + 1 }, (_, i) => hourStart + i);

    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const nowOffset = ((nowMinutes - hourStart * 60) / totalMinutes) * gridHeight;
    const showNowLine = nowOffset >= 0 && nowOffset <= gridHeight;

    return (
        <div className={`${GLASS_BASE} p-4 overflow-x-auto`}>
            <div className="min-w-[760px]">
                {/* day headers */}
                <div className="grid" style={{ gridTemplateColumns: '56px repeat(7, 1fr)' }}>
                    <div />
                    {weekDays.map((d, i) => {
                        const key = dateKey(d);
                        const isToday = key === todayKey;
                        const count = shiftsByDate[key]?.length || 0;
                        return (
                            <div key={key} className="px-1 pb-3 text-center">
                                <p
                                    className={`text-[11px] font-bold uppercase tracking-wide ${
                                        isToday ? 'text-sky-600' : 'text-slate-400'
                                    }`}
                                >
                                    {DAY_LABELS[i]}
                                </p>
                                <div
                                    className={`mt-1 mx-auto w-9 h-9 rounded-xl flex items-center justify-center text-sm font-extrabold ${
                                        isToday
                                            ? 'bg-gradient-to-br from-sky-500 to-indigo-500 text-white shadow-md shadow-sky-500/30'
                                            : 'text-slate-700'
                                    }`}
                                >
                                    {d.getDate()}
                                </div>
                                {count > 0 && (
                                    <p className="mt-0.5 text-[10px] font-bold text-slate-400">{count} ca</p>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* time grid */}
                <div
                    className="grid relative"
                    style={{ gridTemplateColumns: '56px repeat(7, 1fr)', height: gridHeight }}
                >
                    {/* hour labels + lines */}
                    <div className="relative">
                        {hours.map((h) => (
                            <span
                                key={h}
                                className="absolute -translate-y-1/2 right-2 text-[10px] font-bold text-slate-400"
                                style={{ top: (h - hourStart) * HOUR_HEIGHT }}
                            >
                                {String(h).padStart(2, '0')}:00
                            </span>
                        ))}
                    </div>

                    {weekDays.map((d) => {
                        const key = dateKey(d);
                        const isToday = key === todayKey;
                        const dayShifts = shiftsByDate[key] || [];
                        return (
                            <div
                                key={key}
                                className={`relative border-l border-slate-200/60 ${
                                    isToday ? 'bg-sky-50/40' : ''
                                }`}
                            >
                                {/* hour lines */}
                                {hours.map((h) => (
                                    <div
                                        key={h}
                                        className="absolute left-0 right-0 border-t border-slate-200/50"
                                        style={{ top: (h - hourStart) * HOUR_HEIGHT }}
                                    />
                                ))}

                                {/* current time indicator */}
                                {isToday && showNowLine && (
                                    <div
                                        className="absolute left-0 right-0 z-20 pointer-events-none"
                                        style={{ top: nowOffset }}
                                    >
                                        <div className="h-[2px] bg-rose-500/80" />
                                        <div className="w-2 h-2 rounded-full bg-rose-500 -mt-[5px]" />
                                    </div>
                                )}

                                {/* shift blocks */}
                                {layoutDayShifts(dayShifts, hourStart * 60).map(({ shift: s, start, end, lane, cols }) => {
                                    const top = ((start - hourStart * 60) / totalMinutes) * gridHeight;
                                    const height = Math.max(
                                        ((end - start) / totalMinutes) * gridHeight,
                                        26
                                    );
                                    const meta = statusMeta(s.status);
                                    return (
                                        <button
                                            key={s.id}
                                            onClick={() => onSelect(s)}
                                            className={`absolute z-10 rounded-lg border px-1.5 py-1 text-left overflow-hidden transition-all ${meta.block}`}
                                            style={{
                                                top,
                                                height,
                                                left: `calc(${(lane / cols) * 100}% + 3px)`,
                                                width: `calc(${100 / cols}% - 6px)`,
                                            }}
                                            title={`${fmtTime(s.start_time)} - ${fmtTime(s.end_time)}${
                                                s.room ? ` · ${s.room}` : ''
                                            } · ${meta.label}`}
                                        >
                                            <p className="text-[10px] font-extrabold leading-tight truncate">
                                                {fmtTime(s.start_time)} - {fmtTime(s.end_time)}
                                            </p>
                                            {height >= 40 && s.room && (
                                                <p className="text-[10px] font-semibold leading-tight truncate opacity-80">
                                                    {s.room}
                                                </p>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

/* ────────────────────────── Month grid ────────────────────────── */

function MonthGrid({ anchorDate, shiftsByDate, todayKey, onSelect }) {
    const monthStart = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);
    const gridStart = startOfWeek(monthStart);
    const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));

    return (
        <div className={`${GLASS_BASE} p-4 overflow-x-auto`}>
            <div className="min-w-[720px]">
                <div className="grid grid-cols-7 mb-2">
                    {DAY_LABELS.map((l) => (
                        <p
                            key={l}
                            className="text-center text-[11px] font-bold uppercase tracking-wide text-slate-400"
                        >
                            {l}
                        </p>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                    {cells.map((d) => {
                        const key = dateKey(d);
                        const inMonth = d.getMonth() === anchorDate.getMonth();
                        const isToday = key === todayKey;
                        const dayShifts = shiftsByDate[key] || [];
                        const visible = dayShifts.slice(0, 2);
                        const overflow = dayShifts.length - visible.length;
                        return (
                            <div
                                key={key}
                                className={`min-h-[86px] rounded-xl border p-1.5 transition-all ${
                                    isToday
                                        ? 'border-sky-300 bg-sky-50/70 ring-1 ring-sky-200'
                                        : inMonth
                                        ? 'border-slate-200/60 bg-white/40'
                                        : 'border-transparent bg-white/20 opacity-45'
                                }`}
                            >
                                <p
                                    className={`text-xs font-extrabold mb-1 ${
                                        isToday
                                            ? 'text-sky-600'
                                            : inMonth
                                            ? 'text-slate-700'
                                            : 'text-slate-400'
                                    }`}
                                >
                                    {d.getDate()}
                                </p>
                                <div className="space-y-1">
                                    {visible.map((s) => {
                                        const meta = statusMeta(s.status);
                                        return (
                                            <button
                                                key={s.id}
                                                onClick={() => onSelect(s)}
                                                className={`w-full rounded-md border px-1 py-0.5 text-left flex items-center gap-1 transition-all ${meta.block}`}
                                                title={`${fmtTime(s.start_time)} - ${fmtTime(s.end_time)} · ${meta.label}`}
                                            >
                                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${meta.dot}`} />
                                                <span className="text-[10px] font-bold truncate">
                                                    {fmtTime(s.start_time)}-{fmtTime(s.end_time)}
                                                </span>
                                            </button>
                                        );
                                    })}
                                    {overflow > 0 && (
                                        <p className="text-[10px] font-bold text-slate-400 pl-1">
                                            +{overflow} ca khác
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

/* ────────────────────────── Dialogs ────────────────────────── */

function DialogFrame({ onClose, children }) {
    return (
        <div
            className="fixed inset-0 z-[80] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
        >
            <motion.div
                {...dialogOverlayMotion}
                className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
                onClick={onClose}
            />
            <motion.div
                {...dialogPanelMotion}
                className="relative w-full max-w-sm rounded-2xl bg-white/95 backdrop-blur-xl border border-white/70 shadow-2xl p-6"
            >
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
                    aria-label="Đóng"
                >
                    <X className="w-4 h-4" />
                </button>
                {children}
            </motion.div>
        </div>
    );
}

function ShiftDetailDialog({ shift, saving, onClose, onConfirm }) {
    const meta = statusMeta(shift.status);
    const date = parseLocalDate(shift.work_date);
    const dayLabel = date
        ? date.toLocaleDateString('vi-VN', {
              weekday: 'long',
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
          })
        : shift.work_date;
    const pending = isPending(shift);

    return (
        <DialogFrame onClose={onClose}>
            <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center shadow-inner shrink-0">
                    <Calendar className="w-5 h-5 text-sky-600" />
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-extrabold text-slate-900 capitalize truncate">{dayLabel}</p>
                    <span
                        className={`inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold border ${meta.chip}`}
                    >
                        {shift.status === 'Đã xác nhận' ? (
                            <Check className="w-3 h-3" />
                        ) : (
                            <XCircle className="w-3 h-3" />
                        )}
                        {meta.label}
                    </span>
                </div>
            </div>

            <div className="space-y-2 mb-5">
                <div className="flex items-center gap-2 text-sm text-slate-600 font-semibold bg-white/70 p-3 rounded-xl border border-slate-100">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                    {fmtTime(shift.start_time)} - {fmtTime(shift.end_time)}
                </div>
                {shift.room && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 font-semibold bg-white/70 p-3 rounded-xl border border-slate-100">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                        {shift.room}
                    </div>
                )}
            </div>

            {pending ? (
                <button
                    onClick={() => onConfirm(shift)}
                    disabled={saving}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 hover:shadow-lg transition-all active:scale-95 disabled:opacity-60"
                >
                    <Check className="w-4 h-4" />
                    {saving ? 'Đang lưu…' : 'Xác nhận ca này'}
                </button>
            ) : (
                <div
                    className={`w-full py-3 rounded-xl text-center font-bold text-sm border ${
                        shift.status === 'Đã xác nhận'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-50 text-slate-400 border-slate-200'
                    }`}
                >
                    {shift.status === 'Đã xác nhận' ? 'Ca đã được xác nhận' : 'Ca đã bị hủy'}
                </div>
            )}
        </DialogFrame>
    );
}
