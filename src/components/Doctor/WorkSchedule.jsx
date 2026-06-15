import React, { useMemo, useState } from 'react';
import { Calendar, Check, Clock, XCircle } from 'lucide-react';
import { DoctorModel } from '../../models/DoctorModel';
import { DoctorScheduleModel } from '../../models/DoctorScheduleModel';

export default function WorkSchedule({ doctorId }) {
    const doctor =
        DoctorModel.getDoctorById(doctorId) || DoctorModel.getAllDoctors()[0];

    const storageKey = useMemo(
        () => `confirmed-shifts-${doctor?.id || 'default'}`,
        [doctor?.id]
    );

    const [doctorSchedules, setDoctorSchedules] = useState([]);

    React.useEffect(() => {
        const fetchSchedules = async () => {
            const data = await DoctorScheduleModel.getShiftsByDoctor(doctorId);
            const formatted = data.map(s => ({
                id: s.id,
                day: s.day_of_week,
                date: s.work_date,
                hours: `${s.start_time ? s.start_time.slice(0,5) : ''} - ${s.end_time ? s.end_time.slice(0,5) : ''}`,
                room: s.room,
                status: s.status
            }));
            setDoctorSchedules(formatted);
        };
        fetchSchedules();
    }, [doctorId]);

    const [confirmedShifts, setConfirmedShifts] = useState(() => {
        const saved = localStorage.getItem(storageKey);
        return saved ? JSON.parse(saved) : {};
    });
    const [confirmingShiftKey, setConfirmingShiftKey] = useState(null);

    const formatDate = (dateString) => {
        if (!dateString) return '';

        const date = new Date(dateString);

        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const handleConfirmShift = async (shift) => {
        const shiftKey = `${shift.id}-${shift.date}-${shift.hours}`;

        if (confirmedShifts[shiftKey] || shift.status === 'Đã xác nhận') {
            return;
        }

        // Call database to update the status
        await DoctorScheduleModel.updateShift(shift.id, { status: 'Đã xác nhận' });

        const nextConfirmedShifts = {
            ...confirmedShifts,
            [shiftKey]: true,
        };

        setConfirmedShifts(nextConfirmedShifts);
        localStorage.setItem(storageKey, JSON.stringify(nextConfirmedShifts));
        
        // Update local state to reflect the change immediately
        setDoctorSchedules(prev => prev.map(s => s.id === shift.id ? { ...s, status: 'Đã xác nhận' } : s));
        setConfirmingShiftKey(null);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-extrabold text-2xl md:text-3xl text-slate-900 tracking-tight">
                    Lịch làm việc
                </h1>

                <p className="text-sm text-slate-500 font-medium mt-1">
                    Lịch ca trực tuần này của {doctor?.name}
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {doctorSchedules?.map?.((shift) => {
                    const shiftKey = `${shift.id}-${shift.date}-${shift.hours}`;
                    const isConfirmed = !!confirmedShifts[shiftKey] || shift.status === 'Đã xác nhận';

                    return (
                        <div
                            key={shiftKey}
                            className={`backdrop-blur-xl bg-white/40 border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-[2rem] p-6 relative overflow-visible group min-h-[300px] ${confirmingShiftKey === shiftKey ? 'z-50' : 'z-10'}`}
                        >
                            <div
                                className={`absolute top-0 right-0 w-24 h-24 rounded-bl-full -z-10 transition-all duration-500 ${
                                    isConfirmed
                                        ? 'bg-emerald-500/10'
                                        : 'bg-sky-500/5 group-hover:bg-sky-500/10'
                                }`}
                            />

                            <div className="flex items-center justify-between mb-6">
                                <div
                                    className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2 shadow-inner border ${
                                        isConfirmed
                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100/50'
                                            : 'bg-sky-50 text-sky-600 border-sky-100/50'
                                    }`}
                                >
                                    <Calendar className="w-6 h-6" />
                                </div>

                                {isConfirmed ? (
                                    <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-emerald-200/60">
                    <Check className="w-3 h-3" />
                    Đã xác nhận
                  </span>
                                ) : (
                                    <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-slate-200/60">
                    <XCircle className="w-3 h-3" />
                    Chưa xác nhận
                  </span>
                                )}
                            </div>

                            <h3 className="font-extrabold text-xl text-slate-900 mb-1">
                                {shift.day}
                            </h3>

                            {shift.date && (
                                <p className="text-xs text-slate-400 font-bold mb-3">
                                    {formatDate(shift.date)}
                                </p>
                            )}

                            <div className="flex items-center gap-2 text-slate-600 font-medium mb-6 bg-white/50 p-3 rounded-xl border border-slate-100">
                                <Clock className="w-4 h-4 text-slate-400" />
                                {shift.hours}
                            </div>

                            <button
                                onClick={() => {
                                    if (!isConfirmed) {
                                        setConfirmingShiftKey(shiftKey);
                                    }
                                }}
                                disabled={isConfirmed}
                                className={`w-full py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${
                                    isConfirmed
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-not-allowed opacity-80'
                                        : 'bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-md shadow-sky-500/20 hover:shadow-lg hover:shadow-sky-500/30'
                                }`}
                            >
                                <Check className="w-4 h-4" />
                                {isConfirmed ? 'Đã xác nhận ca' : 'Xác nhận ca'}
                            </button>

                            {confirmingShiftKey === shiftKey && !isConfirmed && (
                                <div className="absolute left-6 right-6 top-[230px] z-20 p-4 rounded-2xl bg-white/90 backdrop-blur-xl border border-teal-100 shadow-xl">
                                    <p className="text-sm font-bold text-slate-800 mb-1">
                                        Xác nhận hoàn thành ca làm của bạn ?
                                    </p>

                                    <p className="text-xs text-slate-500 font-medium mb-4">
                                        Sau khi xác nhận, trạng thái ca làm sẽ không thể thay đổi.
                                    </p>

                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => setConfirmingShiftKey(null)}
                                            className="py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200 transition-all"
                                        >
                                            Hủy
                                        </button>

                                        <button
                                            onClick={() => handleConfirmShift(shift)}
                                            className="py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm shadow-md shadow-emerald-500/20 hover:shadow-lg transition-all"
                                        >
                                            Xác nhận
                                        </button>
                                    </div>
                                </div>
                            )}

                        </div>
                    );
                })}
            </div>
        </div>
    );
}