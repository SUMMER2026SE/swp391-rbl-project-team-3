import React, { useState, useEffect } from 'react';
import { AppointmentModel } from '../../models/AppointmentModel';
import { Clock, PlayCircle } from 'lucide-react';

export default function ScheduleWaitingList({ doctorId, onStartExam }) {
  // Mock today's date
  const today = "2026-06-05";

  const [todayAppointments, setTodayAppointments] = useState([]);

  useEffect(() => {
    const fetchAppointments = () => {
      const all = AppointmentModel.getAll();
      // Lọc theo đúng bác sĩ và loại bỏ lịch đã hủy để hiển thị danh sách chờ khám thực tế
      const filtered = all.filter(apt => apt?.doctorId === doctorId && apt?.status !== 'Đã hủy');
      setTodayAppointments(filtered.sort((a, b) => a?.time.localeCompare(b?.time)));
    };

    fetchAppointments();
    window.addEventListener('appointments-updated', fetchAppointments);
    return () => {
      window.removeEventListener('appointments-updated', fetchAppointments);
    };
  }, [doctorId]);

  const handleStartExam = (apt) => {
    if (onStartExam) {
      onStartExam(apt);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Đã xác nhận':
      case 'Đang chờ':
        return <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-xs font-bold border border-amber-200/50">Đang chờ</span>;
      case 'Đã khám':
        return <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200/50">Đã khám</span>;
      case 'Chờ xác nhận':
        return <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold border border-slate-200/50">Chưa xác nhận</span>;
      default:
        return <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold border border-slate-200/50">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-extrabold text-2xl md:text-3xl text-slate-900 tracking-tight">Hàng chờ & Lịch khám</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">Danh sách bệnh nhân trong ngày: {today}</p>
      </div>

      <div className="backdrop-blur-xl bg-white/40 border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-[2rem] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200/50">
                <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Thời gian</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Bệnh nhân</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Dịch vụ</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Trạng thái</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/50">
              {todayAppointments.map((apt) => (
                <tr key={apt?.id} className="hover:bg-white/60 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2 text-slate-700 font-bold">
                      <Clock className="w-4 h-4 text-teal-500" />
                      {apt?.time}
                    </div>
                  </td>
                  <td className="py-4 px-6 font-bold text-slate-900">
                    {apt?.patientName}
                  </td>
                  <td className="py-4 px-6 text-slate-600 text-sm font-medium">
                    {apt?.service}
                  </td>
                  <td className="py-4 px-6">
                    {getStatusBadge(apt?.status)}
                  </td>
                  <td className="py-4 px-6 text-right">
                    {apt?.status !== 'Đã hủy' && (
                      <button 
                        onClick={() => handleStartExam(apt)}
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md shadow-teal-500/20 hover:shadow-lg hover:shadow-teal-500/30 active:scale-95 transition-all"
                      >
                        <PlayCircle className="w-4 h-4" />
                        Bắt đầu khám
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {todayAppointments.length === 0 && (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-500 font-medium">
                    Không có lịch khám nào trong ngày hôm nay.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
