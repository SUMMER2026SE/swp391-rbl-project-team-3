import React, { useMemo, useState, useEffect } from 'react';
import { CalendarPlus, Clock, Save } from 'lucide-react';
import GlassCard, { GLASS_INPUT } from '../../../common/GlassCard';
import { supabase } from '../../../../supabaseClient';

function getDefaultFollowUpDate() {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().slice(0, 10);
}

export default function FollowUpAppointmentForm({ appointment }) {
    const storageKey = useMemo(
        () => `follow-up-${appointment?.id || appointment?.patientId || 'default'}`,
        [appointment]
    );

    const [followUp, setFollowUp] = useState(() => {
        const saved = localStorage.getItem(storageKey);
        return saved
            ? JSON.parse(saved)
            : {
                date: getDefaultFollowUpDate(),
                time: '09:00',
                reason: 'Tái khám để đánh giá tiến triển sau điều trị',
                status: 'Chưa tạo',
            };
    });

    const [bookedTimes, setBookedTimes] = useState([]);

    useEffect(() => {
        const fetchBookedTimes = async () => {
            const docId = appointment?.doctor_id || appointment?.doctorId;
            if (!docId || !followUp.date) return;
            
            try {
                const { data } = await supabase
                    .from('appointments')
                    .select('time')
                    .eq('doctor_id', docId)
                    .eq('date', followUp.date)
                    .neq('status', 'Đã hủy');
                
                if (data) {
                    setBookedTimes(data.map(apt => apt.time.substring(0, 5)));
                } else {
                    setBookedTimes([]);
                }
            } catch (err) {
                console.error("Failed to fetch booked times:", err);
            }
        };
        fetchBookedTimes();
    }, [followUp.date, appointment]);

    const handleCreateFollowUp = () => {
        if (!followUp.date || !followUp.time || !followUp.reason.trim()) {
            alert('Vui lòng nhập đầy đủ ngày, giờ và lý do tái khám.');
            return;
        }

        if (followUp.time < '08:00' || followUp.time > '17:00') {
            alert('Giờ tái khám phải nằm trong giờ làm việc của phòng khám (08:00 - 17:00).');
            return;
        }

        const nextFollowUp = {
            ...followUp,
            status: 'Đã tạo lịch tái khám',
            patientName: appointment?.patientName,
            service: appointment?.service,
            createdAt: new Date().toISOString(),
        };

        setFollowUp(nextFollowUp);
        localStorage.setItem(storageKey, JSON.stringify(nextFollowUp));
        alert(`Đã tạo lịch tái khám cho ${appointment?.patientName || 'bệnh nhân'} vào ${followUp.date} lúc ${followUp.time}.`);
    };

    return (
        <GlassCard className="p-6 mb-6">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-200/40">
                <CalendarPlus className="w-5 h-5 text-teal-600" />
                <h3 className="font-extrabold text-lg text-slate-900">Tạo lịch tái khám</h3>
            </div>

            <div className="mb-5">
                <label className="block text-xs font-bold text-slate-700 mb-2">Ngày tái khám</label>
                <input
                    type="date"
                    min={new Date().toISOString().slice(0, 10)}
                    value={followUp.date}
                    onChange={(e) => setFollowUp({ ...followUp, date: e.target.value, status: 'Chưa tạo' })}
                    className={`${GLASS_INPUT} w-full py-3 px-4 text-sm font-semibold rounded-xl`}
                />
            </div>

            <div className="mb-5">
                <label className="block text-xs font-bold text-slate-700 mb-2">Giờ tái khám</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {Array.from({ length: 19 }).map((_, i) => {
                        const hour = Math.floor(i / 2) + 8;
                        const min = i % 2 === 0 ? '00' : '30';
                        const timeStr = `${hour.toString().padStart(2, '0')}:${min}`;
                        
                        // Disable logic for past time if the selected date is today
                        const isBooked = bookedTimes.includes(timeStr);
                        
                        // Check locked slots (5 mins)
                        const lockedListStr = localStorage.getItem('dermasmart_locked_slots') || '[]';
                        let lockedList = [];
                        try { lockedList = JSON.parse(lockedListStr); } catch (e) {}
                        const activeLocks = lockedList?.filter(l => l.lockedUntil > Date.now());
                        const docId = appointment?.doctor_id || appointment?.doctorId;
                        const isLocked = activeLocks.some(l => String(l.doctorId) === String(docId) && l.date === followUp.date && l.time === timeStr);

                        const isToday = followUp.date === new Date().toISOString().slice(0, 10);
                        const now = new Date();
                        const currentMins = now.getHours() * 60 + now.getMinutes();
                        const slotMins = hour * 60 + (i % 2 === 0 ? 0 : 30);
                        const isPast = isToday && slotMins <= currentMins;

                        const isDisabled = isPast || isBooked || isLocked;
                        const isSelected = followUp.time === timeStr;

                        return (
                            <button
                                key={timeStr}
                                type="button"
                                disabled={isDisabled}
                                onClick={() => setFollowUp({ ...followUp, time: timeStr, status: 'Chưa tạo' })}
                                className={`px-2 py-2.5 rounded-xl text-xs font-bold text-center border transition-all ${
                                    isDisabled
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
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Lý do tái khám</label>
                <textarea
                    value={followUp.reason}
                    onChange={(e) => setFollowUp({ ...followUp, reason: e.target.value, status: 'Chưa tạo' })}
                    className={`${GLASS_INPUT} w-full py-3 px-4 text-sm font-semibold resize-none rounded-xl`}
                    rows="2"
                />
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
        <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${followUp.status === 'Đã tạo lịch tái khám' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' : 'bg-slate-50 text-slate-500 border-slate-200/60'}`}>
          {followUp.status}
        </span>
                <button
                    type="button"
                    onClick={handleCreateFollowUp}
                    className="bg-gradient-to-r from-sky-500 to-teal-500 text-white py-3 px-5 rounded-xl font-bold shadow-md shadow-sky-500/20 hover:shadow-lg hover:shadow-sky-500/30 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    <Save className="w-4 h-4" />
                    Tạo lịch tái khám
                </button>
            </div>
        </GlassCard>
    );
}
