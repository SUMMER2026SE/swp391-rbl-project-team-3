// Shared vocabulary for the shift-calendar surfaces (Doctor/Technician
// ShiftCalendarView and the Admin drag-to-assign scheduler) so colors, date
// math, lane layout and motion timing stay identical everywhere.

export const STATUS_META = {
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

export const statusMeta = (status) => STATUS_META[status] || STATUS_META.default;
export const isPending = (s) => s.status !== 'Đã xác nhận' && s.status !== 'Đã hủy';

export const DAY_LABELS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];

// Parse 'YYYY-MM-DD' as a LOCAL date (new Date(string) would treat it as UTC
// and can shift the day in GMT+7).
export function parseLocalDate(dateString) {
    if (!dateString) return null;
    const [y, m, d] = String(dateString).slice(0, 10).split('-').map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
}

export const dateKey = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
        date.getDate()
    ).padStart(2, '0')}`;

export const timeToMinutes = (t) => {
    if (!t) return null;
    const [h, m] = String(t).split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
};

export const minutesToTime = (min) =>
    `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

export const fmtTime = (t) => (t ? String(t).slice(0, 5) : '--:--');

// Monday of the week containing `date`.
export function startOfWeek(date) {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dow = (d.getDay() + 6) % 7; // Mon=0 … Sun=6
    d.setDate(d.getDate() - dow);
    return d;
}

export const addDays = (date, n) => {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    return d;
};

export const fmtDMY = (date) =>
    date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

export const VN_DAY_NAMES = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
export const vnDayName = (date) => VN_DAY_NAMES[date.getDay()];

export const HOUR_HEIGHT = 52; // px per hour in the week grids

// Shared motion vocabulary so every transition feels identical.
// NOTE: never use <AnimatePresence mode="wait"> with these — it deadlocks
// under React StrictMode (see framer-strictmode-animatepresence).
export const EASE = [0.22, 1, 0.36, 1];
export const DUR = 0.28;
export const dialogOverlayMotion = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: DUR * 0.7, ease: 'easeOut' },
};
export const dialogPanelMotion = {
    initial: { opacity: 0, scale: 0.94, y: 14 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.96, y: 8 },
    transition: { duration: DUR, ease: EASE },
};

// Assign side-by-side lanes to overlapping shifts within one day so
// double-booked slots render next to each other instead of stacking.
export function layoutDayShifts(dayShifts, fallbackStart) {
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
