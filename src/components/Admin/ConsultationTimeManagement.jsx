import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Plus, Save, Search, Trash2, Loader2, CheckCircle2, AlertTriangle, User, Calendar, Tag } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { vi } from 'date-fns/locale';
import { useDoctors } from '../../hooks/useDoctors';
import { ConsultationSlotModel } from '../../models/ConsultationSlotModel';
import { supabase } from '../../supabaseClient';
import GlassSelect from '../common/GlassSelect';
import { ymdToDate, dateToYmd } from '../../utils/dateAdapters';

// Compact synced picker style for inline table cells (smaller padding than forms).
const TABLE_DP_CLS = 'w-full bg-white/80 border border-slate-200/80 text-slate-800 shadow-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none focus:outline-none transition-all rounded-lg p-2 text-sm';
// Transparent picker input that sits inside the form's focus-within field wrapper.
const FIELD_DP_CLS = 'w-full bg-transparent text-slate-800 text-sm border-none border-transparent focus:border-transparent focus:ring-0 shadow-none outline-none p-0';

const START_TIME_SLOTS = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
    '19:00', '19:30', '20:00', '20:30', '21:00'
];

const END_TIME_SLOTS = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
    '19:00', '19:30', '20:00', '20:30', '21:00'
];

const START_TIME_OPTIONS = START_TIME_SLOTS.map(t => ({ label: t, value: t }));
const END_TIME_OPTIONS = END_TIME_SLOTS.map(t => ({ label: t, value: t }));

