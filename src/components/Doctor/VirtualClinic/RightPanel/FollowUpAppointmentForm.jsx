import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { CalendarPlus, Clock, Save, CalendarX2, Loader2, CheckCircle2, ShieldCheck } from 'lucide-react';
import GlassCard, { GLASS_INPUT } from '../../../common/GlassCard';
import { AppointmentModel } from '../../../../models/AppointmentModel';
import { DoctorScheduleModel, ACTIVE_SHIFT_STATUSES } from '../../../../models/DoctorScheduleModel';
import { DoctorModel } from '../../../../models/DoctorModel';
import { supabase } from '../../../../supabaseClient';
import ClinicEmailService from '../../../../services/EmailService';

const todayStr = () => {
    const d = new Date();
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 10);
};
const toMinutes = (t) => {
    if (!t) return null;
    const [h, m] = String(t).split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
};
const toTimeStr = (mins) =>
    `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;

const formatDateLabel = (dateStr) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const weekday = ['CN', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7'][date.getDay()];
    return { weekday, dayMonth: `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}` };
};

export default function FollowUpAppointmentForm({ appointment }) {
    const doctorId = appointment?.doctorId || appointment?.doctor_id || null;

    const storageKey = useMemo(
        () => `follow-up-${appointment?.id || appointment?.patientId || 'default'}`,
        [appointment]
    );

    // Persisted "already created" marker so re-opening the EMR shows the result.
    const [created, setCreated] = useState(() => {
        try {
            const saved = localStorage.getItem(storageKey);
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    });

    const [doctorsList, setDoctorsList] = useState(() => [
        {
            id: doctorId,
            name: appointment?.doctorName || appointment?.doctor_name || 'Bác sĩ hiện tại'
        }
    ]);
    const [selectedDoctorId, setSelectedDoctorId] = useState(doctorId);

    const [shifts, setShifts] = useState([]);
    const [loadingShifts, setLoadingShifts] = useState(true);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [reason, setReason] = useState('Tái khám để đánh giá tiến triển sau điều trị');
    const [bookedTimes, setBookedTimes] = useState([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // Fetch all active doctors
    useEffect(() => {
        let active = true;
        const loadDoctors = async () => {
            const allDocs = await DoctorModel.getAllDoctors();
            if (!active) return;
            if (allDocs && allDocs.length > 0) {
                const sortedDocs = [...allDocs].sort((a, b) => {
                    if (String(a.id) === String(doctorId)) return -1;
                    if (String(b.id) === String(doctorId)) return 1;
                    return 0;
                });
                setDoctorsList(sortedDocs);
            }
        };
        loadDoctors();
        return () => { active = false; };
    }, [doctorId]);

    // ── Fetch the selected doctor's future working shifts ────────────────────────────
    useEffect(() => {
        let active = true;
        const fetchShifts = async () => {
            if (!selectedDoctorId) {
                setLoadingShifts(false);
                return;
            }
            setLoadingShifts(true);
            const all = await DoctorScheduleModel.getShiftsByDoctor(selectedDoctorId);
            if (!active) return;
            const today = todayStr();
            const future = (all || []).filter(
                (s) => s.work_date >= today && ACTIVE_SHIFT_STATUSES.includes(s.status)
            );
            setShifts(future);
            setLoadingShifts(false);
        };
        fetchShifts();
        return () => { active = false; };
    }, [selectedDoctorId]);

    // Group shifts by date → only these dates are selectable.
    const shiftsByDate = useMemo(() => {
        const map = {};
        shifts.forEach((s) => {
            (map[s.work_date] ||= []).push(s);
        });
        return map;
    }, [shifts]);

    const availableDates = useMemo(
        () => Object.keys(shiftsByDate).sort(),
        [shiftsByDate]
    );

    // Auto-select the first available date once shifts arrive.
    useEffect(() => {
        if (!selectedDate && availableDates.length > 0) {
            setSelectedDate(availableDates[0]);
        }
    }, [availableDates, selectedDate]);

    // 30-minute slots generated strictly WITHIN the selected day's shift windows.
    const slots = useMemo(() => {
        if (!selectedDate) return [];
        const set = new Set();
        (shiftsByDate[selectedDate] || []).forEach((s) => {
            const start = toMinutes(s.start_time);
            const end = toMinutes(s.end_time);
            if (start == null || end == null) return;
            for (let cur = start; cur + 30 <= end; cur += 30) {
                set.add(toTimeStr(cur));
            }
        });
        return [...set].sort();
    }, [selectedDate, shiftsByDate]);

    // Pretty "08:00 - 17:00" summary of the selected day's shift(s).
    const shiftHoursLabel = useMemo(() => {
        const list = shiftsByDate[selectedDate] || [];
        return list
            .map((s) => `${(s.start_time || '').slice(0, 5)} - ${(s.end_time || '').slice(0, 5)}`)
            .join(' · ');
    }, [shiftsByDate, selectedDate]);

    // ── Fetch already-booked slots for the chosen date (real DB columns) ────────
    const loadBookedTimes = useCallback(async () => {
        if (!selectedDoctorId || !selectedDate) {
            setBookedTimes([]);
            return;
        }
        const taken = await AppointmentModel.getLockedSlots(selectedDate, selectedDoctorId);
        setBookedTimes(Array.isArray(taken) ? taken : []);
    }, [selectedDoctorId, selectedDate]);

    useEffect(() => {
        loadBookedTimes();
    }, [loadBookedTimes]);

    // Keep a chosen slot only while it remains valid for the selected date.
    useEffect(() => {
        if (selectedTime && !slots.includes(selectedTime)) {
            setSelectedTime('');
        }
    }, [slots, selectedTime]);

    const isSlotDisabled = useCallback(
        (timeStr) => {
            if (bookedTimes.includes(timeStr)) return true;

            // Locked (5-min hold) slots shared via the booking system.
            try {
                const lockedList = JSON.parse(localStorage.getItem('dermasmart_locked_slots') || '[]');
                const locked = lockedList.some(
                    (l) =>
                        l.lockedUntil > Date.now() &&
                        String(l.doctorId) === String(selectedDoctorId) &&
                        l.date === selectedDate &&
                        l.time === timeStr
                );
                if (locked) return true;
            } catch { /* ignore malformed cache */ }

            // Past slots check disabled in Doctor's workspace to allow full booking flexibility
            // if (selectedDate === todayStr()) {
            //     const now = new Date();
            //     if (toMinutes(timeStr) <= now.getHours() * 60 + now.getMinutes()) return true;
            // }
            return false;
        },
        [bookedTimes, selectedDoctorId, selectedDate]
    );

    const handleCreateFollowUp = async () => {
        setError('');
        if (!selectedDate || !selectedTime) {
            setError('Vui lòng chọn ngày và khung giờ tái khám.');
            return;
        }
        if (!reason.trim()) {
            setError('Vui lòng nhập lý do tái khám.');
            return;
        }
        if (isSlotDisabled(selectedTime)) {
            setError('Khung giờ này không còn trống. Vui lòng chọn khung giờ khác.');
            await loadBookedTimes();
            return;
        }

        setSaving(true);
        try {
            const result = await AppointmentModel.createFollowUp({
                doctorId: selectedDoctorId,
                patientId: appointment?.patientId || appointment?.patient_id,
                patientName: appointment?.patientName || appointment?.patient_name,
                date: selectedDate,
                time: selectedTime,
                reason: reason.trim(),
                service: 'Tái khám',
                fee: appointment?.fee,
            });

            if (result?.error) {
                setError(result.error);
                await loadBookedTimes(); // surface the slot that was taken under us
                return;
            }

            const record = {
                date: selectedDate,
                time: selectedTime,
                reason: reason.trim(),
                patientName: appointment?.patientName,
                doctorName: doctorsList.find(d => String(d.id) === String(selectedDoctorId))?.name || '',
                appointmentId: result.data?.id || null,
                createdAt: new Date().toISOString(),
            };
            setCreated(record);
            localStorage.setItem(storageKey, JSON.stringify(record));

            // Trigger email sending
            let emailToUse = appointment?.patientEmail || appointment?.patient_email;
            const patientId = appointment?.patientId || appointment?.patient_id;
            const patientName = appointment?.patientName || appointment?.patient_name || 'Bệnh nhân';
            
            const sendEmailNotification = async () => {
                if (!emailToUse && patientId && patientId !== '18504773-0f51-405a-aa32-70cae403be6e') {
                    const { data } = await supabase
                        .from('users')
                        .select('email')
                        .eq('user_id', patientId)
                        .maybeSingle();
                    if (data?.email) {
                        emailToUse = data.email;
                    }
                }
                
                if (emailToUse) {
                    const doctorName = doctorsList.find(d => String(d.id) === String(selectedDoctorId))?.name || 'Bác sĩ';
                    await ClinicEmailService.sendReexaminationEmail(emailToUse, patientName, {
                        doctorName,
                        date: selectedDate,
                        time: selectedTime,
                        reason: reason.trim(),
                        location: 'Phòng khám Da liễu DermaSmart, 123 Đường Ba Tháng Hai, Quận 10, TP.HCM',
                        status: 'Đã xác nhận'
                    });
                }
            };
            sendEmailNotification().catch(err => console.error('Error sending follow-up email:', err));

            setBookedTimes((prev) => [...new Set([...prev, selectedTime])]);
            setSelectedTime('');
        } catch (err) {
            console.error('Failed to create follow-up:', err);
            setError('Tạo lịch tái khám thất bại. Vui lòng thử lại.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <GlassCard className="p-6 mb-6">
            <div className="flex items-center justify-between gap-2 mb-4 pb-4 border-b border-slate-200/40">
                <div className="flex items-center gap-2">
                    <CalendarPlus className="w-5 h-5 text-teal-600" />
                    <h3 className="font-extrabold text-lg text-slate-900">Tạo lịch tái khám</h3>
                </div>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 bg-teal-500/10 border border-teal-300/40 px-2.5 py-1 rounded-full">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {selectedDoctorId === doctorId ? 'Chỉ trong ca làm việc của bạn' : 'Ca trực của bác sĩ được chọn'}
                </span>
            </div>

            {/* Success banner — a follow-up already exists for this exam. */}
            {created && (
                <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-300/50 bg-emerald-500/10 px-4 py-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                    <div className="text-sm">
                        <p className="font-bold text-emerald-800">Đã tạo lịch tái khám</p>
                        <p className="text-emerald-700/90 font-medium">
                            {created.patientName ? `${created.patientName} · ` : ''}
                            {created.doctorName ? `Bác sĩ: ${created.doctorName} · ` : ''}
                            {formatDateLabel(created.date).weekday} {formatDateLabel(created.date).dayMonth} lúc {created.time}
                        </p>
                    </div>
                </div>
            )}

            {/* ── Doctor Selection ──────────── */}
            <div className="mb-5 text-left">
                <label className="block text-xs font-bold text-slate-700 mb-2">
                    Bác sĩ phụ trách tái khám
                </label>
                <select
                    value={selectedDoctorId || ''}
                    onChange={(e) => {
                        setSelectedDoctorId(e.target.value);
                        setSelectedDate('');
                        setSelectedTime('');
                        setError('');
                    }}
                    className={`${GLASS_INPUT} w-full py-2.5 px-4 text-sm font-semibold rounded-xl bg-white/60 border border-slate-200 text-slate-800`}
                >
                    {doctorsList.map((doc) => (
                        <option key={doc.id} value={doc.id}>
                            {doc.name} {String(doc.id) === String(doctorId) ? '(Bạn)' : ''}
                        </option>
                    ))}
                </select>
            </div>

            {loadingShifts ? (
                <div className="flex items-center justify-center gap-2 py-10 text-slate-500">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm font-semibold">Đang tải ca làm việc của bác sĩ…</span>
                </div>
            ) : availableDates.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-10">
                    <div className="w-14 h-14 rounded-2xl bg-white/50 border border-white/60 flex items-center justify-center mb-3 shadow-inner">
                        <CalendarX2 className="w-7 h-7 text-slate-300" />
                    </div>
                    <p className="text-sm font-semibold text-slate-600">Bác sĩ chưa có ca làm việc sắp tới</p>
                    <p className="text-xs text-slate-400 mt-1">
                        Không thể đặt lịch tái khám cho đến khi có ca trực được phân. Vui lòng liên hệ quản trị viên.
                    </p>
                </div>
            ) : (
                <>
                    {/* ── Step 1: choose a day the doctor actually works ──────────── */}
                    <div className="mb-5">
                        <label className="block text-xs font-bold text-slate-700 mb-2">
                            Ngày tái khám <span className="text-slate-400 font-medium">(chỉ hiện ngày bác sĩ có ca trực)</span>
                        </label>
                        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 hide-scrollbar">
                            {availableDates.map((d) => {
                                const { weekday, dayMonth } = formatDateLabel(d);
                                const isActive = selectedDate === d;
                                return (
                                    <button
                                        key={d}
                                        type="button"
                                        onClick={() => { setSelectedDate(d); setError(''); }}
                                        className={`shrink-0 min-w-[72px] px-3 py-2.5 rounded-2xl border text-center transition-all ${
                                            isActive
                                                ? 'bg-teal-500 border-teal-500 text-white shadow-md shadow-teal-500/25'
                                                : 'bg-white/60 border-slate-200 text-slate-600 hover:border-teal-300 hover:bg-teal-50'
                                        }`}
                                    >
                                        <span className={`block text-[10px] font-bold uppercase tracking-wide ${isActive ? 'text-teal-50' : 'text-slate-400'}`}>
                                            {weekday}
                                        </span>
                                        <span className="block text-sm font-extrabold">{dayMonth}</span>
                                    </button>
                                );
                            })}
                        </div>
                        {shiftHoursLabel && (
                            <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                                <Clock className="w-3.5 h-3.5 text-teal-500" />
                                Ca trực: {shiftHoursLabel}
                            </p>
                        )}
                    </div>

                    {/* ── Step 2: choose a free 30-min slot inside the shift ──────── */}
                    <div className="mb-5">
                        <label className="block text-xs font-bold text-slate-700 mb-2">Khung giờ tái khám</label>
                        {slots.length === 0 ? (
                            <p className="text-xs text-slate-400 font-medium py-3">Không có khung giờ khả dụng cho ngày này.</p>
                        ) : (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                {slots.map((timeStr) => {
                                    const disabled = isSlotDisabled(timeStr);
                                    const isSelected = selectedTime === timeStr;
                                    return (
                                        <button
                                            key={timeStr}
                                            type="button"
                                            disabled={disabled}
                                            title={disabled ? 'Khung giờ đã được đặt hoặc đã qua' : 'Khung giờ trống'}
                                            onClick={() => { setSelectedTime(timeStr); setError(''); }}
                                            className={`px-2 py-2.5 rounded-xl text-xs font-bold text-center border transition-all ${
                                                disabled
                                                    ? 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed line-through'
                                                    : isSelected
                                                        ? 'bg-teal-500 border-teal-500 text-white shadow-md shadow-teal-500/20 cursor-pointer'
                                                        : 'bg-white border-slate-200 text-slate-600 hover:border-teal-300 hover:bg-teal-50 cursor-pointer'
                                            }`}
                                        >
                                            {timeStr}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="mb-4">
                        <label className="block text-xs font-bold text-slate-700 mb-2">Lý do tái khám</label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className={`${GLASS_INPUT} w-full py-3 px-4 text-sm font-semibold resize-none rounded-xl`}
                            rows="2"
                        />
                    </div>

                    {error && (
                        <p className="mb-3 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200/60 rounded-xl px-3 py-2">
                            {error}
                        </p>
                    )}

                    <div className="flex items-center justify-end">
                        <button
                            type="button"
                            disabled={saving || !selectedDate || !selectedTime}
                            onClick={handleCreateFollowUp}
                            className="bg-gradient-to-r from-sky-500 to-teal-500 text-white py-3 px-5 rounded-xl font-bold shadow-md shadow-sky-500/20 hover:shadow-lg hover:shadow-sky-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {saving ? 'Đang tạo lịch…' : created ? 'Tạo lịch tái khám khác' : 'Tạo lịch tái khám'}
                        </button>
                    </div>
                </>
            )}
        </GlassCard>
    );
}
