import React from 'react';
import { Clock, PlayCircle, Eye, CalendarDays } from 'lucide-react';
import { GLASS_BASE } from '../common/GlassCard';

export default function ScheduleWaitingList({ doctorId, onStartExam, appointments = [] }) {
  const todayAppointments = (Array.isArray(appointments) ? [...appointments] : [])?.filter?.(
    (apt) => String(apt?.doctorId || apt?.doctor_id) === String(doctorId) && apt?.status !== 'Đã hủy'
  )
    .sort((a, b) => (a?.time || '').localeCompare(b?.time || ''));

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
        return <span className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 font-bold px-3 py-1 rounded-full backdrop-blur-md text-xs">Đã khám</span>;
      case 'Chờ xác nhận':
        return <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold border border-slate-200/50">Chưa xác nhận</span>;
      default:
        return <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold border border-slate-200/50">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className={`${GLASS_BASE} overflow-hidden`}>
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
              {todayAppointments?.map?.((apt) => {
                const isCompleted = apt?.status === 'Đã khám';
                return (
                  <tr 
                    key={apt?.id} 
                    className={`transition-colors ${
                      isCompleted 
                        ? 'bg-slate-50/30 opacity-70 hover:bg-slate-50/50' 
                        : 'hover:bg-white/60'
                    }`}
                  >
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
                      {isCompleted ? (
                        <button 
                          onClick={() => handleStartExam(apt)}
                          className="inline-flex items-center justify-center gap-2 bg-white/40 hover:bg-white/80 border border-slate-200/50 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:shadow active:scale-95 transition-all cursor-pointer backdrop-blur-md"
                        >
                          <Eye className="w-4 h-4 text-emerald-500" />
                          Xem lại hồ sơ
                        </button>
                      ) : (
                        apt?.status !== 'Đã hủy' && (
                          <button 
                            onClick={() => handleStartExam(apt)}
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md shadow-teal-500/20 hover:shadow-lg hover:shadow-teal-500/30 active:scale-95 transition-all"
                          >
                            <PlayCircle className="w-4 h-4" />
                            Bắt đầu khám
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                );
              })}
              {todayAppointments.length === 0 && (
                <tr>
                  <td colSpan="5" className="py-14 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <div className="w-14 h-14 rounded-2xl bg-white/50 border border-white/60 flex items-center justify-center mb-3 shadow-inner">
                        <CalendarDays className="w-7 h-7 text-slate-300" />
                      </div>
                      <p className="text-sm font-semibold text-slate-600">Không có lịch khám nào</p>
                      <p className="text-xs text-slate-400 mt-1">Các lịch hẹn của bệnh nhân sẽ xuất hiện tại đây.</p>
                    </div>
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
