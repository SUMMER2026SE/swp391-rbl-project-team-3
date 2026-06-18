import React, { useMemo, useState } from 'react';
import { CalendarPlus, Clock, Save } from 'lucide-react';
import GlassCard, { GLASS_INPUT } from '../../../common/GlassCard';

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

    const handleCreateFollowUp = () => {
        if (!followUp.date || !followUp.time || !followUp.reason.trim()) {
            alert('Vui lòng nhập đầy đủ ngày, giờ và lý do tái khám.');
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">Ngày tái khám</label>
                    <input
                        type="date"
                        value={followUp.date}
                        onChange={(e) => setFollowUp({ ...followUp, date: e.target.value, status: 'Chưa tạo' })}
                        className={`${GLASS_INPUT} w-full py-3 px-4 text-sm font-semibold rounded-xl`}
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">Giờ tái khám</label>
                    <div className="relative">
                        <Clock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                            type="time"
                            value={followUp.time}
                            onChange={(e) => setFollowUp({ ...followUp, time: e.target.value, status: 'Chưa tạo' })}
                            className={`${GLASS_INPUT} w-full py-3 pl-11 pr-4 text-sm font-semibold rounded-xl`}
                        />
                    </div>
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
