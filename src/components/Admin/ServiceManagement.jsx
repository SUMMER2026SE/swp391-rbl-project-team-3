import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Save, Stethoscope, Search, Trash2, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import GlassSelect from '../common/GlassSelect';
import { ServiceModel } from '../../models/ServiceModel';

export default function ServiceManagement() {
    const [searchTerm, setSearchTerm] = useState('');
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null); // { message, type: 'success' | 'error' }
    const [form, setForm] = useState({ name: '', price: '', description: '', status: 'Hoạt động', duration: 30 });

    const notify = useCallback((message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    }, []);

    // ── Load from Supabase ──
    const loadServices = useCallback(async () => {
        setLoading(true);
        try {
            const data = await ServiceModel.getAll();
            setServices(data);
        } catch (err) {
            console.error('Failed to load services:', err);
            notify('Không thể tải danh sách dịch vụ.', 'error');
            setServices([]);
        } finally {
            setLoading(false);
        }
    }, [notify]);

    useEffect(() => { loadServices(); }, [loadServices]);

    // ── Create ──
    const createService = async () => {
        if (!form.name.trim() || !form.price) {
            notify('Vui lòng nhập tên dịch vụ và giá.', 'error');
            return;
        }
        setSaving(true);
        try {
            const created = await ServiceModel.create(form);
            setServices((prev) => [created, ...prev]);
            setForm({ name: '', price: '', description: '', status: 'Hoạt động', duration: 30 });
            notify('Đã thêm dịch vụ mới.', 'success');
        } catch (err) {
            console.error('Failed to create service:', err);
            notify('Thêm dịch vụ thất bại. Vui lòng thử lại.', 'error');
        } finally {
            setSaving(false);
        }
    };

    // Update local state immediately for a responsive feel; persist on blur/commit.
    const updateLocal = (id, field, value) => {
        setServices((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
    };

    const commitService = async (id, field, value) => {
        try {
            await ServiceModel.update(id, { [field]: field === 'price' ? Number(value) : value });
        } catch (err) {
            console.error('Failed to update service:', err);
            notify('Lưu thay đổi thất bại. Đang tải lại.', 'error');
            loadServices();
        }
    };

    // ── Delete ──
    const deleteService = async (id) => {
        const prev = services;
        setServices((list) => list.filter((s) => s.id !== id)); // optimistic
        try {
            await ServiceModel.remove(id);
            notify('Đã xóa dịch vụ.', 'success');
        } catch (err) {
            console.error('Failed to delete service:', err);
            setServices(prev); // rollback
            notify('Xóa dịch vụ thất bại.', 'error');
        }
    };

    const filteredServices = services?.filter?.((service) =>
        (service.name || '').toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="backdrop-blur-xl bg-white/75 border border-white/80 shadow-[0_15px_40px_rgba(0,0,0,0.05)] rounded-[2rem] p-8">
                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-200/50">
                    <Plus className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-extrabold text-lg text-slate-800">Thêm dịch vụ mới</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                    <Input placeholder="Tên dịch vụ" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
                    <Input placeholder="Giá dịch vụ" type="number" value={form.price} onChange={(v) => setForm({ ...form, price: v })} />
                    <Input placeholder="Thời lượng (phút)" type="number" value={form.duration} onChange={(v) => setForm({ ...form, duration: v })} />
                    <Input placeholder="Mô tả" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
                    <button onClick={createService} disabled={saving} className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-sky-500 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 disabled:opacity-60">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Lưu dịch vụ
                    </button>
                </div>
            </div>
            <div className="backdrop-blur-xl bg-white/75 border border-white/80 shadow-[0_15px_40px_rgba(0,0,0,0.05)] rounded-[2rem] overflow-hidden">
                <div className="p-6 border-b border-slate-200/50 flex flex-col md:flex-row justify-between gap-4 bg-white/40">
                    <div className="flex items-center gap-2">
                        <Stethoscope className="w-5 h-5 text-indigo-600" />
                        <h3 className="font-extrabold text-lg text-slate-800">Danh sách dịch vụ</h3>
                    </div>
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-semibold outline-none" placeholder="Tìm dịch vụ..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center gap-3 py-20 text-slate-500">
                        <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                        <span className="text-sm font-semibold">Đang tải dịch vụ...</span>
                    </div>
                ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-100/50">
                        <tr>
                            <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase">Dịch vụ</th>
                            <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase">Giá</th>
                            <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase">Thời lượng (phút)</th>
                            <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase">Mô tả</th>
                            <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase">Trạng thái</th>
                            <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase text-right">Thao tác</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                        {filteredServices?.length === 0 ? (
                            <tr><td colSpan={6} className="px-8 py-12 text-center text-sm text-slate-400 italic">Chưa có dịch vụ nào.</td></tr>
                        ) : filteredServices?.map?.((service) => (
                            <tr key={service.id} className="hover:bg-slate-50/80">
                                <td className="px-8 py-5"><Input value={service.name} onChange={(v) => updateLocal(service.id, 'name', v)} onBlur={(v) => commitService(service.id, 'name', v)} /></td>
                                <td className="px-8 py-5"><Input type="number" value={service.price} onChange={(v) => updateLocal(service.id, 'price', v)} onBlur={(v) => commitService(service.id, 'price', v)} /></td>
                                <td className="px-8 py-5"><Input type="number" value={service.duration} onChange={(v) => updateLocal(service.id, 'duration', v)} onBlur={(v) => commitService(service.id, 'duration', v)} /></td>
                                <td className="px-8 py-5"><Input value={service.description} onChange={(v) => updateLocal(service.id, 'description', v)} onBlur={(v) => commitService(service.id, 'description', v)} /></td>
                                <td className="px-8 py-5"><Select value={service.status} onChange={(v) => { updateLocal(service.id, 'status', v); commitService(service.id, 'status', v); }} options={['Hoạt động', 'Tạm ẩn']} /></td>
                                <td className="px-8 py-5 text-right">
                                    <button onClick={() => deleteService(service.id)} title="Xóa dịch vụ" className="inline-flex items-center justify-center w-10 h-10 rounded-xl text-rose-500 bg-rose-50/60 border border-rose-100 hover:bg-rose-500 hover:text-white transition-colors">
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
                        className={`fixed bottom-8 right-8 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl text-white shadow-2xl ${
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

function Input({ value, onChange, onBlur, placeholder = '', type = 'text' }) {
    return <input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} onBlur={onBlur ? (e) => onBlur(e.target.value) : undefined} className="w-full bg-white border border-slate-200 rounded-2xl py-3 px-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400" />;
}

function Select({ value, onChange, options }) {
    return <GlassSelect value={value} onChange={onChange} options={options || []} className="w-full" buttonClassName="py-3 px-4 text-sm font-semibold" />;
}
