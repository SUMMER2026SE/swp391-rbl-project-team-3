import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, Plus, Save, Search } from 'lucide-react';
import { doctors } from '../../mockData';

const getVietnameseDayName = (dateString) => {
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    return days[new Date(dateString).getDay()];
};

export default function DoctorScheduleManagement() {
    const doctorOptions = doctors?.map((doctor) => doctor.name) || ['BS. Nguyễn Văn A'];

    const [schedules, setSchedules] = useState(() => {
        const saved = localStorage.getItem('admin-doctor-schedules');
        return saved ? JSON.parse(saved) : [
            { id: 'SCH-001', doctorName: doctorOptions[0], date: '2026-06-09', day: 'Thứ Ba', startTime: '08:00', endTime: '17:00', room: 'Phòng khám 1', status: 'Đã phân công' },
        ];
    });

    const [form, setForm] = useState({ doctorName: doctorOptions[0], date: '', startTime: '08:00', endTime: '17:00', room: 'Phòng khám 1', status: 'Đã phân công' });
    const [searchTerm, setSearchTerm] = useState('');

    const saveSchedules = (nextSchedules) => {
        setSchedules(nextSchedules);
        localStorage.setItem('admin-doctor-schedules', JSON.stringify(nextSchedules));
    };

    const createSchedule = () => {
        if (!form.date || !form.startTime || !form.endTime) {
            alert('Vui lòng chọn đầy đủ ngày và giờ làm việc.');
            return;
        }
        if (form.startTime >= form.endTime) {
            alert('Giờ bắt đầu phải nhỏ hơn giờ kết thúc.');
            return;
        }

        const newSchedule = { id: `SCH-${Date.now()}`, ...form, day: getVietnameseDayName(form.date) };
        saveSchedules([newSchedule, ...schedules]);
        setForm({ doctorName: doctorOptions[0], date: '', startTime: '08:00', endTime: '17:00', room: 'Phòng khám 1', status: 'Đã phân công' });
    };

    const updateSchedule = (id, field, value) => {
        const nextSchedules = schedules.map((schedule) => {
            if (schedule.id !== id) return schedule;
            const updated = { ...schedule, [field]: value };
            if (field === 'date') updated.day = getVietnameseDayName(value);
            return updated;
        });
        saveSchedules(nextSchedules);
    };

    const filteredSchedules = schedules.filter((schedule) =>
        schedule.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        schedule.room.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div>
                <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Lịch làm việc Bác sĩ</h2>
                <p className="text-slate-500 text-sm font-medium mt-1">Admin phân công và cập nhật lịch làm việc cho bác sĩ.</p>
            </div>

            <div className="backdrop-blur-xl bg-white/75 border border-white/80 shadow-[0_15px_40px_rgba(0,0,0,0.05)] rounded-[2rem] p-8">
                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-200/50">
                    <Plus className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-extrabold text-lg text-slate-800">Tạo lịch làm việc</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <Select value={form.doctorName} onChange={(v) => setForm({ ...form, doctorName: v })} options={doctorOptions} />
                    <Input type="date" value={form.date} onChange={(v) => setForm({ ...form, date: v })} />
                    <Input type="time" value={form.startTime} onChange={(v) => setForm({ ...form, startTime: v })} />
                    <Input type="time" value={form.endTime} onChange={(v) => setForm({ ...form, endTime: v })} />
                    <Select value={form.room} onChange={(v) => setForm({ ...form, room: v })} options={['Phòng khám 1', 'Phòng khám 2', 'Phòng khám 3', 'Phòng online']} />
                    <button onClick={createSchedule} className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-sky-500 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"><Save className="w-4 h-4" /> Lưu lịch</button>
                </div>
            </div>

            <div className="backdrop-blur-xl bg-white/75 border border-white/80 shadow-[0_15px_40px_rgba(0,0,0,0.05)] rounded-[2rem] overflow-hidden">
                <div className="p-6 border-b border-slate-200/50 flex flex-col md:flex-row justify-between gap-4 bg-white/40">
                    <div className="flex items-center gap-2"><CalendarDays className="w-5 h-5 text-indigo-600" /><h3 className="font-extrabold text-lg text-slate-800">Danh sách lịch</h3></div>
                    <div className="relative w-full md:w-80"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" /><input className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-semibold outline-none" placeholder="Tìm bác sĩ/phòng..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-100/50"><tr><th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase">Bác sĩ</th><th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase">Ngày</th><th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase">Thứ</th><th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase">Giờ</th><th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase">Phòng</th><th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase">Trạng thái</th></tr></thead>
                        <tbody className="divide-y divide-slate-100">
                        {filteredSchedules.map((schedule) => (
                            <tr key={schedule.id} className="hover:bg-slate-50/80">
                                <td className="px-8 py-5"><Select value={schedule.doctorName} onChange={(v) => updateSchedule(schedule.id, 'doctorName', v)} options={doctorOptions} /></td>
                                <td className="px-8 py-5"><Input type="date" value={schedule.date} onChange={(v) => updateSchedule(schedule.id, 'date', v)} /></td>
                                <td className="px-8 py-5"><span className="font-bold text-slate-700">{schedule.day}</span></td>
                                <td className="px-8 py-5"><div className="grid grid-cols-2 gap-2"><Input type="time" value={schedule.startTime} onChange={(v) => updateSchedule(schedule.id, 'startTime', v)} /><Input type="time" value={schedule.endTime} onChange={(v) => updateSchedule(schedule.id, 'endTime', v)} /></div></td>
                                <td className="px-8 py-5"><Select value={schedule.room} onChange={(v) => updateSchedule(schedule.id, 'room', v)} options={['Phòng khám 1', 'Phòng khám 2', 'Phòng khám 3', 'Phòng online']} /></td>
                                <td className="px-8 py-5"><Select value={schedule.status} onChange={(v) => updateSchedule(schedule.id, 'status', v)} options={['Đã phân công', 'Đã xác nhận', 'Đã hủy']} /></td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
}

function Input({ value, onChange, type = 'text' }) {
    return <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-white border border-slate-200 rounded-2xl py-3 px-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400" />;
}
function Select({ value, onChange, options }) {
    return <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-white border border-slate-200 rounded-2xl py-3 px-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400">{options.map((option) => <option key={option}>{option}</option>)}</select>;
}
