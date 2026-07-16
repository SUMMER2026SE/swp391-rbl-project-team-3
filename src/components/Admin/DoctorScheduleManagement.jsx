import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AlertTriangle,
    Calendar,
    CalendarPlus,
    Check,
    CheckCheck,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    Copy,
    MapPin,
    MousePointerClick,
    Stethoscope,
    Trash2,
    Wrench,
    X,
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { vi } from 'date-fns/locale';
import { useDoctors, useTechnicians } from '../../hooks/useDoctors';
import { DoctorScheduleModel } from '../../models/DoctorScheduleModel';
import { GLASS_BASE } from '../common/GlassCard';
import GlassSelect from '../common/GlassSelect';
import {
    statusMeta,
    isPending,
    DAY_LABELS,
    dateKey,
    timeToMinutes,
    minutesToTime,
    fmtTime,
    startOfWeek,
    addDays,
    fmtDMY,
    vnDayName,
    parseLocalDate,
    HOUR_HEIGHT,
    EASE,
    DUR,
    dialogOverlayMotion,
    dialogPanelMotion,
    layoutDayShifts,
} from '../common/scheduleUtils';

// ─────────────────────────────────────────────────────────────────────────────
// Admin work-schedule manager — drag-to-assign calendar with a DRAFT BASKET.
// Same week-grid visual language as the Doctor/Technician ShiftCalendarView.
// Every drag on empty grid space drops an amber "ca nháp" (draft shift) onto
// the calendar instead of interrupting with a dialog; the admin keeps dragging
// (across days, weeks, even different staff), then commits everything at once
// from the floating bar. Clicking a draft edits/expands (weekly repeat) or
// removes it; clicking a saved shift edits/revokes it in the DB.
// ─────────────────────────────────────────────────────────────────────────────

const SNAP = 30; // drag snaps to 30-minute slots
const GRID_START_MIN = 7 * 60;
const GRID_END_MIN = 21 * 60;

const TIME_OPTIONS = [];
for (let m = GRID_START_MIN; m <= GRID_END_MIN; m += SNAP) {
    TIME_OPTIONS.push({ label: minutesToTime(m), value: m });
}

const ROOM_OPTIONS = [
    'Phòng khám 1',
    'Phòng khám 2',
    'Phòng khám 3',
    'Phòng 102',
    'Phòng 201',
    'Phòng 305',
    'Phòng thủ thuật 1',
    'Phòng laser',
].map((r) => ({ label: r, value: r }));

const STATUS_OPTIONS = ['Đã phân công', 'Đã xác nhận', 'Đã hủy'].map((s) => ({ label: s, value: s }));

// Repeat chips use JS getDay() values (Mon=1 … Sat=6, Sun=0).
const WEEKDAY_CHIPS = [
    { label: 'T2', value: 1 },
    { label: 'T3', value: 2 },
    { label: 'T4', value: 3 },
    { label: 'T5', value: 4 },
    { label: 'T6', value: 5 },
    { label: 'T7', value: 6 },
    { label: 'CN', value: 0 },
];

// Shift templates for one-click time ranges inside the draft dialog.
const SHIFT_TEMPLATES = [
    { label: 'Ca sáng', start: 8 * 60, end: 12 * 60 },
    { label: 'Ca chiều', start: 13 * 60, end: 17 * 60 },
    { label: 'Cả ngày', start: 8 * 60, end: 17 * 60 },
];

const todayKeyStr = () => dateKey(new Date());

// A shift spanning the 12:00–13:00 lunch break is split in two (same rule the
// old admin form applied) so patient booking never lands in the break.
function splitLunch(startMin, endMin) {
    if (startMin < 12 * 60 && endMin > 13 * 60) {
        return [
            [startMin, 12 * 60],
            [13 * 60, endMin],
        ];
    }
    return [[startMin, endMin]];
}

const overlaps = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && aEnd > bStart;

let draftSeq = 0;
const newDraftId = () => `draft-${Date.now()}-${draftSeq++}`;

