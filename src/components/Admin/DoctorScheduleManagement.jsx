import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, Plus, Save, Search, RefreshCw, Trash2, Clock } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { vi } from 'date-fns/locale';
import { hmToDate } from '../../utils/dateAdapters';
import { useDoctors } from '../../hooks/useDoctors';
import { DoctorScheduleModel } from '../../models/DoctorScheduleModel';
import GlassCheckbox from '../common/GlassCheckbox';
import GlassSelect from '../common/GlassSelect';

// Shared Liquid Glass field styling for the DatePicker inputs.
// Higher-contrast resting state so fields "pop" out of the glass background.
const GLASS_PICKER_CLS = 'w-full bg-white/80 border border-slate-200/80 text-slate-800 text-sm rounded-xl shadow-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 block p-3 outline-none transition-all placeholder-slate-400';

// ── Date/Time <-> string adapters ─────────────────────────────────────────────
// react-datepicker works with Date objects, but form state (and the backend)
// stay on the existing string contract ('yyyy-MM-dd' / 'HH:mm'). We convert only
// at the input boundary, so all validation & submit logic below is untouched.
const dateStrToDate = (s) => {
    if (!s) return null;
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d); // local midnight — mirrors native <input type="date">
};
const dateToDateStr = (d) => {
    if (!d) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};
