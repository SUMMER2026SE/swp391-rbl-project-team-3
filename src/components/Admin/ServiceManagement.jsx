import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Save, Stethoscope, Edit2, Search } from 'lucide-react';

export default function ServiceManagement() {
    const [searchTerm, setSearchTerm] = useState('');
    const [services, setServices] = useState(() => {
        const saved = localStorage.getItem('admin-services');
        return saved ? JSON.parse(saved) : [
            { id: 'SV-001', name: 'Khám da liễu tổng quát', price: 300000, description: 'Khám và tư vấn các vấn đề da liễu.', status: 'Hoạt động' },
            { id: 'SV-002', name: 'Soi da AI', price: 150000, description: 'Phân tích da bằng AI và đưa ra kết quả sơ bộ.', status: 'Hoạt động' },
            { id: 'SV-003', name: 'Điều trị mụn chuyên sâu', price: 500000, description: 'Liệu trình điều trị mụn theo phác đồ bác sĩ.', status: 'Hoạt động' },
        ];
    });

    const [form, setForm] = useState({ name: '', price: '', description: '', status: 'Hoạt động' });

    const saveServices = (nextServices) => {
        setServices(nextServices);
        localStorage.setItem('admin-services', JSON.stringify(nextServices));
    };

    const createService = () => {
        if (!form.name.trim() || !form.price) {
            alert('Vui lòng nhập tên dịch vụ và giá.');
            return;
        }

        const newService = {
            id: `SV-${Date.now()}`,
            name: form.name,
            price: Number(form.price),
            description: form.description,
            status: form.status,
        };

        saveServices([newService, ...services]);
        setForm({ name: '', price: '', description: '', status: 'Hoạt động' });
    };

    const updateService = (id, field, value) => {
        const nextServices = services.map((service) =>
            service.id === id ? { ...service, [field]: field === 'price' ? Number(value) : value } : service
        );
        saveServices(nextServices);
    };

    const filteredServices = services.filter((service) =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div>
                <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Quản lý Dịch vụ</h2>
                <p className="text-slate-500 text-sm font-medium mt-1">Cập nhật tên, giá, mô tả và trạng thái dịch vụ phòng khám.</p>
            </div>

            <div className="backdrop-blur-xl bg-white/75 border border-white/80 shadow-[0_15px_40px_rgba(0,0,0,0.05)] rounded-[2rem] p-8">
                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-200/50">
                    <Plus className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-extrabold text-lg text-slate-800">Thêm dịch vụ mới</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Input placeholder="Tên dịch vụ" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
                    <Input placeholder="Giá dịch vụ" type="number" value={form.price} onChange={(v) => setForm({ ...form, price: v })} />
                    <Input placeholder="Mô tả" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
                    <button onClick={createService} className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-sky-500 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-200">
                        <Save className="w-4 h-4" /> Lưu dịch vụ
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

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-100/50">
                        <tr>
                            <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase">Dịch vụ</th>
                            <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase">Giá</th>
                            <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase">Mô tả</th>
                            <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase">Trạng thái</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                        {filteredServices.map((service) => (
                            <tr key={service.id} className="hover:bg-slate-50/80">
                                <td className="px-8 py-5"><Input value={service.name} onChange={(v) => updateService(service.id, 'name', v)} /></td>
                                <td className="px-8 py-5"><Input type="number" value={service.price} onChange={(v) => updateService(service.id, 'price', v)} /></td>
                                <td className="px-8 py-5"><Input value={service.description} onChange={(v) => updateService(service.id, 'description', v)} /></td>
                                <td className="px-8 py-5"><Select value={service.status} onChange={(v) => updateService(service.id, 'status', v)} options={['Hoạt động', 'Tạm ẩn']} /></td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
}

function Input({ value, onChange, placeholder = '', type = 'text' }) {
    return <input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="w-full bg-white border border-slate-200 rounded-2xl py-3 px-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400" />;
}

function Select({ value, onChange, options }) {
    return <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-white border border-slate-200 rounded-2xl py-3 px-4 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400">{options.map((option) => <option key={option}>{option}</option>)}</select>;
}