export default function DoctorScheduleManagement() {
    const { doctors, loading: docsLoading } = useDoctors();
    const { technicians, loading: techsLoading } = useTechnicians();

    const [staffType, setStaffType] = useState('doctor'); // 'doctor' | 'technician'
    const staffList = staffType === 'doctor' ? doctors : technicians;
    const staffLoading = staffType === 'doctor' ? docsLoading : techsLoading;
    const [staffId, setStaffId] = useState('');
    const staff = staffList.find((s) => s.id === staffId) || null;

    const [shifts, setShifts] = useState([]);
    const [loadingShifts, setLoadingShifts] = useState(false);
    const [anchorDate, setAnchorDate] = useState(() => new Date());
    const [navDir, setNavDir] = useState(0);
    const [saving, setSaving] = useState(false);

    // Draft basket: shifts drawn but not yet committed. Items are tagged with
    // the staff they were drawn for, so switching staff never loses them.
    const [drafts, setDrafts] = useState([]);
    const [defaultRoom, setDefaultRoom] = useState(ROOM_OPTIONS[0].value);

    const [draftDlg, setDraftDlg] = useState(null); // editing one draft item
    const [editDlg, setEditDlg] = useState(null); // editing a saved shift
    const [copyDlg, setCopyDlg] = useState(null);
    const [toast, setToast] = useState(null);

    const notify = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    // Default to the first staff member whenever the active list changes.
    useEffect(() => {
        if (staffList.length > 0 && !staffList.some((s) => s.id === staffId)) {
            setStaffId(staffList[0].id);
        }
    }, [staffList, staffId]);

    useEffect(() => {
        let alive = true;
        const fetchShifts = async () => {
            if (!staffId) {
                setShifts([]);
                return;
            }
            setLoadingShifts(true);
            const data = await DoctorScheduleModel.getShiftsByDoctor(staffId);
            if (!alive) return;
            setShifts(Array.isArray(data) ? data : []);
            setLoadingShifts(false);
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
        return map;
    }, [shifts]);

    const staffDrafts = useMemo(() => drafts.filter((d) => d.staffId === staffId), [drafts, staffId]);
    const draftsByDate = useMemo(() => {
        const map = {};
        staffDrafts.forEach((d) => {
            (map[d.dateStr] = map[d.dateStr] || []).push(d);
        });
        return map;
    }, [staffDrafts]);

    const weekDays = useMemo(() => {
        const start = startOfWeek(anchorDate);
        return Array.from({ length: 7 }, (_, i) => addDays(start, i));
    }, [anchorDate]);

    const weekShifts = useMemo(
        () => weekDays.flatMap((d) => shiftsByDate[dateKey(d)] || []),
        [weekDays, shiftsByDate]
    );
    const weekDraftCount = useMemo(
        () => weekDays.reduce((n, d) => n + (draftsByDate[dateKey(d)]?.length || 0), 0),
        [weekDays, draftsByDate]
    );

    const weekStats = useMemo(() => {
        const active = weekShifts.filter((s) => s.status !== 'Đã hủy');
        const minutes = active.reduce((sum, s) => {
            const a = timeToMinutes(s.start_time) ?? 0;
            const b = timeToMinutes(s.end_time) ?? a;
            return sum + Math.max(b - a, 0);
        }, 0);
        return {
            count: active.length,
            hours: Math.round((minutes / 60) * 10) / 10,
            pending: active.filter(isPending).length,
            confirmed: active.filter((s) => s.status === 'Đã xác nhận').length,
        };
    }, [weekShifts]);

    const draftStats = useMemo(() => {
        const minutes = drafts.reduce((sum, d) => sum + (d.endMin - d.startMin), 0);
        const staffCount = new Set(drafts.map((d) => d.staffId)).size;
        return { count: drafts.length, hours: Math.round((minutes / 60) * 10) / 10, staffCount };
    }, [drafts]);

    const [hourStart, hourEnd] = useMemo(() => {
        let min = GRID_START_MIN / 60;
        let max = GRID_END_MIN / 60;
        weekShifts.forEach((s) => {
            const sm = timeToMinutes(s.start_time);
            const em = timeToMinutes(s.end_time);
            if (sm != null) min = Math.min(min, Math.floor(sm / 60));
            if (em != null) max = Math.max(max, Math.ceil(em / 60));
        });
        return [min, Math.max(max, min + 1)];
    }, [weekShifts]);

    const conflictsFor = (dateStr, startMin, endMin, ignoreId = null) =>
        (shiftsByDate[dateStr] || []).filter(
            (s) =>
                s.id !== ignoreId &&
                s.status !== 'Đã hủy' &&
                overlaps(startMin, endMin, timeToMinutes(s.start_time) ?? 0, timeToMinutes(s.end_time) ?? 0)
        );

    // ── Navigation ───────────────────────────────────────────────────────────
    const goPrev = () => {
        setNavDir(-1);
        setAnchorDate((d) => addDays(d, -7));
    };
    const goNext = () => {
        setNavDir(1);
        setAnchorDate((d) => addDays(d, 7));
    };
    const goToday = () => {
        setNavDir(0);
        setAnchorDate(new Date());
    };
    const rangeLabel = `${fmtDMY(weekDays[0])} – ${fmtDMY(weekDays[6])}`;

    // ── Drag → draft ─────────────────────────────────────────────────────────
    const draftRef = useRef(null);
    const [dragSel, setDragSelState] = useState(null);
    const setDragSel = (v) => {
        draftRef.current = v;
        setDragSelState(v);
    };

    const beginDrag = (e, day, colEl) => {
        if (e.button !== 0 || !staffId || saving) return;
        if (dateKey(day) < todayKeyStr()) {
            notify('Không thể tạo ca trong quá khứ.', 'error');
            return;
        }
        e.preventDefault();
        const rect = colEl.getBoundingClientRect();
        const gridStartMin = hourStart * 60;
        const gridEndMin = hourEnd * 60;
        const minsAt = (clientY) => {
            const ratio = (clientY - rect.top) / rect.height;
            const raw = gridStartMin + ratio * (gridEndMin - gridStartMin);
            const snapped = Math.round(raw / SNAP) * SNAP;
            return Math.max(gridStartMin, Math.min(gridEndMin, snapped));
        };
        const anchor = Math.min(minsAt(e.clientY), gridEndMin - SNAP);
        setDragSel({ day, key: dateKey(day), startMin: anchor, endMin: anchor + SNAP });

        const onMove = (ev) => {
            const cur = minsAt(ev.clientY);
            setDragSel({
                day,
                key: dateKey(day),
                startMin: Math.min(anchor, cur),
                endMin: Math.max(anchor + SNAP, cur),
            });
        };
        const onUp = () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
            const sel = draftRef.current;
            setDragSel(null);
            if (sel && staff) {
                setDrafts((prev) => [
                    ...prev,
                    {
                        tempId: newDraftId(),
                        staffId: staff.id,
                        staffName: staff.name,
                        date: sel.day,
                        dateStr: sel.key,
                        startMin: sel.startMin,
                        endMin: Math.max(sel.endMin, sel.startMin + SNAP),
                        room: defaultRoom,
                        status: 'Đã phân công',
                    },
                ]);
            }
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    };

    // ── Draft editing ────────────────────────────────────────────────────────
    const openDraft = (item) =>
        setDraftDlg({
            ...item,
            repeat: false,
            repeatDays: [item.date.getDay()],
            repeatUntil: item.date,
        });

    // Expand a draft config into concrete dates (weekly repeat).
    const expandDates = (cfg) => {
        if (cfg.repeat && cfg.repeatUntil && dateKey(cfg.repeatUntil) > dateKey(cfg.date)) {
            const dates = [];
            let cur = new Date(cfg.date);
            while (dateKey(cur) <= dateKey(cfg.repeatUntil)) {
                if (cfg.repeatDays.includes(cur.getDay())) dates.push(new Date(cur));
                cur = addDays(cur, 1);
            }
            return dates;
        }
        return [cfg.date];
    };

    const handleSaveDraft = () => {
        const cfg = draftDlg;
        if (!cfg) return;
        if (cfg.endMin <= cfg.startMin) {
            notify('Giờ kết thúc phải sau giờ bắt đầu.', 'error');
            return;
        }
        if (cfg.repeat && cfg.repeatDays.length === 0) {
            notify('Chọn ít nhất một thứ trong tuần để lặp lại.', 'error');
            return;
        }
        const items = expandDates(cfg).map((d, i) => ({
            tempId: i === 0 ? cfg.tempId : newDraftId(),
            staffId: cfg.staffId,
            staffName: cfg.staffName,
            date: d,
            dateStr: dateKey(d),
            startMin: cfg.startMin,
            endMin: cfg.endMin,
            room: cfg.room,
            status: cfg.status,
        }));
        setDrafts((prev) => [...prev.filter((p) => p.tempId !== cfg.tempId), ...items]);
        if (items.length > 1) notify(`Đã nhân bản thành ${items.length} ca nháp.`);
        setDraftDlg(null);
    };

    const handleRemoveDraft = () => {
        if (!draftDlg) return;
        setDrafts((prev) => prev.filter((p) => p.tempId !== draftDlg.tempId));
        setDraftDlg(null);
    };

    // ── Commit all drafts ────────────────────────────────────────────────────
    const handleCommitDrafts = async () => {
        if (drafts.length === 0 || saving) return;
        setSaving(true);
        try {
            const byStaff = {};
            drafts.forEach((p) => (byStaff[p.staffId] = byStaff[p.staffId] || []).push(p));
            let created = 0;
            let skipped = 0;
            for (const [sid, items] of Object.entries(byStaff)) {
                // Conflict-check against that staff member's saved shifts (reuse the
                // loaded list for the current staff, fetch for others) AND against
                // earlier accepted drafts so the basket can't double-book itself.
                const existing =
                    sid === staffId ? shifts : await DoctorScheduleModel.getShiftsByDoctor(sid);
                const busy = {};
                (existing || [])
                    .filter((s) => s.status !== 'Đã hủy')
                    .forEach((s) => {
                        const k = String(s.work_date || '').slice(0, 10);
                        (busy[k] = busy[k] || []).push([
                            timeToMinutes(s.start_time) ?? 0,
                            timeToMinutes(s.end_time) ?? 0,
                        ]);
                    });
                const rows = [];
                items.forEach((p) => {
                    let clashed = false;
                    const segments = splitLunch(p.startMin, p.endMin);
                    for (const [a, b] of segments) {
                        if ((busy[p.dateStr] || []).some(([x, y]) => overlaps(a, b, x, y))) {
                            clashed = true;
                            break;
                        }
                    }
                    if (clashed || p.dateStr < todayKeyStr()) {
                        skipped += 1;
                        return;
                    }
                    segments.forEach(([a, b]) => {
                        (busy[p.dateStr] = busy[p.dateStr] || []).push([a, b]);
                        rows.push({
                            doctor_id: p.staffId,
                            doctor_name: p.staffName,
                            work_date: p.dateStr,
                            day_of_week: vnDayName(p.date),
                            start_time: minutesToTime(a),
                            end_time: minutesToTime(b),
                            room: p.room,
                            status: p.status,
                        });
                    });
                });
                if (rows.length > 0) {
                    const added = await DoctorScheduleModel.createShifts(rows);
                    created += added?.length ?? rows.length;
                    if (sid === staffId) setShifts((prev) => [...prev, ...(added || [])]);
                }
            }
            setDrafts([]);
            if (created > 0) {
                notify(`Đã tạo ${created} ca` + (skipped > 0 ? ` · bỏ qua ${skipped} ca trùng` : ''));
            } else {
                notify('Tất cả ca nháp đều trùng với lịch hiện có — không tạo ca nào.', 'error');
            }
        } catch (e) {
            notify('Lỗi khi tạo ca: ' + e.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleClearDrafts = () => {
        const n = drafts.length;
        setDrafts([]);
        notify(`Đã xóa ${n} ca nháp.`);
    };

    // ── Edit / revoke saved shifts ───────────────────────────────────────────
    const openEdit = (shift) =>
        setEditDlg({
            shift,
            startMin: timeToMinutes(shift.start_time) ?? GRID_START_MIN,
            endMin: timeToMinutes(shift.end_time) ?? GRID_START_MIN + 60,
            room: shift.room || ROOM_OPTIONS[0].value,
            status: shift.status || 'Đã phân công',
            confirmDelete: false,
        });

    const handleSaveEdit = async () => {
        const d = editDlg;
        if (!d) return;
        if (d.endMin <= d.startMin) {
            notify('Giờ kết thúc phải sau giờ bắt đầu.', 'error');
            return;
        }
        const dateStr = String(d.shift.work_date || '').slice(0, 10);
        if (
            d.status !== 'Đã hủy' &&
            conflictsFor(dateStr, d.startMin, d.endMin, d.shift.id).length > 0
        ) {
            notify('Khung giờ mới trùng với một ca khác trong ngày.', 'error');
            return;
        }
        setSaving(true);
        try {
            const updated = await DoctorScheduleModel.updateShift(d.shift.id, {
                start_time: minutesToTime(d.startMin),
                end_time: minutesToTime(d.endMin),
                room: d.room,
                status: d.status,
            });
            setShifts((prev) => prev.map((s) => (s.id === d.shift.id ? updated : s)));
            notify('Đã cập nhật ca làm việc.');
            setEditDlg(null);
        } catch (e) {
            notify('Lỗi khi cập nhật: ' + e.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        const d = editDlg;
        if (!d) return;
        setSaving(true);
        try {
            await DoctorScheduleModel.deleteShift(d.shift.id);
            setShifts((prev) => prev.filter((s) => s.id !== d.shift.id));
            notify('Đã thu hồi ca làm việc.');
            setEditDlg(null);
        } catch (e) {
            notify('Lỗi khi thu hồi: ' + e.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    // ── Copy week → next week ────────────────────────────────────────────────
    const openCopyWeek = () => {
        const source = weekShifts.filter((s) => s.status !== 'Đã hủy');
        if (source.length === 0) {
            notify('Tuần này chưa có ca nào để sao chép.', 'error');
            return;
        }
        const candidates = source.map((s) => {
            const date = addDays(parseLocalDate(s.work_date), 7);
            return {
                date,
                dateStr: dateKey(date),
                startMin: timeToMinutes(s.start_time) ?? 0,
                endMin: timeToMinutes(s.end_time) ?? 0,
                room: s.room,
            };
        });
        const ok = candidates.filter(
            (c) =>
                c.dateStr >= todayKeyStr() &&
                conflictsFor(c.dateStr, c.startMin, c.endMin).length === 0
        );
        setCopyDlg({ total: candidates.length, ok });
    };

    const handleCopyWeek = async () => {
        if (!copyDlg || !staff || copyDlg.ok.length === 0) return;
        setSaving(true);
        try {
            const rows = copyDlg.ok.map((c) => ({
                doctor_id: staff.id,
                doctor_name: staff.name,
                work_date: c.dateStr,
                day_of_week: vnDayName(c.date),
                start_time: minutesToTime(c.startMin),
                end_time: minutesToTime(c.endMin),
                room: c.room,
                status: 'Đã phân công',
            }));
            const added = await DoctorScheduleModel.createShifts(rows);
            setShifts((prev) => [...prev, ...(added || [])]);
            notify(`Đã sao chép ${added?.length ?? rows.length} ca sang tuần sau.`);
            setCopyDlg(null);
            goNext();
        } catch (e) {
            notify('Lỗi khi sao chép tuần: ' + e.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DUR, ease: EASE }}
            className="space-y-4"
        >
            {/* ── Staff picker + actions ── */}
            {/* GLASS_BASE's backdrop-blur creates a stacking context per bar, so the
                staff-select dropdown (z-100 INSIDE this bar) can only beat the week
                toolbar below if this whole bar sits on a higher layer. */}
            <div className={`${GLASS_BASE} relative z-30 px-4 py-3 flex flex-wrap items-center gap-3`}>
                <div className="flex rounded-xl bg-white/60 border border-slate-200/70 p-1 shadow-inner">
                    {[
                        { id: 'doctor', label: 'Bác sĩ', Icon: Stethoscope },
                        { id: 'technician', label: 'Kỹ thuật viên', Icon: Wrench },
                    ].map(({ id, label, Icon }) => (
                        <button
                            key={id}
                            onClick={() => setStaffType(id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                                staffType === id
                                    ? 'bg-gradient-to-r from-indigo-500 to-sky-500 text-white shadow'
                                    : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            <Icon className="w-3.5 h-3.5" />
                            {label}
                        </button>
                    ))}
                </div>

                <div className="w-60 max-w-full">
                    <GlassSelect
                        value={staffId}
                        onChange={setStaffId}
                        options={
                            staffLoading
                                ? [{ value: '', label: 'Đang tải...' }]
                                : staffList.map((s) => ({ label: s.name, value: s.id }))
                        }
                        placeholder="Chọn nhân sự"
                        className="w-full"
                        buttonClassName="py-2.5 px-4 bg-white/50 backdrop-blur-md border border-white/60 text-slate-800 rounded-xl text-sm font-semibold shadow-sm focus:ring-2 focus:ring-indigo-500/40 transition-all"
                    />
                </div>

                <div className="w-44 max-w-full">
                    <GlassSelect
                        value={defaultRoom}
                        onChange={setDefaultRoom}
                        options={ROOM_OPTIONS}
                        className="w-full"
                        buttonClassName="py-2.5 px-4 bg-white/50 backdrop-blur-md border border-white/60 text-slate-600 rounded-xl text-sm font-semibold shadow-sm focus:ring-2 focus:ring-indigo-500/40 transition-all"
                    />
                </div>

                <span className="hidden xl:flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                    <MousePointerClick className="w-4 h-4" />
                    Kéo chọn để thêm ca nháp · xác nhận một lần ở thanh dưới
                </span>

                <button
                    onClick={openCopyWeek}
                    disabled={saving || !staffId}
                    className="ml-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-sky-500 text-white text-sm font-bold flex items-center gap-2 shadow-md shadow-indigo-500/20 hover:shadow-lg transition-all active:scale-95 disabled:opacity-50"
                >
                    <Copy className="w-4 h-4" />
                    Sao chép sang tuần sau
                </button>
            </div>

            {/* ── Week toolbar: nav + stats + legend ── */}
            <div className={`${GLASS_BASE} px-4 py-3 flex flex-wrap items-center gap-3`}>
                <div className="flex items-center gap-1">
                    <button
                        onClick={goPrev}
                        className="w-8 h-8 rounded-lg bg-white/60 border border-slate-200/70 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-white transition-all"
                        aria-label="Tuần trước"
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
                        aria-label="Tuần sau"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
                <span className="text-sm font-extrabold text-slate-800">{rangeLabel}</span>

                <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
                    <span className="px-2.5 py-1 rounded-full bg-white/60 border border-slate-200/70 text-slate-500">
                        {weekStats.count} ca · {weekStats.hours}h
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-sky-50 border border-sky-200/70 text-sky-600">
                        {weekStats.pending} chờ xác nhận
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/70 text-emerald-600">
                        {weekStats.confirmed} đã xác nhận
                    </span>
                    {weekDraftCount > 0 && (
                        <span className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200/70 text-amber-600">
                            {weekDraftCount} ca nháp
                        </span>
                    )}
                </div>

                <div className="ml-auto flex flex-wrap items-center gap-3 text-[11px] font-bold text-slate-500">
                    <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                        Chưa xác nhận
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        Đã xác nhận
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        Ca nháp
                    </span>
                </div>
            </div>

            {/* ── Calendar body ── */}
            <motion.div
                key={`${staffId}-${dateKey(weekDays[0])}`}
                initial={{ opacity: 0, x: navDir * 36, y: navDir === 0 ? 10 : 0 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ duration: DUR, ease: EASE }}
            >
                <AdminWeekGrid
                    weekDays={weekDays}
                    shiftsByDate={shiftsByDate}
                    draftsByDate={draftsByDate}
                    hourStart={hourStart}
                    hourEnd={hourEnd}
                    dragSel={dragSel}
                    loading={loadingShifts || staffLoading}
                    emptyHint={
                        !loadingShifts && weekShifts.length === 0 && weekDraftCount === 0
                            ? `${staff?.name || 'Nhân sự này'} chưa có ca nào tuần này — kéo chọn trên lưới để tạo ca.`
                            : null
                    }
                    conflictsFor={conflictsFor}
                    onBeginDrag={beginDrag}
                    onSelectShift={openEdit}
                    onSelectDraft={openDraft}
                />
            </motion.div>

            {/* ── Floating commit bar ── */}
            <AnimatePresence>
                {drafts.length > 0 && (
                    <motion.div
                        key="commit-bar"
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 24 }}
                        transition={{ duration: DUR, ease: EASE }}
                        className="fixed bottom-6 inset-x-0 z-[70] flex justify-center pointer-events-none px-4"
                    >
                        <div className="pointer-events-auto flex flex-wrap items-center gap-3 px-5 py-3 rounded-2xl bg-white/90 backdrop-blur-xl border border-amber-200/80 shadow-2xl shadow-amber-500/10">
                            <span className="flex items-center gap-2 text-sm font-extrabold text-slate-800">
                                <span className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
                                    <CalendarPlus className="w-4 h-4 text-amber-600" />
                                </span>
                                {draftStats.count} ca nháp · {draftStats.hours}h
                                {draftStats.staffCount > 1 && (
                                    <span className="text-xs font-bold text-slate-400">
                                        ({draftStats.staffCount} nhân sự)
                                    </span>
                                )}
                            </span>
                            <button
                                onClick={handleClearDrafts}
                                disabled={saving}
                                className="px-3 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 transition-all disabled:opacity-50"
                            >
                                Hủy hết
                            </button>
                            <button
                                onClick={handleCommitDrafts}
                                disabled={saving}
                                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-bold flex items-center gap-2 shadow-md shadow-emerald-500/20 hover:shadow-lg transition-all active:scale-95 disabled:opacity-60"
                            >
                                <CheckCheck className="w-4 h-4" />
                                {saving ? 'Đang tạo…' : `Tạo ${draftStats.count} ca`}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Draft dialog ── */}
            <AnimatePresence>
                {draftDlg && (
                    <DraftShiftDialog
                        key="draft-shift"
                        cfg={draftDlg}
                        conflictCount={
                            expandDates(draftDlg)
                                .flatMap((d) => splitLunch(draftDlg.startMin, draftDlg.endMin).map(([a, b]) => ({ k: dateKey(d), a, b })))
                                .filter(({ k, a, b }) => draftDlg.staffId === staffId && conflictsFor(k, a, b).length > 0).length
                        }
                        onChange={setDraftDlg}
                        onClose={() => setDraftDlg(null)}
                        onSubmit={handleSaveDraft}
                        onDelete={handleRemoveDraft}
                    />
                )}
            </AnimatePresence>

            {/* ── Edit dialog ── */}
            <AnimatePresence>
                {editDlg && (
                    <EditShiftDialog
                        key="edit-shift"
                        dlg={editDlg}
                        saving={saving}
                        onChange={setEditDlg}
                        onClose={() => setEditDlg(null)}
                        onSave={handleSaveEdit}
                        onDelete={handleDelete}
                    />
                )}
            </AnimatePresence>

            {/* ── Copy-week dialog ── */}
            <AnimatePresence>
                {copyDlg && (
                    <DialogShell key="copy-week" onClose={() => setCopyDlg(null)}>
                        <p className="text-base font-extrabold text-slate-900 mb-1">
                            Sao chép lịch sang tuần sau?
                        </p>
                        <p className="text-sm text-slate-500 font-medium mb-5">
                            {copyDlg.ok.length}/{copyDlg.total} ca của tuần này sẽ được tạo lại cho tuần sau
                            {copyDlg.total - copyDlg.ok.length > 0 &&
                                ` (${copyDlg.total - copyDlg.ok.length} ca bị bỏ qua vì trùng lịch hoặc trong quá khứ)`}
                            . Ca mới có trạng thái <span className="font-bold text-sky-600">Đã phân công</span>.
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setCopyDlg(null)}
                                className="py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200 transition-all"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleCopyWeek}
                                disabled={saving || copyDlg.ok.length === 0}
                                className="py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-sky-500 text-white font-bold text-sm shadow-md shadow-indigo-500/20 hover:shadow-lg transition-all disabled:opacity-50"
                            >
                                {saving ? 'Đang sao chép…' : `Sao chép ${copyDlg.ok.length} ca`}
                            </button>
                        </div>
                    </DialogShell>
                )}
            </AnimatePresence>

            {/* ── Toast ── */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        key="toast"
                        initial={{ opacity: 0, y: -12, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: DUR * 0.8, ease: EASE }}
                        className={`fixed top-6 right-6 z-[90] px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-xl flex items-center gap-2 text-sm font-bold ${
                            toast.type === 'error'
                                ? 'bg-rose-50/95 border-rose-200 text-rose-700'
                                : 'bg-emerald-50/95 border-emerald-200 text-emerald-700'
                        }`}
                    >
                        {toast.type === 'error' ? (
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                        ) : (
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                        )}
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

/* ────────────────────────── Week grid (drag-enabled) ────────────────────────── */

function AdminWeekGrid({
    weekDays,
    shiftsByDate,
    draftsByDate,
    hourStart,
    hourEnd,
    dragSel,
    loading,
    emptyHint,
    conflictsFor,
    onBeginDrag,
    onSelectShift,
    onSelectDraft,
}) {
    const totalMinutes = (hourEnd - hourStart) * 60;
    const gridHeight = (hourEnd - hourStart) * HOUR_HEIGHT;
    const hours = Array.from({ length: hourEnd - hourStart + 1 }, (_, i) => hourStart + i);
    const todayKey = dateKey(new Date());
    const colRefs = useRef({});

    const toPx = (min) => ((min - hourStart * 60) / totalMinutes) * gridHeight;

    return (
        <div className={`${GLASS_BASE} p-4 overflow-x-auto relative`}>
            {loading && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/50 backdrop-blur-[2px] rounded-2xl text-sm font-semibold text-slate-400">
                    Đang tải lịch…
                </div>
            )}
            <div className="min-w-[820px]">
                {/* day headers */}
                <div className="grid" style={{ gridTemplateColumns: '56px repeat(7, 1fr)' }}>
                    <div />
                    {weekDays.map((d, i) => {
                        const key = dateKey(d);
                        const isToday = key === todayKey;
                        const isPast = key < todayKey;
                        const count = (shiftsByDate[key] || []).filter((s) => s.status !== 'Đã hủy').length;
                        const draftCount = (draftsByDate[key] || []).length;
                        return (
                            <div key={key} className={`px-1 pb-3 text-center ${isPast ? 'opacity-50' : ''}`}>
                                <p
                                    className={`text-[11px] font-bold uppercase tracking-wide ${
                                        isToday ? 'text-indigo-600' : 'text-slate-400'
                                    }`}
                                >
                                    {DAY_LABELS[i]}
                                </p>
                                <div
                                    className={`mt-1 mx-auto w-9 h-9 rounded-xl flex items-center justify-center text-sm font-extrabold ${
                                        isToday
                                            ? 'bg-gradient-to-br from-indigo-500 to-sky-500 text-white shadow-md shadow-indigo-500/30'
                                            : 'text-slate-700'
                                    }`}
                                >
                                    {d.getDate()}
                                </div>
                                {(count > 0 || draftCount > 0) && (
                                    <p className="mt-0.5 text-[10px] font-bold text-slate-400">
                                        {count > 0 && `${count} ca`}
                                        {count > 0 && draftCount > 0 && ' · '}
                                        {draftCount > 0 && (
                                            <span className="text-amber-500">{draftCount} nháp</span>
                                        )}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* time grid */}
                <div
                    className="grid relative select-none"
                    style={{ gridTemplateColumns: '56px repeat(7, 1fr)', height: gridHeight }}
                >
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
                        const isPast = key < todayKey;
                        const dayShifts = shiftsByDate[key] || [];
                        const dayDrafts = draftsByDate[key] || [];
                        return (
                            <div
                                key={key}
                                ref={(el) => (colRefs.current[key] = el)}
                                onMouseDown={(e) => onBeginDrag(e, d, colRefs.current[key])}
                                className={`relative border-l border-slate-200/60 ${
                                    isToday ? 'bg-indigo-50/40' : ''
                                } ${isPast ? 'bg-slate-100/40 cursor-not-allowed' : 'cursor-crosshair'}`}
                            >
                                {hours.map((h) => (
                                    <div
                                        key={h}
                                        className="absolute left-0 right-0 border-t border-slate-200/50 pointer-events-none"
                                        style={{ top: (h - hourStart) * HOUR_HEIGHT }}
                                    />
                                ))}

                                {/* saved shifts */}
                                {layoutDayShifts(dayShifts, hourStart * 60).map(
                                    ({ shift: s, start, end, lane, cols }) => {
                                        const meta = statusMeta(s.status);
                                        return (
                                            <button
                                                key={s.id}
                                                onMouseDown={(e) => e.stopPropagation()}
                                                onClick={() => onSelectShift(s)}
                                                className={`absolute z-10 rounded-lg border px-1.5 py-1 text-left overflow-hidden transition-all cursor-pointer ${meta.block}`}
                                                style={{
                                                    top: toPx(start),
                                                    height: Math.max(toPx(end) - toPx(start), 26),
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
                                                {toPx(end) - toPx(start) >= 40 && s.room && (
                                                    <p className="text-[10px] font-semibold leading-tight truncate opacity-80">
                                                        {s.room}
                                                    </p>
                                                )}
                                            </button>
                                        );
                                    }
                                )}

                                {/* draft shifts (uncommitted) */}
                                {dayDrafts.map((p) => {
                                    const clash = conflictsFor(p.dateStr, p.startMin, p.endMin).length > 0;
                                    return (
                                        <button
                                            key={p.tempId}
                                            onMouseDown={(e) => e.stopPropagation()}
                                            onClick={() => onSelectDraft(p)}
                                            className={`absolute left-1 right-1 z-20 rounded-lg border-2 border-dashed px-1.5 py-1 text-left overflow-hidden transition-all cursor-pointer ${
                                                clash
                                                    ? 'border-rose-400 bg-rose-500/15 text-rose-700 hover:bg-rose-500/25'
                                                    : 'border-amber-400 bg-amber-400/20 text-amber-800 hover:bg-amber-400/30'
                                            }`}
                                            style={{
                                                top: toPx(p.startMin),
                                                height: Math.max(toPx(p.endMin) - toPx(p.startMin), 26),
                                            }}
                                            title={`Ca nháp ${minutesToTime(p.startMin)} - ${minutesToTime(p.endMin)} · ${p.room}${
                                                clash ? ' · TRÙNG LỊCH' : ''
                                            }`}
                                        >
                                            <p className="text-[10px] font-extrabold leading-tight truncate">
                                                {clash && <AlertTriangle className="w-3 h-3 inline mr-0.5 -mt-0.5" />}
                                                {minutesToTime(p.startMin)} - {minutesToTime(p.endMin)}
                                            </p>
                                            {toPx(p.endMin) - toPx(p.startMin) >= 40 && (
                                                <p className="text-[10px] font-semibold leading-tight truncate opacity-80">
                                                    {p.room}
                                                </p>
                                            )}
                                        </button>
                                    );
                                })}

                                {/* live drag highlight */}
                                {dragSel && dragSel.key === key && (
                                    <div
                                        className="absolute left-1 right-1 z-20 rounded-lg border-2 border-dashed border-indigo-400 bg-indigo-500/15 pointer-events-none flex items-start justify-center"
                                        style={{
                                            top: toPx(dragSel.startMin),
                                            height: Math.max(toPx(dragSel.endMin) - toPx(dragSel.startMin), 14),
                                        }}
                                    >
                                        <span className="text-[10px] font-extrabold text-indigo-700 mt-0.5">
                                            {minutesToTime(dragSel.startMin)} - {minutesToTime(dragSel.endMin)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* empty-week hint */}
                    {emptyHint && (
                        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
                            <p className="max-w-sm text-center text-sm font-semibold text-slate-400 bg-white/70 backdrop-blur rounded-2xl px-5 py-3 border border-slate-200/60">
                                {emptyHint}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ────────────────────────── Dialogs ────────────────────────── */

function DialogShell({ onClose, children, wide = false }) {
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
                className={`relative w-full ${wide ? 'max-w-lg' : 'max-w-sm'} rounded-2xl bg-white/95 backdrop-blur-xl border border-white/70 shadow-2xl p-6`}
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

const timeSelectBtnCls =
    'py-2.5 px-3 bg-white/60 backdrop-blur-md border border-slate-200/70 text-slate-800 rounded-xl text-sm font-semibold shadow-sm focus:ring-2 focus:ring-indigo-500/40 transition-all';

function DraftShiftDialog({ cfg, conflictCount, onChange, onClose, onSubmit, onDelete }) {
    const dayLabel = cfg.date.toLocaleDateString('vi-VN', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
    const spansLunch = cfg.startMin < 12 * 60 && cfg.endMin > 13 * 60;

    return (
        <DialogShell onClose={onClose} wide>
            <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shadow-inner shrink-0">
                    <CalendarPlus className="w-5 h-5 text-amber-600" />
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-extrabold text-slate-900 capitalize truncate">{dayLabel}</p>
                    <p className="text-xs font-bold text-slate-400 truncate">
                        Ca nháp cho {cfg.staffName} — chưa lưu
                    </p>
                </div>
            </div>

            {/* templates */}
            <div className="flex flex-wrap gap-2 mb-4">
                {SHIFT_TEMPLATES.map((t) => (
                    <button
                        key={t.label}
                        onClick={() => onChange({ ...cfg, startMin: t.start, endMin: t.end })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                            cfg.startMin === t.start && cfg.endMin === t.end
                                ? 'bg-indigo-500 text-white border-indigo-500 shadow'
                                : 'bg-white/60 text-slate-600 border-slate-200/70 hover:border-indigo-300'
                        }`}
                    >
                        {t.label} · {minutesToTime(t.start)}–{minutesToTime(t.end)}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                    <p className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Bắt đầu
                    </p>
                    <GlassSelect
                        value={cfg.startMin}
                        onChange={(v) => onChange({ ...cfg, startMin: Number(v) })}
                        options={TIME_OPTIONS}
                        className="w-full"
                        buttonClassName={timeSelectBtnCls}
                    />
                </div>
                <div>
                    <p className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Kết thúc
                    </p>
                    <GlassSelect
                        value={cfg.endMin}
                        onChange={(v) => onChange({ ...cfg, endMin: Number(v) })}
                        options={TIME_OPTIONS}
                        className="w-full"
                        buttonClassName={timeSelectBtnCls}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                    <p className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> Phòng
                    </p>
                    <GlassSelect
                        value={cfg.room}
                        onChange={(v) => onChange({ ...cfg, room: v })}
                        options={ROOM_OPTIONS}
                        className="w-full"
                        buttonClassName={timeSelectBtnCls}
                    />
                </div>
                <div>
                    <p className="text-xs font-bold text-slate-500 mb-1">Trạng thái</p>
                    <GlassSelect
                        value={cfg.status}
                        onChange={(v) => onChange({ ...cfg, status: v })}
                        options={STATUS_OPTIONS.filter((s) => s.value !== 'Đã hủy')}
                        className="w-full"
                        buttonClassName={timeSelectBtnCls}
                    />
                </div>
            </div>

            {/* repeat */}
            <div className="rounded-xl border border-slate-200/70 bg-white/50 p-3 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={cfg.repeat}
                        onChange={(e) => onChange({ ...cfg, repeat: e.target.checked })}
                        className="w-4 h-4 accent-indigo-500"
                    />
                    <span className="text-sm font-bold text-slate-700">
                        Lặp lại hàng tuần (nhân bản ca nháp)
                    </span>
                </label>
                {cfg.repeat && (
                    <div className="mt-3 space-y-3">
                        <div className="flex flex-wrap gap-1.5">
                            {WEEKDAY_CHIPS.map((d) => {
                                const active = cfg.repeatDays.includes(d.value);
                                return (
                                    <button
                                        key={d.value}
                                        onClick={() =>
                                            onChange({
                                                ...cfg,
                                                repeatDays: active
                                                    ? cfg.repeatDays.filter((x) => x !== d.value)
                                                    : [...cfg.repeatDays, d.value],
                                            })
                                        }
                                        className={`w-9 h-9 rounded-lg text-xs font-extrabold border transition-all ${
                                            active
                                                ? 'bg-indigo-500 text-white border-indigo-500 shadow'
                                                : 'bg-white/60 text-slate-500 border-slate-200/70 hover:border-indigo-300'
                                        }`}
                                    >
                                        {d.label}
                                    </button>
                                );
                            })}
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 mb-1">Lặp đến ngày</p>
                            <DatePicker
                                selected={cfg.repeatUntil}
                                onChange={(date) => onChange({ ...cfg, repeatUntil: date || cfg.date })}
                                locale={vi}
                                dateFormat="dd/MM/yyyy"
                                minDate={cfg.date}
                                className="w-full bg-white/60 border border-slate-200/70 text-slate-800 text-sm font-semibold rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500/40 block p-2.5 outline-none transition-all"
                            />
                        </div>
                    </div>
                )}
            </div>

            {(spansLunch || conflictCount > 0) && (
                <div className="mb-4 space-y-1.5">
                    {spansLunch && (
                        <p className="text-xs font-semibold text-amber-600 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            Ca kéo dài qua trưa sẽ tự tách thành 2 ca khi tạo (nghỉ 12:00–13:00).
                        </p>
                    )}
                    {conflictCount > 0 && (
                        <p className="text-xs font-semibold text-rose-600 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            {conflictCount} khung giờ trùng với lịch hiện có — sẽ bị bỏ qua khi tạo.
                        </p>
                    )}
                </div>
            )}

            <div className="grid grid-cols-[auto_1fr] gap-3">
                <button
                    onClick={onDelete}
                    className="px-3 py-3 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 transition-all"
                    title="Xóa ca nháp"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
                <button
                    onClick={onSubmit}
                    className="py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-sky-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-indigo-500/20 hover:shadow-lg transition-all active:scale-95"
                >
                    <Check className="w-4 h-4" />
                    Cập nhật ca nháp
                </button>
            </div>
        </DialogShell>
    );
}

function EditShiftDialog({ dlg, saving, onChange, onClose, onSave, onDelete }) {
    const date = parseLocalDate(dlg.shift.work_date);
    const dayLabel = date
        ? date.toLocaleDateString('vi-VN', {
              weekday: 'long',
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
          })
        : dlg.shift.work_date;
    const meta = statusMeta(dlg.status);

    return (
        <DialogShell onClose={onClose}>
            <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shadow-inner shrink-0">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-extrabold text-slate-900 capitalize truncate">{dayLabel}</p>
                    <span
                        className={`inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold border ${meta.chip}`}
                    >
                        {meta.label}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                    <p className="text-xs font-bold text-slate-500 mb-1">Bắt đầu</p>
                    <GlassSelect
                        value={dlg.startMin}
                        onChange={(v) => onChange({ ...dlg, startMin: Number(v) })}
                        options={TIME_OPTIONS}
                        className="w-full"
                        buttonClassName={timeSelectBtnCls}
                    />
                </div>
                <div>
                    <p className="text-xs font-bold text-slate-500 mb-1">Kết thúc</p>
                    <GlassSelect
                        value={dlg.endMin}
                        onChange={(v) => onChange({ ...dlg, endMin: Number(v) })}
                        options={TIME_OPTIONS}
                        className="w-full"
                        buttonClassName={timeSelectBtnCls}
                    />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-5">
                <div>
                    <p className="text-xs font-bold text-slate-500 mb-1">Phòng</p>
                    <GlassSelect
                        value={dlg.room}
                        onChange={(v) => onChange({ ...dlg, room: v })}
                        options={
                            ROOM_OPTIONS.some((r) => r.value === dlg.room)
                                ? ROOM_OPTIONS
                                : [{ label: dlg.room, value: dlg.room }, ...ROOM_OPTIONS]
                        }
                        className="w-full"
                        buttonClassName={timeSelectBtnCls}
                    />
                </div>
                <div>
                    <p className="text-xs font-bold text-slate-500 mb-1">Trạng thái</p>
                    <GlassSelect
                        value={dlg.status}
                        onChange={(v) => onChange({ ...dlg, status: v })}
                        options={STATUS_OPTIONS}
                        className="w-full"
                        buttonClassName={timeSelectBtnCls}
                    />
                </div>
            </div>

            {dlg.confirmDelete ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3 mb-3">
                    <p className="text-sm font-bold text-rose-700 mb-2">
                        Thu hồi (xóa) ca này khỏi lịch của nhân sự?
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => onChange({ ...dlg, confirmDelete: false })}
                            className="py-2 rounded-lg bg-white text-slate-600 font-bold text-xs border border-slate-200 hover:bg-slate-50 transition-all"
                        >
                            Không
                        </button>
                        <button
                            onClick={onDelete}
                            disabled={saving}
                            className="py-2 rounded-lg bg-rose-500 text-white font-bold text-xs shadow hover:bg-rose-600 transition-all disabled:opacity-60"
                        >
                            {saving ? 'Đang thu hồi…' : 'Thu hồi ca'}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-[auto_1fr] gap-3">
                    <button
                        onClick={() => onChange({ ...dlg, confirmDelete: true })}
                        className="px-3 py-3 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 transition-all"
                        title="Thu hồi ca"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onSave}
                        disabled={saving}
                        className="py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-sky-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-indigo-500/20 hover:shadow-lg transition-all active:scale-95 disabled:opacity-60"
                    >
                        <Check className="w-4 h-4" />
                        {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
                    </button>
                </div>
            )}
        </DialogShell>
    );
}
