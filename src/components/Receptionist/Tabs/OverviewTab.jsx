// Receptionist » Overview tab — KPIs + a light glance at the queue & new
// requests (front-desk only). Extracted verbatim from ReceptionistDashboard.jsx
// (M1 god-component split, Phase 1). Pure presentation: all data/handlers arrive
// via props; no state, API calls, or Realtime here.
import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Users, CheckSquare, Wallet, ArrowRight, Clock, UserCheck, CalendarClock, Plus } from 'lucide-react';
import { APT_STATUS, TODAY_STR } from '../receptionistData';

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', damping: 25, stiffness: 110 } },
};
const stagger = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };

export default function OverviewTab({ user, kpi, todays, onGoTab, onArrive, onAdd }) {
  const now = new Date();
  const nextUp = todays
    .filter((a) => a.status === APT_STATUS.BOOKED || a.status === APT_STATUS.CHECKED_IN)
    .filter((a) => {
      // Hide booked (not yet checked-in) appointments whose time has passed
      if (a.status === APT_STATUS.BOOKED && a.time) {
        const [h, m] = a.time.split(':').map(Number);
        const aptDate = new Date();
        aptDate.setHours(h, m, 0, 0);
        if (now > aptDate) return false;
      }
      return true;
    })
    .sort((a, b) => a.time.localeCompare(b.time))
    .slice(0, 6);

  const cards = [
    { label: 'Đang chờ khám', value: kpi.checkedIn, hint: 'người', icon: Users, tone: 'sky', tab: 'queue' },
    { label: 'Lịch hôm nay', value: kpi.todayTotal, hint: 'ca khám', icon: CheckSquare, tone: 'emerald', tab: 'queue' },
    { label: 'Chờ thanh toán', value: kpi.toCollect, hint: 'hóa đơn', icon: Wallet, tone: 'amber', tab: 'billing' },
    { label: 'Chờ tiếp đón', value: kpi.toReceive, hint: 'chưa đến', icon: CalendarClock, tone: 'rose', tab: 'queue' },
  ];
  const tones = {
    sky: 'bg-sky-50 text-sky-600 border-sky-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-8">
      <motion.div variants={fadeInUp} className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Sun className="w-6 h-6 text-amber-500 shrink-0" strokeWidth={1.5} />
          <h2 className="font-black text-2xl md:text-3xl text-gray-900 tracking-tight">Chào, {user?.name || 'Lễ tân'}</h2>
        </div>
        <p className="text-sm text-slate-500 font-medium">Tổng quan hoạt động quầy lễ tân hôm nay ({TODAY_STR})</p>
      </motion.div>

      <motion.section variants={fadeInUp} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <button
              key={c.label}
              onClick={() => onGoTab(c.tab)}
              className="text-left backdrop-blur-md bg-white/40 border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-[2rem] p-6 relative overflow-hidden group hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 cursor-pointer"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl border shadow-inner ${tones[c.tone]}`}><Icon className="w-6 h-6" /></div>
              </div>
              <h3 className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">{c.label}</h3>
              <div className="flex items-baseline gap-1.5">
                <span className="font-black text-4xl text-slate-900">{c.value}</span>
                <span className="text-xs text-slate-400 font-medium">{c.hint}</span>
              </div>
            </button>
          );
        })}
      </motion.section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next up in queue */}
        <motion.div variants={fadeInUp} className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-lg text-slate-900">Sắp tới trong hàng chờ</h3>
            <button onClick={() => onGoTab('queue')} className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-transparent border-none cursor-pointer flex items-center gap-1">
              Mở Bàn Điều Phối <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="backdrop-blur-md bg-white/40 border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-[2rem] overflow-hidden">
            {nextUp.length === 0 ? (
              <div className="p-10 text-center text-slate-400">
                <Clock className="w-7 h-7 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-semibold">Chưa có bệnh nhân nào trong hàng chờ hôm nay.</p>
              </div>
            ) : (
              nextUp.map((apt) => {
                const arrived = apt.status === APT_STATUS.CHECKED_IN;
                return (
                  <div key={apt.key} className="p-4 border-b border-slate-200/40 last:border-0 flex items-center justify-between gap-3 hover:bg-white/50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-50 to-teal-50 border border-sky-100 flex items-center justify-center font-black text-sm text-teal-700 shrink-0">
                        {apt.patientName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-slate-800 truncate">{apt.patientName}</h4>
                        <p className="text-[11px] text-slate-400 font-medium truncate">
                          <span className="font-bold text-slate-500">{apt.time}</span> · {apt.serviceName} · <span className="text-teal-600">{apt.doctorName}</span>
                        </p>
                      </div>
                    </div>
                    {arrived ? (
                      <span className="px-3 py-1.5 text-[11px] text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl font-bold shrink-0">Đã đến</span>
                    ) : (
                      <button
                        onClick={() => onArrive(apt)}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-teal-600 text-white text-[11px] font-bold hover:shadow-md active:scale-95 transition-all cursor-pointer border-none shrink-0 flex items-center gap-1.5"
                      >
                        <UserCheck className="w-3.5 h-3.5" /> Đã đến
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </motion.div>

        {/* Quick actions — bookings are live once the deposit is paid, so there is
            no approval queue here; the desk's job is check-in and walk-ins. */}
        <motion.div variants={fadeInUp} className="space-y-3">
          <h3 className="font-extrabold text-lg text-slate-900">Thao tác nhanh</h3>
          <div className="backdrop-blur-md bg-white/40 border border-white/60 rounded-[2rem] p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800">Bệnh nhân tới nơi?</p>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Bấm <span className="font-bold text-slate-700">“Đã đến”</span> trên thẻ của họ ở Bàn điều phối để xếp vào hàng chờ của bác sĩ.
                </p>
                <button
                  onClick={() => onGoTab('queue')}
                  className="mt-2 text-[11px] font-bold text-teal-600 hover:text-teal-700 inline-flex items-center gap-1 border-none bg-transparent cursor-pointer p-0"
                >
                  Mở Bàn điều phối <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
            <button onClick={onAdd} className="w-full py-3 rounded-2xl border border-dashed border-slate-300 text-slate-400 hover:bg-white/40 hover:text-emerald-600 hover:border-emerald-300 transition-all text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer bg-transparent">
              <Plus className="w-4 h-4" /> Tự thêm lịch hẹn trực tiếp
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
