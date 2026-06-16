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
            
            const groups = [];
            const sorted = [...(data || [])].sort((a, b) => new Date(a.work_date) - new Date(b.work_date));

            sorted.forEach(s => {
                const existingGroup = groups.find(g => 
                    g.start_time === s.start_time &&
                    g.end_time === s.end_time &&
                    g.room === s.room &&
                    g.status === s.status
                );

                if (existingGroup) {
                    const lastShiftDate = new Date(existingGroup.shifts[existingGroup.shifts.length - 1].work_date);
                    const currentShiftDate = new Date(s.work_date);
                    const diffDays = (currentShiftDate - lastShiftDate) / (1000 * 60 * 60 * 24);
                    
                    if (diffDays <= 14) {
                        existingGroup.shifts.push(s);
                        return;
                    }
                }

                groups.push({
                    id: s.id, 
                    doctor_id: s.doctor_id,
                    start_time: s.start_time,
                    end_time: s.end_time,
                    room: s.room,
                    status: s.status,
                    shifts: [s]
                });
            });

            const formattedGroups = groups.map(g => {
                const minDate = g.shifts[0].work_date;
                const maxDate = g.shifts[g.shifts.length - 1].work_date;
                
                const days = [...new Set(g.shifts.map(s => s.day_of_week))];
                const dayOrder = { 'Thứ Hai': 1, 'Thứ Ba': 2, 'Thứ Tư': 3, 'Thứ Năm': 4, 'Thứ Sáu': 5, 'Thứ Bảy': 6, 'Chủ Nhật': 7 };
                days.sort((a, b) => dayOrder[a] - dayOrder[b]);

                return {
                    id: g.id,
                    day: days.join(', '),
                    dateRange: minDate === maxDate ? minDate : `${minDate} đến ${maxDate}`,
                    hours: `${g.start_time ? g.start_time.slice(0,5) : ''} - ${g.end_time ? g.end_time.slice(0,5) : ''}`,
                    room: g.room,
                    status: g.status,
                    shifts: g.shifts
                };
            });
            setDoctorSchedules(formattedGroups);
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

    const handleConfirmShift = async (group) => {
        const groupKey = `${group.id}-${group.dateRange}-${group.hours}`;

        if (confirmedShifts[groupKey] || group.status === 'Đã xác nhận') {
            return;
        }

        // Call database to update the status for all shifts in group
        await Promise.all(group.shifts.map(s => DoctorScheduleModel.updateShift(s.id, { status: 'Đã xác nhận' })));

        const nextConfirmedShifts = {
            ...confirmedShifts,
            [groupKey]: true,
        };

        setConfirmedShifts(nextConfirmedShifts);
        localStorage.setItem(storageKey, JSON.stringify(nextConfirmedShifts));
        
        // Update local state to reflect the change immediately
        setDoctorSchedules(prev => prev.map(g => g.id === group.id ? { ...g, status: 'Đã xác nhận' } : g));
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
                {doctorSchedules?.map?.((group) => {
                    const groupKey = `${group.id}-${group.dateRange}-${group.hours}`;
                    const isConfirmed = !!confirmedShifts[groupKey] || group.status === 'Đã xác nhận';

                    return (
                        <div
                            key={groupKey}
                            className={`backdrop-blur-xl bg-white/40 border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-[2rem] p-6 relative overflow-visible group min-h-[300px] ${confirmingShiftKey === groupKey ? 'z-50' : 'z-10'}`}
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
                                {group.day}
                            </h3>

                            {group.dateRange && (
                                <p className="text-xs text-slate-400 font-bold mb-3">
                                    {group.dateRange.includes('đến') 
                                        ? `Từ ${formatDate(group.dateRange.split(' đến ')[0])} đến ${formatDate(group.dateRange.split(' đến ')[1])}` 
                                        : formatDate(group.dateRange)}
                                </p>
                            )}

                            <div className="flex items-center gap-2 text-slate-600 font-medium mb-6 bg-white/50 p-3 rounded-xl border border-slate-100">
                                <Clock className="w-4 h-4 text-slate-400" />
                                {group.hours}
                            </div>

                            <button
                                onClick={() => {
                                    if (!isConfirmed) {
                                        setConfirmingShiftKey(groupKey);
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

                            {confirmingShiftKey === groupKey && !isConfirmed && (
                                <div className="absolute left-6 right-6 top-[230px] z-20 p-4 rounded-2xl bg-white/90 backdrop-blur-xl border border-teal-100 shadow-xl">
                                    <p className="text-sm font-bold text-slate-800 mb-1">
                                        Xác nhận hoàn thành ca làm của bạn ?
                                    </p>

                                    <p className="text-xs text-slate-500 font-medium mb-4">
                                        Sau khi xác nhận, trạng thái {group.shifts.length} ca làm sẽ được cập nhật.
                                    </p>

                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => setConfirmingShiftKey(null)}
                                            className="py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200 transition-all"
                                        >
                                            Hủy
                                        </button>

                                        <button
                                            onClick={() => handleConfirmShift(group)}
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