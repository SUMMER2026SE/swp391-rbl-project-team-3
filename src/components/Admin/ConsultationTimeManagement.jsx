import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Plus, Save, Search } from 'lucide-react';
import { useDoctors } from '../../hooks/useDoctors';
import GlassSelect from '../common/GlassSelect';

export default function ConsultationTimeManagement() {
    const { doctors } = useDoctors();
    const doctorOptions = doctors.length > 0 ? doctors.map((doctor) => doctor.name) : ['BS. Nguyễn Văn A'];

    const [slots, setSlots] = useState(() => {
        const saved = localStorage.getItem('admin-consultation-slots');
        return saved ? JSON.parse(saved) : [
            { id: 'SLOT-001', doctorName: doctorOptions[0], date: '2026-06-09', startTime: '08:00', endTime: '08:30', status: 'Trống' },
        ];
    });
    const [form, setForm] = useState({ doctorName: doctorOptions[0], date: '', startTime: '08:00', endTime: '08:30', status: 'Trống' });
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (doctors.length > 0) {
            setForm(prev => {
                if (!doctors.find(d => d.name === prev.doctorName)) {
                    return { ...prev, doctorName: doctors[0].name };
                }
                return prev;
            });
        }
    }, [doctors]);

    const saveSlots = (nextSlots) => {
        setSlots(nextSlots);
        localStorage.setItem('admin-consultation-slots', JSON.stringify(nextSlots));
    };

    const createSlot = () => {
        if (!form.date || !form.startTime || !form.endTime) {
            alert('Vui lòng nhập đầy đủ ngày và giờ khám.');
            return;
        }
        if (form.startTime >= form.endTime) {
            alert('Giờ bắt đầu phải nhỏ hơn giờ kết thúc.');
            return;
        }
        const newSlot = { id: `SLOT-${Date.now()}`, ...form };
        saveSlots([newSlot, ...slots]);
        setForm({ doctorName: doctorOptions[0], date: '', startTime: '08:00', endTime: '08:30', status: 'Trống' });
    };

    const updateSlot = (id, field, value) => {
        const nextSlots = slots?.map?.((slot) => slot.id === id ? { ...slot, [field]: value } : slot);
        saveSlots(nextSlots);
    };

    const filteredSlots = slots?.filter?.((slot) =>
        slot.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        slot.date.includes(searchTerm));

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="backdrop-blur-xl bg-white/75 border border-white/80 shadow-[0_15px_40px_rgba(0,0,0,0.05)] rounded-[2rem] p-8">
                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-200/50"><Plus className="w-5 h-5 text-indigo-600" /><h3 className="font-extrabold text-lg text-slate-800">Tạo khung giờ khám</h3></div>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <Select value={form.doctorName} onChange={(v) => setForm({ ...form, doctorName: v })} options={doctorOptions} />
                    <Input type="date" value={form.date} onChange={(v) => setForm({ ...form, date: v })} />
                    <Input type="time" value={form.startTime} onChange={(v) => setForm({ ...form, startTime: v })} />
                    <Input type="time" value={form.endTime} onChange={(v) => setForm({ ...form, endTime: v })} />
                    <Select value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={['Trống', 'Đã đặt', 'Đã hủy']} />
                    <button onClick={createSlot} className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-sky-500 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"><Save className="w-4 h-4" /> Tạo slot</button>
                </div>
            </div>
            <div className="backdrop-blur-xl bg-white/75 border border-white/80 shadow-[0_15px_40px_rgba(0,0,0,0.05)] rounded-[2rem] overflow-hidden">
                <div className="p-6 border-b border-slate-200/50 flex flex-col md:flex-row justify-between gap-4 bg-white/40">
                    <div className="flex items-center gap-2"><Clock className="w-5 h-5 text-indigo-600" /><h3 className="font-extrabold text-lg text-slate-800">Danh sách slot</h3></div>
                    <div className="relative w-full md:w-80"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" /><input className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-semibold outline-none" placeholder="Tìm theo bác sĩ/ngày..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-100/50"><tr><th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase">Bác sĩ</th><th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase">Ngày</th><th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase">Giờ</th><th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase">Trạng thái</th></tr></thead>
                        <tbody className="divide-y divide-slate-100">
                        {filteredSlots?.map?.((slot) => (
                            <tr key={slot.id} className="hover:bg-slate-50/80">
                                <td className="px-8 py-5"><Select value={slot.doctorName} onChange={(v) => updateSlot(slot.id, 'doctorName', v)} options={doctorOptions} /></td>
                                <td className="px-8 py-5"><Input type="date" value={slot.date} onChange={(v) => updateSlot(slot.id, 'date', v)} /></td>
                                <td className="px-8 py-5"><div className="grid grid-cols-2 gap-2"><Input type="time" value={slot.startTime} onChange={(v) => updateSlot(slot.id, 'startTime', v)} /><Input type="time" value={slot.endTime} onChange={(v) => updateSlot(slot.id, 'endTime', v)} /></div></td>
                                <td className="px-8 py-5"><Select value={slot.status} onChange={(v) => updateSlot(slot.id, 'status', v)} options={['Trống', 'Đã đặt', 'Đã hủy']} /></td>
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
    return <GlassSelect value={value} onChange={onChange} options={options || []} className="w-full" buttonClassName="py-3 px-4 text-sm font-semibold" />;
}
