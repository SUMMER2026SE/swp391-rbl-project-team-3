import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, Plus, Save, Search, RefreshCw } from 'lucide-react';
import { useDoctors } from '../../hooks/useDoctors';
import { DoctorScheduleModel } from '../../models/DoctorScheduleModel';

const getVietnameseDayName = (dateString) => {
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    return days[new Date(dateString).getDay()];
};

export default function DoctorScheduleManagement() {
    const { doctors, loading: docsLoading, error: docsError } = useDoctors();
    
    const [schedules, setSchedules] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [form, setForm] = useState({ doctorId: '', date: '', startTime: '08:00', endTime: '17:00', room: 'Phòng khám 1', status: 'Đã phân công' });
    const [searchTerm, setSearchTerm] = useState('');

    React.useEffect(() => {
        if (doctors.length > 0 && !form.doctorId) {
            setForm(prev => ({ ...prev, doctorId: doctors[0].id }));
        }
    }, [doctors]);

    const fetchSchedules = async () => {
        setIsLoading(true);
        const data = await DoctorScheduleModel.getAllShifts();
        setSchedules(data);
        setIsLoading(false);
    };

    React.useEffect(() => {
        fetchSchedules();
    }, []);

    const createSchedule = async () => {
        if (!form.date || !form.startTime || !form.endTime || !form.doctorId) {
            alert('Vui lòng chọn đầy đủ bác sĩ, ngày và giờ làm việc.');
            return;
        }
        if (form.startTime >= form.endTime) {
            alert('Giờ bắt đầu phải nhỏ hơn giờ kết thúc.');
            return;
        }

        const selectedDoc = doctors.find(d => d.id === form.doctorId);
        const docName = selectedDoc ? selectedDoc.name : 'Unknown';

        const newShiftData = {
            doctor_id: form.doctorId,
            doctor_name: docName,
            work_date: form.date,
            day_of_week: getVietnameseDayName(form.date),
            start_time: form.startTime,
            end_time: form.endTime,
            room: form.room,
            status: form.status
        };

        try {
            const added = await DoctorScheduleModel.createShift(newShiftData);
            setSchedules([added, ...schedules]);
            setForm({ doctorId: form.doctorId, date: '', startTime: '08:00', endTime: '17:00', room: 'Phòng khám 1', status: 'Đã phân công' });
        } catch (e) {
            alert('Lỗi khi lưu lịch làm việc: ' + e.message);
        }
    };

    const updateSchedule = async (id, field, value) => {
        try {
            let updates = {};
            if (field === 'date') {
                updates.work_date = value;
                updates.day_of_week = getVietnameseDayName(value);
            } else if (field === 'doctorId') {
                updates.doctor_id = value;
                const doc = doctors.find(d => d.id === value);
                if (doc) updates.doctor_name = doc.name;
            } else if (field === 'startTime') {
                updates.start_time = value;
            } else if (field === 'endTime') {
                updates.end_time = value;
            } else {
                updates[field] = value;
            }

            const updatedDoc = await DoctorScheduleModel.updateShift(id, updates);
            setSchedules(schedules.map(s => s.id === id ? updatedDoc : s));
        } catch (e) {
            alert('Lỗi khi cập nhật lịch: ' + e.message);
        }
    };

    const filteredSchedules = schedules?.filter?.((schedule) =>
        schedule.doctor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        schedule.room?.toLowerCase().includes(searchTerm.toLowerCase()));

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
                    <Select value={form.doctorId} onChange={(v) => setForm({ ...form, doctorId: v })} options={doctors.map(d => ({ label: d.name, value: d.id }))} loading={docsLoading} error={docsError} />
                    <Input type="date" value={form.date} onChange={(v) => setForm({ ...form, date: v })} />
                    <Input type="time" value={form.startTime} onChange={(v) => setForm({ ...form, startTime: v })} />
                    <Input type="time" value={form.endTime} onChange={(v) => setForm({ ...form, endTime: v })} />
                    <Select value={form.room} onChange={(v) => setForm({ ...form, room: v })} options={['Phòng khám 1', 'Phòng khám 2', 'Phòng khám 3', 'Phòng online'].map(r => ({ label: r, value: r }))} />
                    <button onClick={createSchedule} className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-sky-500 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"><Save className="w-4 h-4" /> Lưu lịch</button>
                </div>
            </div>
            <div className="backdrop-blur-xl bg-white/75 border border-white/80 shadow-[0_15px_40px_rgba(0,0,0,0.05)] rounded-[2rem]">
                <div className="p-6 border-b border-slate-200/50 flex flex-col md:flex-row justify-between items-center gap-4 bg-white/40 rounded-t-[2rem]">
                    <div className="flex items-center gap-2">
                        <CalendarDays className="w-5 h-5 text-indigo-600" />
                        <h3 className="font-extrabold text-lg text-slate-800">Danh sách lịch</h3>
                        {isLoading && <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin ml-2" />}
                    </div>
                    <div className="relative w-full md:w-80"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" /><input className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-semibold outline-none" placeholder="Tìm bác sĩ/phòng..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
                </div>
                <div className="overflow-x-auto pb-8 min-h-[200px]">
                    <table className="w-full text-left">
                        <thead className="bg-slate-100/50"><tr><th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase">Bác sĩ</th><th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase">Ngày</th><th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase">Thứ</th><th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase">Giờ</th><th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase">Phòng</th><th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase">Trạng thái</th></tr></thead>
                        <tbody className="divide-y divide-slate-100">
                        {filteredSchedules?.map?.((schedule) => (
                            <tr key={schedule.id} className="hover:bg-slate-50/80">
                                <td className="px-8 py-5"><Select value={schedule.doctor_id || ''} onChange={(v) => updateSchedule(schedule.id, 'doctorId', v)} options={doctors.map(d => ({ label: d.name, value: d.id }))} /></td>
                                <td className="px-8 py-5"><Input type="date" value={schedule.work_date} onChange={(v) => updateSchedule(schedule.id, 'date', v)} /></td>
                                <td className="px-8 py-5"><span className="font-bold text-slate-700">{schedule.day_of_week}</span></td>
                                <td className="px-8 py-5"><div className="grid grid-cols-2 gap-2"><Input type="time" value={schedule.start_time ? schedule.start_time.slice(0,5) : ''} onChange={(v) => updateSchedule(schedule.id, 'startTime', v)} /><Input type="time" value={schedule.end_time ? schedule.end_time.slice(0,5) : ''} onChange={(v) => updateSchedule(schedule.id, 'endTime', v)} /></div></td>
                                <td className="px-8 py-5"><Select value={schedule.room} onChange={(v) => updateSchedule(schedule.id, 'room', v)} options={['Phòng khám 1', 'Phòng khám 2', 'Phòng khám 3', 'Phòng online'].map(r => ({ label: r, value: r }))} /></td>
                                <td className="px-8 py-5"><Select value={schedule.status} onChange={(v) => updateSchedule(schedule.id, 'status', v)} options={['Đã phân công', 'Đã xác nhận', 'Đã hủy'].map(s => ({ label: s, value: s }))} /></td>
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
function Select({ value, onChange, options, loading, error }) {
    return (
        <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-white border border-slate-200 rounded-2xl py-3 px-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400">
            {error && <option value="">Lỗi: {String(error)}</option>}
            {!error && loading && <option value="">Đang tải...</option>}
            {!error && !loading && options?.length === 0 && <option value="">Trống</option>}
            {options?.map?.((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
            ))}
        </select>
    );
}