const timeToTimeStr = (d) => {
    if (!d) return '';
    const h = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${mi}`;
};

const getVietnameseDayName = (dateString) => {
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    return days[new Date(dateString).getDay()];
};

const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const DAYS_OF_WEEK = [
    { label: 'T2', value: 1 },
    { label: 'T3', value: 2 },
    { label: 'T4', value: 3 },
    { label: 'T5', value: 4 },
    { label: 'T6', value: 5 },
    { label: 'T7', value: 6 },
    { label: 'CN', value: 0 },
];

export default function DoctorScheduleManagement() {
    const { doctors, loading: docsLoading, error: docsError } = useDoctors();
    
    const [schedules, setSchedules] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [form, setForm] = useState({
        doctorId: '',
        startDate: '',
        endDate: '',
        selectedDays: [1, 2, 3, 4, 5],
        room: 'Phòng khám 1',
        status: 'Đã phân công'
    });
    // A doctor can work several shifts per day (morning / afternoon / …). Each holds
    // Date objects (react-datepicker native); we format to 'HH:mm' at submit time.
    const [shifts, setShifts] = useState([{ id: Date.now(), startTime: null, endTime: null }]);
    const [searchTerm, setSearchTerm] = useState('');

    const handleAddShift = () =>
        setShifts(prev => [...prev, { id: Date.now(), startTime: null, endTime: null }]);
    const handleRemoveShift = (id) =>
        setShifts(prev => (prev.length > 1 ? prev.filter(s => s.id !== id) : prev));
    const handleShiftChange = (id, field, date) =>
        setShifts(prev => prev.map(s => (s.id === id ? { ...s, [field]: date } : s)));

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
        if (!form.startDate || !form.endDate || !form.doctorId) {
            alert('Vui lòng chọn đầy đủ bác sĩ và khoảng thời gian.');
            return;
        }
        if (form.startDate > form.endDate) {
            alert('Ngày bắt đầu không được lớn hơn ngày kết thúc.');
            return;
        }
        if (form.startDate < getTodayString()) {
            alert('Không thể chọn ngày bắt đầu trong quá khứ.');
            return;
        }
        if (form.selectedDays.length === 0) {
            alert('Vui lòng chọn ít nhất một thứ trong tuần.');
            return;
        }

        // Format the shift Date objects → 'HH:mm' strings (backend contract) and
        // drop any incomplete rows.
        const cleanShifts = shifts
            .map(s => ({ start_time: timeToTimeStr(s.startTime), end_time: timeToTimeStr(s.endTime) }))
            .filter(s => s.start_time && s.end_time);

        if (cleanShifts.length === 0) {
            alert('Vui lòng nhập đầy đủ giờ cho ít nhất một ca làm việc.');
            return;
        }
        for (const s of cleanShifts) {
            if (s.start_time >= s.end_time) {
                alert(`Giờ bắt đầu (${s.start_time}) phải nhỏ hơn giờ kết thúc (${s.end_time}).`);
                return;
            }
        }

        const selectedDoc = doctors.find(d => d.id === form.doctorId);
        const docName = selectedDoc ? selectedDoc.name : 'Unknown';

        const newShifts = [];
        let currDate = new Date(form.startDate);
        const endD = new Date(form.endDate);

        while (currDate <= endD) {
            if (form.selectedDays.includes(currDate.getDay())) {
                const dateStr = currDate.toISOString().split('T')[0];
                // One row per (matching day × shift).
                for (const s of cleanShifts) {
                    newShifts.push({
                        doctor_id: form.doctorId,
                        doctor_name: docName,
                        work_date: dateStr,
                        day_of_week: getVietnameseDayName(dateStr),
                        start_time: s.start_time,
                        end_time: s.end_time,
                        room: form.room,
                        status: form.status
                    });
                }
            }
            currDate.setDate(currDate.getDate() + 1);
        }

        if (newShifts.length === 0) {
            alert('Không có ngày nào phù hợp trong khoảng thời gian đã chọn.');
            return;
        }

        try {
            const addedShifts = await DoctorScheduleModel.createShifts(newShifts);
            setSchedules([...addedShifts, ...schedules]);
            setForm(prev => ({ ...prev, startDate: '', endDate: '' }));
            setShifts([{ id: Date.now(), startTime: null, endTime: null }]);
            alert(`Đã tạo thành công ${addedShifts.length} ca làm việc!`);
        } catch (e) {
            alert('Lỗi khi lưu lịch làm việc: ' + e.message);
        }
    };

    const updateSchedule = async (id, field, value) => {
        try {
            let updates = {};
            if (field === 'date') {
                if (value < getTodayString()) {
                    alert('Không thể cập nhật sang ngày trong quá khứ.');
                    return;
                }
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

    const deleteSchedule = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn thu hồi (xóa) lịch làm việc này không?')) return;
        try {
            await DoctorScheduleModel.deleteShift(id);
            setSchedules(schedules.filter(s => s.id !== id));
        } catch (e) {
            alert('Lỗi khi thu hồi lịch: ' + e.message);
        }
    };

    const filteredSchedules = schedules?.filter?.((schedule) =>
        schedule.doctor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        schedule.room?.toLowerCase().includes(searchTerm.toLowerCase()));

    const groupedSchedules = React.useMemo(() => {
        const groups = [];
        const sorted = [...(filteredSchedules || [])].sort((a, b) => new Date(a.work_date) - new Date(b.work_date));

        sorted.forEach(s => {
            const existingGroup = groups.find(g => 
                g.doctor_id === s.doctor_id &&
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
                doctor_name: s.doctor_name,
                start_time: s.start_time,
                end_time: s.end_time,
                room: s.room,
                status: s.status,
                shifts: [s]
            });
        });

        return groups.map(g => {
            const minDate = g.shifts[0].work_date;
            const maxDate = g.shifts[g.shifts.length - 1].work_date;
            
            const days = [...new Set(g.shifts.map(s => s.day_of_week))];
            const dayOrder = { 'Thứ Hai': 1, 'Thứ Ba': 2, 'Thứ Tư': 3, 'Thứ Năm': 4, 'Thứ Sáu': 5, 'Thứ Bảy': 6, 'Chủ Nhật': 7 };
            days.sort((a, b) => dayOrder[a] - dayOrder[b]);

            g.dateRange = minDate === maxDate ? minDate : `${minDate} đến ${maxDate}`;
            g.daysStr = days.join(', ');
            return g;
        });
    }, [filteredSchedules]);

    const updateGroup = async (group, field, value) => {
        try {
            let updates = {};
            if (field === 'doctorId') {
                updates.doctor_id = value;
                const doc = doctors.find(d => d.id === value);
                if (doc) updates.doctor_name = doc.name;
            } else if (field === 'startTime') {
                updates.start_time = value;
            } else if (field === 'endTime') {
                updates.end_time = value;
            } else if (field === 'room' || field === 'status') {
                updates[field] = value;
            }

            await Promise.all(group.shifts.map(s => DoctorScheduleModel.updateShift(s.id, updates)));
            fetchSchedules();
        } catch (e) {
            alert('Lỗi khi cập nhật lịch: ' + e.message);
        }
    };

    const deleteGroup = async (group) => {
        if (!window.confirm(`Bạn có chắc chắn muốn thu hồi toàn bộ ${group.shifts.length} lịch này không?`)) return;
        try {
            await Promise.all(group.shifts.map(s => DoctorScheduleModel.deleteShift(s.id)));
            fetchSchedules();
        } catch (e) {
            alert('Lỗi khi thu hồi lịch: ' + e.message);
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="relative z-20 backdrop-blur-xl bg-white/75 border border-white/80 shadow-[0_15px_40px_rgba(0,0,0,0.05)] rounded-[2rem] p-8">
                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-200/50">
                    <Plus className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-extrabold text-lg text-slate-800">Tạo lịch làm việc</h3>
                </div>
                <div className="flex flex-col gap-6">
                    {/* ── Group 1 · Thông tin chung ─────────────────────────────── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col">
                            <span className="text-xs font-semibold text-slate-500 mb-1">Bác sĩ</span>
                            <Select value={form.doctorId} onChange={(v) => setForm({ ...form, doctorId: v })} options={doctors.map(d => ({ label: d.name, value: d.id }))} loading={docsLoading} error={docsError} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-semibold text-slate-500 mb-1">Phòng khám</span>
                            <Select value={form.room} onChange={(v) => setForm({ ...form, room: v })} options={['Phòng khám 1', 'Phòng khám 2', 'Phòng khám 3', 'Phòng online'].map(r => ({ label: r, value: r }))} />
                        </div>
                    </div>

                    {/* ── Group 2 · Chu kỳ lặp ──────────────────────────────────── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col">
                            <span className="text-xs font-semibold text-slate-500 mb-1">Từ ngày</span>
                            <DatePicker
                                selected={dateStrToDate(form.startDate)}
                                onChange={(date) => setForm({ ...form, startDate: dateToDateStr(date) })}
                                locale={vi}
                                dateFormat="dd/MM/yyyy"
                                minDate={new Date()}
                                placeholderText="dd/mm/yyyy"
                                className={GLASS_PICKER_CLS}
                            />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-semibold text-slate-500 mb-1">Đến ngày</span>
                            <DatePicker
                                selected={dateStrToDate(form.endDate)}
                                onChange={(date) => setForm({ ...form, endDate: dateToDateStr(date) })}
                                locale={vi}
                                dateFormat="dd/MM/yyyy"
                                minDate={dateStrToDate(form.startDate) || new Date()}
                                placeholderText="dd/mm/yyyy"
                                className={GLASS_PICKER_CLS}
                            />
                        </div>
                        <div className="md:col-span-2 flex flex-col">
                            <span className="text-xs font-semibold text-slate-500 mb-2">Áp dụng cho các ngày trong tuần:</span>
                            <div className="flex flex-wrap gap-3 items-center">
                                {DAYS_OF_WEEK.map(day => (
                                    <label key={day.value} className="flex items-center gap-1 cursor-pointer">
                                        <GlassCheckbox
                                            checked={form.selectedDays.includes(day.value)}
                                            onChange={(e) => {
                                                const newDays = e.target.checked
                                                    ? [...form.selectedDays, day.value]
                                                    : form.selectedDays.filter(d => d !== day.value);
                                                setForm({ ...form, selectedDays: newDays });
                                            }}
                                        />
                                        <span className="text-sm font-semibold text-slate-700">{day.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ── Group 3 · Các ca làm việc (dynamic) ───────────────────── */}
                    <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-200/60 col-span-full">
                        <div className="flex items-center gap-2 mb-4">
                            <Clock className="w-5 h-5 text-emerald-600" />
                            <h4 className="text-sm font-bold text-slate-700">Các ca làm việc</h4>
                        </div>
                        <div className="flex flex-col gap-3">
                            {shifts.map((shift) => (
                                <div key={shift.id} className="flex flex-col sm:flex-row gap-3 sm:items-end">
                                    <div className="flex flex-col flex-1">
                                        <span className="text-xs font-semibold text-slate-500 mb-1">Giờ bắt đầu</span>
                                        <DatePicker
                                            selected={shift.startTime}
                                            onChange={(date) => handleShiftChange(shift.id, 'startTime', date)}
                                            showTimeSelect
                                            showTimeSelectOnly
                                            timeIntervals={30}
                                            timeCaption="Giờ"
                                            dateFormat="HH:mm"
                                            locale={vi}
                                            placeholderText="HH:mm"
                                            className={GLASS_PICKER_CLS}
                                        />
                                    </div>
                                    <div className="flex flex-col flex-1">
                                        <span className="text-xs font-semibold text-slate-500 mb-1">Giờ kết thúc</span>
                                        <DatePicker
                                            selected={shift.endTime}
                                            onChange={(date) => handleShiftChange(shift.id, 'endTime', date)}
                                            showTimeSelect
                                            showTimeSelectOnly
                                            timeIntervals={30}
                                            timeCaption="Giờ"
                                            dateFormat="HH:mm"
                                            locale={vi}
                                            placeholderText="HH:mm"
                                            className={GLASS_PICKER_CLS}
                                        />
                                    </div>
                                    {shifts.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveShift(shift.id)}
                                            title="Xóa ca này"
                                            className="shrink-0 h-[46px] px-3 flex items-center justify-center text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={handleAddShift}
                            className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-emerald-300 text-emerald-600 font-semibold text-sm rounded-xl hover:bg-emerald-50 transition-colors"
                        >
                            <Plus className="w-4 h-4" /> Thêm ca làm việc
                        </button>
                    </div>

                    {/* ── Group 4 · Submit footer ───────────────────────────────── */}
                    <div className="flex justify-end pt-4 border-t border-slate-200/50">
                        <button onClick={createSchedule} className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-sky-500 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 hover:scale-105 transition-transform">
                            <Save className="w-4 h-4" /> Tạo lịch
                        </button>
                    </div>
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
                        <thead className="bg-slate-100/50"><tr><th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase">Bác sĩ</th><th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase">Ngày</th><th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase">Thứ</th><th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase">Giờ</th><th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase">Phòng</th><th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase">Trạng thái</th><th className="px-4 py-5 text-xs font-bold text-slate-500 uppercase text-center">Thao tác</th></tr></thead>
                        <tbody className="divide-y divide-slate-100">
                        {groupedSchedules?.map?.((group) => (
                            <tr key={group.id} className="hover:bg-slate-50/80">
                                <td className="px-8 py-5"><Select value={group.doctor_id || ''} onChange={(v) => updateGroup(group, 'doctorId', v)} options={doctors.map(d => ({ label: d.name, value: d.id }))} /></td>
                                <td className="px-8 py-5"><span className="text-sm text-slate-600 font-medium">{group.dateRange}</span></td>
                                <td className="px-8 py-5"><span className="font-bold text-slate-700 text-xs">{group.daysStr}</span></td>
                                <td className="px-8 py-5"><div className="grid grid-cols-2 gap-2">
                                    <DatePicker
                                        selected={hmToDate(group.start_time ? group.start_time.slice(0, 5) : '')}
                                        onChange={(date) => updateGroup(group, 'startTime', timeToTimeStr(date))}
                                        showTimeSelect showTimeSelectOnly timeIntervals={30} timeCaption="Giờ"
                                        dateFormat="HH:mm" locale={vi} placeholderText="HH:mm"
                                        portalId="root-portal"
                                        className="w-full bg-white/80 border border-slate-200/80 text-slate-800 shadow-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none transition-all rounded-lg p-2 text-sm"
                                    />
                                    <DatePicker
                                        selected={hmToDate(group.end_time ? group.end_time.slice(0, 5) : '')}
                                        onChange={(date) => updateGroup(group, 'endTime', timeToTimeStr(date))}
                                        showTimeSelect showTimeSelectOnly timeIntervals={30} timeCaption="Giờ"
                                        dateFormat="HH:mm" locale={vi} placeholderText="HH:mm"
                                        portalId="root-portal"
                                        className="w-full bg-white/80 border border-slate-200/80 text-slate-800 shadow-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none transition-all rounded-lg p-2 text-sm"
                                    />
                                </div></td>
                                <td className="px-8 py-5"><Select value={group.room} onChange={(v) => updateGroup(group, 'room', v)} options={['Phòng khám 1', 'Phòng khám 2', 'Phòng khám 3', 'Phòng online'].map(r => ({ label: r, value: r }))} /></td>
                                <td className="px-8 py-5"><Select value={group.status} onChange={(v) => updateGroup(group, 'status', v)} options={['Đã phân công', 'Đã xác nhận', 'Đã hủy'].map(s => ({ label: s, value: s }))} /></td>
                                <td className="px-4 py-5 text-center">
                                    <button 
                                        onClick={() => deleteGroup(group)}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                        title={`Thu hồi ${group.shifts.length} lịch`}
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
}

function Select({ value, onChange, options, loading, error }) {
    const opts = error
        ? [{ value: '', label: `Lỗi: ${String(error)}` }]
        : loading
        ? [{ value: '', label: 'Đang tải...' }]
        : (options || []);
    return (
        <GlassSelect
            value={value}
            onChange={onChange}
            options={opts}
            placeholder="Trống"
            className="w-full"
            buttonClassName="py-3 px-4 text-sm font-semibold"
        />
    );
}
