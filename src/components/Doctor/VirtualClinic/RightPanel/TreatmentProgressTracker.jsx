import React, { useMemo, useState } from 'react';
import { Activity, CalendarDays, CheckCircle2, Plus, Save } from 'lucide-react';

const defaultProgress = [
    {
        id: 'tp-01',
        date: '2026-06-01',
        title: 'Khám lần đầu',
        status: 'Đã ghi nhận',
        note: 'Da đỏ vùng má, ngứa nhẹ, hàng rào bảo vệ da yếu.',
    },
    {
        id: 'tp-02',
        date: '2026-06-03',
        title: 'Theo dõi sau điều trị',
        status: 'Đang theo dõi',
        note: 'Mức độ đỏ giảm, bệnh nhân đáp ứng tốt với kem bôi.',
    },
];

export default function TreatmentProgressTracker({ appointment }) {
    const storageKey = useMemo(
        () => `treatment-progress-${appointment?.id || appointment?.patientId || 'default'}`,
        [appointment]
    );

    const [progressList, setProgressList] = useState(() => {
        const saved = localStorage.getItem(storageKey);
        return saved ? JSON.parse(saved) : defaultProgress;
    });

    const [form, setForm] = useState({
        title: 'Theo dõi tiến trình điều trị',
        status: 'Đang theo dõi',
        note: '',
    });

    const saveProgress = (nextList) => {
        setProgressList(nextList);
        localStorage.setItem(storageKey, JSON.stringify(nextList));
    };

    const handleAddProgress = () => {
        if (!form.note.trim()) {
            alert('Vui lòng nhập ghi chú tiến trình điều trị.');
            return;
        }

        const newProgress = {
            id: `tp-${Date.now()}`,
            date: new Date().toISOString().slice(0, 10),
            title: form.title,
            status: form.status,
            note: form.note.trim(),
        };

        saveProgress([newProgress, ...progressList]);
        setForm({ title: 'Theo dõi tiến trình điều trị', status: 'Đang theo dõi', note: '' });
    };

    const getStatusClass = (status) => {
        if (status === 'Hoàn thành') return 'bg-emerald-50 text-emerald-700 border-emerald-200/60';
        if (status === 'Cần theo dõi thêm') return 'bg-amber-50 text-amber-700 border-amber-200/60';
        return 'bg-sky-50 text-sky-700 border-sky-200/60';
    };

    return (
        <div className="backdrop-blur-xl bg-white/40 border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-[2rem] p-6 mb-6">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-200/40">
                <Activity className="w-5 h-5 text-teal-600" />
                <h3 className="font-extrabold text-lg text-slate-900">Theo dõi tiến trình điều trị</h3>
            </div>
            <div className="space-y-3 mb-5 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                {progressList?.map?.((item) => (
                    <div key={item.id} className="p-4 rounded-2xl border border-slate-200/60 bg-white/60 shadow-sm">
                        <div className="flex justify-between items-start gap-3 mb-2">
                            <div>
                                <h4 className="font-extrabold text-sm text-slate-900">{item.title}</h4>
                                <p className="text-[11px] text-slate-400 font-bold flex items-center gap-1 mt-1">
                                    <CalendarDays className="w-3.5 h-3.5" />
                                    {item.date}
                                </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-[11px] font-bold border ${getStatusClass(item.status)}`}>
                {item.status}
              </span>
                        </div>
                        <p className="text-xs text-slate-600 font-medium leading-relaxed">{item.note}</p>
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-semibold outline-none transition-all focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10"
                    placeholder="Tiêu đề tiến trình"
                />
                <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-semibold outline-none transition-all focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10"
                >
                    <option>Đang theo dõi</option>
                    <option>Cần theo dõi thêm</option>
                    <option>Hoàn thành</option>
                </select>
            </div>
            <textarea
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-semibold outline-none transition-all resize-none placeholder-slate-400 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10"
                placeholder="Nhập ghi chú: mức độ cải thiện, phản ứng thuốc, triệu chứng còn lại..."
                rows="3"
            />
            <button
                type="button"
                onClick={handleAddProgress}
                className="mt-3 w-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white py-3 px-4 rounded-xl font-bold shadow-md shadow-teal-500/20 hover:shadow-lg hover:shadow-teal-500/30 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
                <Save className="w-4 h-4" />
                Lưu tiến trình điều trị
            </button>
        </div>
    );
}
