import React, { useState, useEffect } from 'react';
import { Users, Clock, Star, Stethoscope } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { AppointmentModel } from '../../models/AppointmentModel';
import { GLASS_BASE, GLASS_HOVER } from '../common/GlassCard';

export default function DashboardOverview({ doctorId }) {
  // Today's date in the LOCAL timezone as YYYY-MM-DD. `en-CA` locale formats as
  // YYYY-MM-DD, and toLocaleDateString reads local time — so it stays correct in
  // UTC+7 (Vietnam) where toISOString().split('T')[0] would report yesterday in
  // the morning. Appointment `date` values are stored as local YYYY-MM-DD, so
  // this matches them directly.
  const today = new Date().toLocaleDateString('en-CA');

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

  const [successVisits, setSuccessVisits] = useState(0);
  const [workHours, setWorkHours] = useState('0 giờ');
  const [avgRating, setAvgRating] = useState('Chưa có');

  useEffect(() => {
    if (!doctorId) return;
    
    const fetchDoctorMetrics = async () => {
      // 1. Ca khám đã hoàn thành
      const { count: successCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', doctorId)
        .in('status', ['Đã khám', 'Reviewed', 'Đã thanh toán', 'COMPLETED', 'EXAMINED', 'DONE', 'PAID']);
      
      if (successCount !== null) setSuccessVisits(successCount);

      // 2. Đánh giá trung bình
      const { data: feedbacks } = await supabase
        .from('feedbacks')
        .select('rating')
        .eq('doctor_id', doctorId);
      
      if (feedbacks && feedbacks.length > 0) {
        const sum = feedbacks.reduce((acc, f) => acc + (f.rating || 0), 0);
        setAvgRating((sum / feedbacks.length).toFixed(1) + '/5');
      }

      // 3. Giờ làm việc — the CURRENT WEEK (Mon–Sun), not every confirmed shift
      // ever worked. This tile sits next to "Tổng bệnh nhân hôm nay", so an
      // all-time running total (it read "47 giờ") was taken for a short-term
      // figure. Dates are local YYYY-MM-DD, matching how `work_date` is stored.
      const toLocalYmd = (d) => d.toLocaleDateString('en-CA');
      const now = new Date();
      // getDay(): Sun=0 → shift so the week starts on Monday.
      const mondayOffset = (now.getDay() + 6) % 7;
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - mondayOffset);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const { data: shifts } = await supabase
        .from('doctor_shifts')
        .select('start_time, end_time')
        .eq('doctor_id', doctorId)
        .eq('status', 'Đã xác nhận')
        .gte('work_date', toLocalYmd(weekStart))
        .lte('work_date', toLocalYmd(weekEnd));

      const parseTimeToHours = (t) => {
        if (!t) return 0;
        const [h, m] = t.split(':').map(Number);
        return h + (m || 0) / 60;
      };
      const hours = (shifts || []).reduce((acc, s) => {
        const diff = parseTimeToHours(s.end_time) - parseTimeToHours(s.start_time);
        return acc + (diff > 0 ? diff : 0);
      }, 0);
      // Set unconditionally: a week with no confirmed shift must read "0 giờ",
      // not silently keep a stale value from a previous doctor selection.
      setWorkHours(`${Math.round(hours)} giờ`);
    };

    fetchDoctorMetrics();
  }, [doctorId]);

  const totalPatientsToday = todayAppointments.length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className={`${GLASS_BASE} ${GLASS_HOVER} p-6 relative overflow-hidden group cursor-pointer h-full flex flex-col`}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-bl-full -z-10 group-hover:bg-teal-500/10 transition-all duration-500"></div>
          <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600 mb-4 shadow-inner border border-teal-100/50">
            <Users className="w-6 h-6" />
          </div>
          <p className="text-xs text-slate-900 font-medium uppercase tracking-wider mb-1">Tổng bệnh nhân hôm nay</p>
          <p className="font-extrabold text-3xl text-slate-900">{totalPatientsToday}</p>
        </div>

        <div className={`${GLASS_BASE} ${GLASS_HOVER} p-6 relative overflow-hidden group cursor-pointer h-full flex flex-col`}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-fuchsia-500/5 rounded-bl-full -z-10 group-hover:bg-fuchsia-500/10 transition-all duration-500"></div>
          <div className="w-12 h-12 rounded-2xl bg-fuchsia-50 flex items-center justify-center text-fuchsia-600 mb-4 shadow-inner border border-fuchsia-100/50">
            <Stethoscope className="w-6 h-6" />
          </div>
          <p className="text-xs text-slate-900 font-medium uppercase tracking-wider mb-1">Ca khám đã hoàn thành</p>
          <p className="font-extrabold text-3xl text-slate-900">{successVisits}</p>
        </div>

        <div className={`${GLASS_BASE} ${GLASS_HOVER} p-6 relative overflow-hidden group cursor-pointer h-full flex flex-col`}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-bl-full -z-10 group-hover:bg-violet-500/10 transition-all duration-500"></div>
          <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center text-violet-600 mb-4 shadow-inner border border-violet-100/50">
            <Clock className="w-6 h-6" />
          </div>
          <p className="text-xs text-slate-900 font-medium uppercase tracking-wider mb-1">Giờ làm tuần này</p>
          <p className="font-extrabold text-3xl text-slate-900">{workHours}</p>
        </div>

        <div className={`${GLASS_BASE} ${GLASS_HOVER} p-6 relative overflow-hidden group cursor-pointer h-full flex flex-col`}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-bl-full -z-10 group-hover:bg-orange-500/10 transition-all duration-500"></div>
          <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 mb-4 shadow-inner border border-orange-100/50">
            <Star className="w-6 h-6" />
          </div>
          <p className="text-xs text-slate-900 font-medium uppercase tracking-wider mb-1">Đánh giá trung bình</p>
          <p className="font-extrabold text-3xl text-slate-900">{avgRating}</p>
        </div>
      </div>
    </div>
  );
}
