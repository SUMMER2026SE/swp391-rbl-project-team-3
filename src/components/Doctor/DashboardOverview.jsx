import React, { useState, useEffect } from 'react';
import { Users, Brain, CheckCircle2, AlertCircle } from 'lucide-react';
import { AppointmentModel } from '../../models/AppointmentModel';

export default function DashboardOverview({ doctorId }) {
  // Mock today's date based on mock data
  const today = "2026-06-05";
  
  const [todayAppointments, setTodayAppointments] = useState([]);

  useEffect(() => {
    const fetchAppointments = async () => {
      const all = await AppointmentModel.getAll();
      setTodayAppointments(
        all?.filter?.(apt => (apt?.doctorId === doctorId || apt?.doctor_id === doctorId) && apt?.date === today)
      );
    };

    fetchAppointments();
    window.addEventListener('appointments-updated', fetchAppointments);
    return () => {
      window.removeEventListener('appointments-updated', fetchAppointments);
    };
  }, [doctorId]);

  const totalPatientsToday = todayAppointments.length;
  
  const waitingPatients = todayAppointments?.filter?.(
    apt => apt?.status === 'Đã xác nhận' || apt?.status === 'Chờ xác nhận' || apt?.status === 'Đang chờ'
  ).length;

  const completedPatients = todayAppointments?.filter?.(apt => apt?.status === 'Đã khám').length;

  // Mock pending AI results
  const pendingAIResults = 2;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-extrabold text-2xl md:text-3xl text-slate-900 tracking-tight">Tổng quan</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Xin chào Bác sĩ, chúc bạn một ngày làm việc hiệu quả.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/40 backdrop-blur-2xl border border-white/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.07),inset_0_0_20px_rgba(255,255,255,0.5)] dark:bg-slate-900/40 dark:border-slate-700/50 transition-all duration-500 ease-out rounded-[2rem] p-6 relative overflow-hidden group hover:scale-[1.02] cursor-pointer">
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-bl-full -z-10 group-hover:bg-teal-500/10 transition-all duration-500"></div>
          <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600 mb-4 shadow-inner border border-teal-100/50">
            <Users className="w-6 h-6" />
          </div>
          <p className="text-xs text-slate-900 font-medium uppercase tracking-wider mb-1">Tổng bệnh nhân hôm nay</p>
          <p className="font-extrabold text-3xl text-slate-900">{totalPatientsToday}</p>
        </div>

        <div className="bg-white/40 backdrop-blur-2xl border border-white/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.07),inset_0_0_20px_rgba(255,255,255,0.5)] dark:bg-slate-900/40 dark:border-slate-700/50 transition-all duration-500 ease-out rounded-[2rem] p-6 relative overflow-hidden group hover:scale-[1.02] cursor-pointer">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full -z-10 group-hover:bg-amber-500/10 transition-all duration-500"></div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 mb-4 shadow-inner border border-amber-100/50">
            <AlertCircle className="w-6 h-6" />
          </div>
          <p className="text-xs text-slate-900 font-medium uppercase tracking-wider mb-1">Đang chờ khám</p>
          <p className="font-extrabold text-3xl text-slate-900">{waitingPatients}</p>
        </div>

        <div className="bg-white/40 backdrop-blur-2xl border border-white/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.07),inset_0_0_20px_rgba(255,255,255,0.5)] dark:bg-slate-900/40 dark:border-slate-700/50 transition-all duration-500 ease-out rounded-[2rem] p-6 relative overflow-hidden group hover:scale-[1.02] cursor-pointer">
          <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-bl-full -z-10 group-hover:bg-sky-500/10 transition-all duration-500"></div>
          <div className="w-12 h-12 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-600 mb-4 shadow-inner border border-sky-100/50">
            <Brain className="w-6 h-6" />
          </div>
          <p className="text-xs text-slate-900 font-medium uppercase tracking-wider mb-1">Kết quả AI chờ duyệt</p>
          <p className="font-extrabold text-3xl text-slate-900">{pendingAIResults}</p>
        </div>

        <div className="bg-white/40 backdrop-blur-2xl border border-white/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.07),inset_0_0_20px_rgba(255,255,255,0.5)] dark:bg-slate-900/40 dark:border-slate-700/50 transition-all duration-500 ease-out rounded-[2rem] p-6 relative overflow-hidden group hover:scale-[1.02] cursor-pointer">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full -z-10 group-hover:bg-emerald-500/10 transition-all duration-500"></div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-4 shadow-inner border border-emerald-100/50">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <p className="text-xs text-slate-900 font-medium uppercase tracking-wider mb-1">Đã hoàn thành</p>
          <p className="font-extrabold text-3xl text-slate-900">{completedPatients}</p>
        </div>
      </div>
    </div>
  );
}