export default function ConsultationTimeManagement() {
    const { doctors } = useDoctors();
    const doctorOptions = doctors.length > 0 ? doctors.map((d) => d.name) : ['BS. Nguyễn Văn A'];

    // Maps between the doctor's display name (what the UI shows) and its uuid
    // (what consultation_slots.doctor_id needs).
    const nameToId = useMemo(() => {
        const m = {};
        (doctors || []).forEach((d) => { m[d.name] = d.user_id || d.id; });
        return m;
    }, [doctors]);
    const idToName = useMemo(() => {
        const m = {};
        (doctors || []).forEach((d) => { m[String(d.user_id || d.id)] = d.name; });
        return m;
    }, [doctors]);

    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const [form, setForm] = useState({ doctorName: doctorOptions[0], date: '', startTime: '08:00', endTime: '08:30', status: 'Trống' });
    const [searchTerm, setSearchTerm] = useState('');

    const notify = useCallback((message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    }, []);

    const loadSlots = useCallback(async () => {
        setLoading(true);
        try {
            const data = await ConsultationSlotModel.getAll();
            setSlots(data);
        } catch (err) {
            console.error('Failed to load consultation slots:', err);
            notify('Không thể tải danh sách slot.', 'error');
            setSlots([]);
        } finally {
            setLoading(false);
        }
    }, [notify]);

    useEffect(() => { loadSlots(); }, [loadSlots]);

    // Realtime: reflect another admin's schedule edits live. Listen on both the
    // slots and their parent schedules (a schedule change can cascade to slots).
    useEffect(() => {
        const channel = supabase
            .channel('admin-consultation-slots')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'consultation_slots' }, () => { loadSlots(); })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'doctor_schedules' }, () => { loadSlots(); })
            .subscribe();
        // CRITICAL: clean up the subscription on unmount.
        return () => {
            supabase.removeChannel(channel);
        };
    }, [loadSlots]);

    // Keep the create-form doctor valid once the doctor list resolves.
    useEffect(() => {
        if (doctors.length > 0) {
            setForm((prev) => (doctors.find((d) => d.name === prev.doctorName) ? prev : { ...prev, doctorName: doctors[0].name }));
        }
    }, [doctors]);

    const createSlot = async () => {
        if (!form.date || !form.startTime || !form.endTime) {
            notify('Vui lòng nhập đầy đủ ngày và giờ khám.', 'error');
            return;
        }
        if (form.startTime >= form.endTime) {
            notify('Giờ bắt đầu phải nhỏ hơn giờ kết thúc.', 'error');
            return;
        }
        setSaving(true);
        try {
            const created = await ConsultationSlotModel.create({
                doctorId: nameToId[form.doctorName],
                date: form.date,
                startTime: form.startTime,
                endTime: form.endTime,
                status: form.status,
            });
            setSlots((prev) => [created, ...prev]);
            setForm({ doctorName: doctorOptions[0], date: '', startTime: '08:00', endTime: '08:30', status: 'Trống' });
            notify('Đã tạo khung giờ khám.', 'success');
        } catch (err) {
            console.error('Failed to create slot:', err);
            notify(err.message || 'Tạo slot thất bại. Vui lòng thử lại.', 'error');
        } finally {
            setSaving(false);
        }
    };

    // Merge a patch into the row and persist the WHOLE row (the model re-resolves
    // schedule_id from doctor+date). Captures the merged row inside the updater.
    const persist = async (id, patch) => {
        let merged = null;
        setSlots((prev) => prev.map((s) => (s.id === id ? (merged = { ...s, ...patch }) : s)));
        if (!merged) return;
        try {
            await ConsultationSlotModel.update(id, {
                doctorId: merged.doctorId,
                date: merged.date,
                startTime: merged.startTime,
                endTime: merged.endTime,
                status: merged.status,
            });
        } catch (err) {
            console.error('Failed to update slot:', err);
            notify('Lưu thay đổi thất bại. Đang tải lại.', 'error');
            loadSlots();
        }
    };

    const deleteSlot = async (id) => {
        const prev = slots;
        setSlots((list) => list.filter((s) => s.id !== id));
        try {
            await ConsultationSlotModel.remove(id);
            notify('Đã xóa slot.', 'success');
        } catch (err) {
            console.error('Failed to delete slot:', err);
            setSlots(prev);
            notify('Xóa slot thất bại.', 'error');
        }
    };

    const filteredSlots = slots?.filter?.((slot) => {
        const name = (idToName[String(slot.doctorId)] || '').toLowerCase();
        return name.includes(searchTerm.toLowerCase()) || (slot.date || '').includes(searchTerm);
    });

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* ── Create Form ── */}
            <div className="relative z-20 bg-white/60 backdrop-blur-xl border border-white/50 shadow-lg rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-5 pb-3 border-b border-slate-200/50">
                    <Plus className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-extrabold text-lg text-slate-800">Tạo khung giờ khám</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-4">
                    {/* Bác sĩ */}
                    <div className="flex flex-col">
                        <span className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-indigo-500" />
                            Bác sĩ
                        </span>
                        <Select value={form.doctorName} onChange={(v) => setForm({ ...form, doctorName: v })} options={doctorOptions} />
                    </div>
                    {/* Ngày */}
                    <div className="flex flex-col">
                        <span className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                            Ngày khám
                        </span>
                        <div className="bg-white/50 backdrop-blur-md border border-white/60 rounded-xl flex items-center px-4 py-2.5 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/30 transition-all h-[44px]">
                            <Calendar className="w-4 h-4 text-emerald-500 mr-2 shrink-0" />
                            <DatePicker
                                selected={ymdToDate(form.date)}
                                onChange={(date) => setForm({ ...form, date: dateToYmd(date) })}
                                locale={vi}
                                dateFormat="dd/MM/yyyy"
                                placeholderText="dd/mm/yyyy"
                                wrapperClassName="flex-1 min-w-0"
                                className={FIELD_DP_CLS}
                            />
                        </div>
                    </div>
                    {/* Giờ bắt đầu */}
                    <div className="flex flex-col">
                        <span className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-emerald-500" />
                            Giờ bắt đầu
                        </span>
                        <Select value={form.startTime} onChange={(v) => setForm({ ...form, startTime: v })} options={START_TIME_OPTIONS} />
                    </div>
                    {/* Giờ kết thúc */}
                    <div className="flex flex-col">
                        <span className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-emerald-500" />
                            Giờ kết thúc
                        </span>
                        <Select value={form.endTime} onChange={(v) => setForm({ ...form, endTime: v })} options={END_TIME_OPTIONS} />
                    </div>
                    {/* Trạng thái */}
                    <div className="flex flex-col">
                        <span className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1">
                            <Tag className="w-3.5 h-3.5 text-indigo-500" />
                            Trạng thái
                        </span>
                        <Select value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={['Trống', 'Đã đặt', 'Đã hủy']} />
                    </div>
                    {/* Button */}
                    <div className="flex flex-col justify-end">
                        <button onClick={createSlot} disabled={saving} className="h-[44px] px-5 bg-gradient-to-r from-indigo-600 to-sky-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-200/50 hover:shadow-indigo-300/60 disabled:opacity-60 transition-all">
                            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                            Thêm khung giờ
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Slot List ── */}
            <div className="relative z-10 bg-white/60 backdrop-blur-xl border border-white/50 shadow-lg rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white/40">
                    <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-indigo-600" />
                        <h3 className="font-extrabold text-lg text-slate-800">Danh sách slot</h3>
                    </div>
                    <div className="relative flex items-center w-full md:w-72 bg-white/50 backdrop-blur-md border border-white/60 rounded-xl px-3 py-2.5 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/30 transition-all">
                        <Search size={16} className="text-indigo-500 mr-2 shrink-0" />
                        <input className="bg-transparent border-none outline-none w-full text-slate-800 p-0 focus:ring-0 text-sm font-semibold placeholder-slate-400" placeholder="Tìm theo bác sĩ/ngày..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center gap-3 py-16 text-slate-500">
                        <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                        <span className="text-sm font-semibold">Đang tải slot...</span>
                    </div>
                ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/60">
                            <tr>
                                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase w-[25%]">Bác sĩ</th>
                                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase w-[15%]">Ngày</th>
                                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase w-[25%]">Giờ</th>
                                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase w-[20%]">Trạng thái</th>
                                <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right w-[15%]">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/80">
                        {filteredSlots?.length === 0 ? (
                            <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400 italic">Chưa có slot nào.</td></tr>
                        ) : filteredSlots?.map?.((slot) => (
                            <tr key={slot.id} className="hover:bg-slate-50/60 transition-colors">
                                <td className="px-4 py-3">
                                    <Select value={idToName[String(slot.doctorId)] || doctorOptions[0]} onChange={(v) => persist(slot.id, { doctorId: nameToId[v] })} options={doctorOptions} compact />
                                </td>
                                <td className="px-4 py-3">
                                    <DatePicker
                                        selected={ymdToDate(slot.date)}
                                        onChange={(date) => persist(slot.id, { date: dateToYmd(date) })}
                                        locale={vi}
                                        dateFormat="dd/MM/yyyy"
                                        placeholderText="dd/mm/yyyy"
                                        withPortal
                                        className={TABLE_DP_CLS}
                                    />
                                </td>
                                <td className="px-4 py-3">
                                    <div className="grid grid-cols-2 gap-1.5">
                                        <Select value={slot.startTime} onChange={(v) => persist(slot.id, { startTime: v })} options={START_TIME_OPTIONS} compact />
                                        <Select value={slot.endTime} onChange={(v) => persist(slot.id, { endTime: v })} options={END_TIME_OPTIONS} compact />
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <Select value={slot.status} onChange={(v) => persist(slot.id, { status: v })} options={['Trống', 'Đã đặt', 'Đã hủy']} compact />
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <button onClick={() => deleteSlot(slot.id)} title="Xóa slot" className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-rose-500 bg-rose-50/60 border border-rose-100 hover:bg-rose-500 hover:text-white transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
                )}
            </div>

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 40, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 30, scale: 0.95 }}
                        className={`fixed bottom-8 right-8 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl text-white shadow-2xl ${
                            toast.type === 'error' ? 'bg-gradient-to-r from-rose-500 to-red-600' : 'bg-gradient-to-r from-emerald-500 to-teal-600'
                        }`}
                    >
                        {toast.type === 'error' ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                        <span className="text-sm font-semibold">{toast.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

function Select({ value, onChange, options, compact }) {
    return (
        <GlassSelect
            value={value}
            onChange={onChange}
            options={options || []}
            className="w-full"
            buttonClassName={`${compact ? 'py-2 px-3 text-sm' : 'py-2.5 px-4 text-sm'} bg-white/50 backdrop-blur-md border border-white/60 text-slate-800 rounded-xl font-semibold shadow-sm focus:ring-2 focus:ring-indigo-500/30 transition-all`}
        />
    );
}

