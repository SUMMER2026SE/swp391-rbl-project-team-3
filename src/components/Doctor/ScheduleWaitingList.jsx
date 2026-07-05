import React from 'react';
import { Clock, PlayCircle, Eye, Users, CheckCircle2, AlarmClock, Play } from 'lucide-react';

// Minutes a checked-in patient has been waiting past their scheduled slot.
// Only meaningful for today's queue; negative (not yet due) clamps to 0.
const minutesWaiting = (timeStr) => {
  if (!timeStr) return 0;
  const [h, m] = String(timeStr).split(':').map(Number);
  const now = new Date();
  return Math.max(0, now.getHours() * 60 + now.getMinutes() - (h * 60 + m));
};

export default function ScheduleWaitingList({ doctorId, onStartExam, appointments = [], searchQuery = '' }) {
  const today = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  // PHASE 4 — the active waiting room is strictly patients the Receptionist has
  // CHECKED IN (status 'Đang chờ' / WAITING). 'Đã xác nhận' (CONFIRMED, not yet
  // arrived) is intentionally excluded. Completed exams ('Đã khám' & 'Đã thanh toán') stay visible
  // for read-only review. Time-of-day no longer hides a checked-in patient.
  const todayAppointments = [...appointments]?.filter?.(
    (apt) => {
      const isDoctorMatch = String(apt?.doctorId || apt?.doctor_id) === String(doctorId);
      const isWaiting = apt?.status === 'Đang chờ';
      const isExamined = apt?.status === 'Đã khám' || apt?.status === 'Đã thanh toán';
      const isToday = apt?.date === today;
      if (!isDoctorMatch || !isToday || !(isWaiting || isExamined)) return false;
      // Apply global search filter when present
      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const name = (apt?.patientName || '').toLowerCase();
        if (!name.includes(q)) return false;
      }
      return true;
    }
  ).sort((a, b) => (a?.time || '').localeCompare(b?.time || ''));

  const waitingCount = todayAppointments.filter((a) => a?.status === 'Đang chờ' && localStorage.getItem(`appointment_draft_${a?.id}`) === null).length;
  const examinedCount = todayAppointments.filter((a) => a?.status === 'Đã khám' || a?.status === 'Đã thanh toán').length;
  const lateCount = todayAppointments.filter(
    (a) => a?.status === 'Đang chờ' && localStorage.getItem(`appointment_draft_${a?.id}`) === null && minutesWaiting(a?.time) >= 15
  ).length;

  // Queue position is assigned across WAITING patients only (in time order).
  let queuePos = 0;

  const handleStartExam = (apt) => {
    if (onStartExam) onStartExam(apt);
  };

  const stats = [
    { label: 'Đang chờ khám', value: waitingCount, icon: Users, accent: 'text-amber-600', ring: 'bg-amber-500/10 border-amber-200/60' },
    { label: 'Đã khám hôm nay', value: examinedCount, icon: CheckCircle2, accent: 'text-emerald-600', ring: 'bg-emerald-500/10 border-emerald-200/60' },
    { label: 'Chờ quá 15 phút', value: lateCount, icon: AlarmClock, accent: lateCount > 0 ? 'text-rose-600' : 'text-slate-400', ring: lateCount > 0 ? 'bg-rose-500/10 border-rose-200/60' : 'bg-slate-500/5 border-slate-200/60' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-extrabold text-2xl md:text-3xl text-slate-900 tracking-tight">Hàng chờ &amp; Lịch khám</h1>
        <p className="text-sm md:text-base text-slate-600 font-medium mt-1">Danh sách bệnh nhân trong ngày: {today}</p>
      </div>

      {/* At-a-glance queue stats — fast triage in a busy clinic */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className={`backdrop-blur-xl bg-white/40 border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-2xl p-4 flex items-center gap-4`}
            >
              <div className={`w-11 h-11 rounded-xl border flex items-center justify-center ${s.ring}`}>
                <Icon className={`w-5 h-5 ${s.accent}`} />
              </div>
              <div>
                <p className={`text-2xl font-extrabold leading-none ${s.accent}`}>{s.value}</p>
                <p className="text-sm font-bold text-slate-600 mt-1">{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="backdrop-blur-xl bg-white/40 border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-[2rem] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200/50">
                <th className="py-4 pl-6 pr-2 text-xs font-bold text-slate-500 uppercase tracking-wider w-12">#</th>
                <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Thời gian</th>
                <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Bệnh nhân</th>
                <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Dịch vụ</th>
                <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Trạng thái</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/50">
              {todayAppointments?.map?.((apt) => {
                const isCompleted = apt?.status === 'Đã khám' || apt?.status === 'Đã thanh toán';
                const isWaiting = apt?.status === 'Đang chờ';
                const waited = isWaiting ? minutesWaiting(apt?.time) : 0;
                const hasPendingTickets = !isCompleted && apt?.serviceTickets && apt.serviceTickets.length > 0 && apt.serviceTickets.some(t => t.status !== 'TECH_COMPLETED');
                const hasDraft = !isCompleted && !hasPendingTickets && localStorage.getItem(`appointment_draft_${apt?.id}`) !== null;
                const isLate = !hasDraft && !hasPendingTickets && waited >= 15;
                const isNext = isWaiting && !hasDraft && !hasPendingTickets && (queuePos === 0); // first still-waiting row
                const position = isWaiting && !hasDraft && !hasPendingTickets ? ++queuePos : null;

                return (
                  <tr
                    key={apt?.id}
                    className={`transition-colors relative ${
                      isCompleted
                        ? 'bg-slate-50/30 opacity-70 hover:bg-slate-50/50'
                        : hasPendingTickets
                          ? 'bg-orange-50/20 hover:bg-orange-50/50 font-semibold'
                          : hasDraft
                            ? 'bg-teal-50/20 hover:bg-teal-50/50 font-semibold'
                            : isLate
                              ? 'bg-rose-50/40 hover:bg-rose-50/70'
                              : isNext
                                ? 'bg-teal-50/40 hover:bg-teal-50/70'
                                : 'hover:bg-white/60'
                    }`}
                  >
                    {/* Position cell doubles as a colored urgency accent bar */}
                    <td className="py-4 pl-6 pr-2">
                      <span
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-extrabold border ${
                          isCompleted
                            ? 'bg-slate-100 text-slate-400 border-slate-200'
                            : hasPendingTickets
                              ? 'bg-orange-500 text-white border-orange-500 shadow-sm shadow-orange-500/30'
                              : hasDraft
                                ? 'bg-teal-500 text-white border-teal-500 shadow-sm shadow-teal-500/30'
                                : isLate
                                  ? 'bg-rose-500 text-white border-rose-500 shadow-sm shadow-rose-500/30'
                                  : isNext
                                    ? 'bg-teal-500 text-white border-teal-500 shadow-sm shadow-teal-500/30'
                                    : 'bg-white text-slate-600 border-slate-200'
                        }`}
                      >
                        {isCompleted ? '✓' : (hasDraft || hasPendingTickets) ? <Play className="w-3 h-3 fill-white stroke-none ml-0.5" /> : position}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2 text-base text-slate-800 font-bold">
                        <Clock className="w-4 h-4 text-teal-500" />
                        {apt?.time}
                      </div>
                      {isWaiting && !hasDraft && !hasPendingTickets && waited > 0 && (
                        <span className={`mt-1 inline-block text-xs font-bold ${isLate ? 'text-rose-600' : 'text-slate-500'}`}>
                          Đã chờ {waited} phút
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-base md:text-lg font-bold text-slate-900">
                      {apt?.patientName}
                    </td>
                    <td className="py-4 px-4 text-slate-600 text-sm md:text-base font-medium">
                      {apt?.service}
                    </td>
                    <td className="py-4 px-4">
                      {isCompleted ? (
                        <span className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 font-bold px-3 py-1 rounded-full backdrop-blur-md text-sm">Đã khám</span>
                      ) : hasPendingTickets ? (
                        <span className="inline-flex items-center gap-1.5 bg-orange-500/10 text-orange-700 px-3 py-1 rounded-full text-sm font-bold border border-orange-300/50 animate-pulse">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                          </span>
                          Đang chờ kết quả xét nghiệm
                        </span>
                      ) : hasDraft ? (
                        <span className="inline-flex items-center gap-1.5 bg-teal-500/10 text-teal-700 px-3 py-1 rounded-full text-sm font-bold border border-teal-300/50">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                          </span>
                          Đang khám
                        </span>
                      ) : isLate ? (
                        <span className="inline-flex items-center gap-1 bg-rose-500/10 text-rose-600 px-3 py-1 rounded-full text-sm font-bold border border-rose-300/50">
                          <AlarmClock className="w-3 h-3" />
                          Chờ lâu
                        </span>
                      ) : isNext ? (
                        <span className="inline-flex items-center gap-1.5 bg-teal-500/10 text-teal-700 px-3 py-1 rounded-full text-sm font-bold border border-teal-300/50">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                          </span>
                          Mời vào khám
                        </span>
                      ) : (
                        <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-sm font-bold border border-amber-200/50">Đang chờ</span>
                      )}
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
                        <button
                          onClick={() => handleStartExam(apt)}
                          className={`inline-flex items-center gap-2 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md active:scale-95 transition-all ${
                            hasPendingTickets
                              ? 'bg-gradient-to-r from-orange-500 to-amber-500 shadow-orange-500/30 hover:shadow-lg hover:shadow-orange-500/40 ring-2 ring-orange-300/40'
                              : isNext || isLate || hasDraft
                                ? 'bg-gradient-to-r from-teal-500 to-emerald-500 shadow-teal-500/30 hover:shadow-lg hover:shadow-teal-500/40 ring-2 ring-teal-300/40'
                                : 'bg-gradient-to-r from-teal-500 to-emerald-500 shadow-teal-500/20 hover:shadow-lg hover:shadow-teal-500/30'
                          }`}
                        >
                          <PlayCircle className={`w-4 h-4 ${hasDraft || hasPendingTickets ? 'animate-pulse' : ''}`} />
                          {hasPendingTickets ? 'Đang khám' : hasDraft ? 'Đang khám' : 'Bắt đầu khám'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {todayAppointments.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-base text-slate-500 font-medium">
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
