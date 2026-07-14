import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  UserCheck,
  Stethoscope,
  Wallet,
  CheckCircle2,
  MessageSquare,
  ArrowRight,
  CalendarClock,
  Inbox,
} from 'lucide-react';
import { normalizeApt, APT_STATUS, TODAY_STR } from './receptionistData';

// ─────────────────────────────────────────────────────────────────────────────
// MODULE A — "Bàn Điều Phối" (Today's Dispatch Queue)
//
// A kanban of TODAY's front-desk flow. Each column maps onto an existing
// appointment status (no schema changes) and exposes one forward quick-action:
//   Chờ tiếp đón (Đặt lịch thành công) → "Đã đến"         → Đang chờ khám
//   Đang khám    (Đang chờ khám)       → doctor completes → Đã khám
//   Chờ thu      (Đã khám)             → "Thu ngân"       → opens Billing
//
// There is no approval gate: a booking is live as soon as the patient pays the
// deposit, so the front desk's only decision here is "has this patient arrived?".
// ─────────────────────────────────────────────────────────────────────────────

const spring = { type: 'spring', stiffness: 260, damping: 26 };

const COLUMNS = [
  {
    id: 'reception',
    title: 'Chờ tiếp đón',
    subtitle: 'Đặt lịch thành công · chưa đến',
    icon: CalendarClock,
    accent: 'sky',
    statuses: [APT_STATUS.BOOKED],
  },
  {
    id: 'inclinic',
    title: 'Đang khám',
    subtitle: 'Đã đến · đang trong phòng',
    icon: Stethoscope,
    accent: 'teal',
    statuses: [APT_STATUS.CHECKED_IN],
  },
  {
    id: 'tobill',
    title: 'Chờ thanh toán',
    subtitle: 'Khám xong · chuyển thu ngân',
    icon: Wallet,
    accent: 'amber',
    statuses: [APT_STATUS.EXAMINED],
  },
];

const ACCENT = {
  sky: {
    // Tinted Liquid Glass column (replaces the old flat top bar)
    container: 'bg-gradient-to-b from-blue-50/60 to-white/40 backdrop-blur-xl border border-blue-100/50 rounded-3xl shadow-lg',
    headText: 'text-blue-700',
    chip: 'bg-sky-50 text-sky-700 border-sky-200/60',
    dot: 'bg-sky-500',
    ring: 'hover:border-sky-300/70',
  },
  teal: {
    container: 'bg-gradient-to-b from-emerald-50/60 to-white/40 backdrop-blur-xl border border-emerald-100/50 rounded-3xl shadow-lg',
    headText: 'text-emerald-700',
    chip: 'bg-teal-50 text-teal-700 border-teal-200/60',
    dot: 'bg-teal-500',
    ring: 'hover:border-teal-300/70',
  },
  amber: {
    container: 'bg-gradient-to-b from-amber-50/60 to-white/40 backdrop-blur-xl border border-amber-100/50 rounded-3xl shadow-lg',
    headText: 'text-amber-700',
    chip: 'bg-amber-50 text-amber-700 border-amber-200/60',
    dot: 'bg-amber-500',
    ring: 'hover:border-amber-300/70',
  },
};

export default function TodayQueueBoard({
  appointments = [],
  doctors = [],
  onChangeStatus, // async (aptId, newStatus)
  onOpenChat, // (patientId, patientName)
  onGoBilling, // (apt) — jump to the Billing module pre-filtered to this patient
  onArrive, // (apt) - open check-in patient lookup/create modal
  showToast,
}) {
  const [busyId, setBusyId] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every 30 seconds so check-in eligibility refreshes
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Check-in is allowed starting 15 minutes before appointment time
  const canCheckIn = (aptTime) => {
    if (!aptTime) return false;
    const [h, m] = aptTime.split(':').map(Number);
    const aptDate = new Date();
    aptDate.setHours(h, m, 0, 0);
    const diffMin = (aptDate - currentTime) / 60000; // minutes until appointment
    return diffMin <= 15; // allow check-in up to 15 min early (and anytime after)
  };

  const getCheckInMessage = (aptTime) => {
    if (!aptTime) return '';
    const [h, m] = aptTime.split(':').map(Number);
    const aptDate = new Date();
    aptDate.setHours(h, m, 0, 0);
    const earlyDate = new Date(aptDate.getTime() - 15 * 60000);
    const hh = String(earlyDate.getHours()).padStart(2, '0');
    const mm = String(earlyDate.getMinutes()).padStart(2, '0');
    return `Có thể check-in từ ${hh}:${mm}`;
  };

  // Check if an appointment's scheduled time has passed
  const isAptTimePassed = (aptTime) => {
    if (!aptTime) return false;
    const [h, m] = aptTime.split(':').map(Number);
    const aptDate = new Date();
    aptDate.setHours(h, m, 0, 0);
    return currentTime > aptDate;
  };

  // Only TODAY's non-cancelled, non-paid appointments belong on the board.
  // Hide appointments in "Chờ tiếp đón" if their time has already passed (patient didn't show up).
  const todays = useMemo(() => {
    const receptionStatuses = [APT_STATUS.BOOKED];
    return (appointments || [])
      .map((a, i) => normalizeApt(a, i))
      .filter((a) => a.date === TODAY_STR)
      .filter((a) => a.status !== APT_STATUS.CANCELLED && a.status !== APT_STATUS.PAID)
      .filter((a) => {
        // If still waiting for reception and time has passed → hide
        if (receptionStatuses.includes(a.status) && isAptTimePassed(a.time)) {
          return false;
        }
        return true;
      })
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments, currentTime]);

  const grouped = useMemo(() => {
    const map = {};
    for (const col of COLUMNS) {
      map[col.id] = todays.filter((a) => col.statuses.includes(a.status));
    }
    return map;
  }, [todays]);

  const run = async (id, fn) => {
    if (busyId) return;
    setBusyId(id);
    try {
      await fn();
    } finally {
      setBusyId(null);
    }
  };

  const handleArrive = (apt) => {
    if (onArrive) {
      onArrive(apt);
    } else {
      run(apt.key, async () => {
        await onChangeStatus?.(apt.aptId, APT_STATUS.CHECKED_IN);
        showToast?.(`${apt.patientName} đã được tiếp đón và xếp vào hàng chờ khám.`, 'success');
      });
    }
  };

  const handleToBilling = (apt) =>
    run(apt.key, async () => {
      await onChangeStatus?.(apt.aptId, APT_STATUS.EXAMINED);
      showToast?.(`${apt.patientName} đã khám xong, chuyển sang chờ thanh toán.`, 'info');
    });

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-end gap-3">
        <div className="flex items-center gap-2">
          {COLUMNS.map((c) => (
            <span
              key={c.id}
              className={`text-xs font-bold px-2.5 py-1 rounded-full border ${ACCENT[c.accent].chip}`}
            >
              {c.title}: {grouped[c.id]?.length || 0}
            </span>
          ))}
        </div>
      </div>

      {/* Kanban — responsive grid, never scrolls horizontally */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {COLUMNS.map((col) => {
          const Icon = col.icon;
          const accent = ACCENT[col.accent];
          const cards = grouped[col.id] || [];
          return (
            <motion.section
              key={col.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={spring}
              className={`${accent.container} overflow-hidden flex flex-col`}
            >
              {/* Column header */}
              <div className="px-5 pt-5 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${accent.chip}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className={`font-extrabold text-base ${accent.headText}`}>{col.title}</h3>
                      <p className="text-xs text-slate-600 font-semibold">{col.subtitle}</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-slate-500">{cards.length}</span>
                </div>
              </div>

              {/* Cards */}
              <div className="px-4 pb-4 space-y-3 min-h-[120px]">
                {cards.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center py-8 text-slate-300">
                    <Inbox className="w-7 h-7 mb-2" />
                    <p className="text-xs font-semibold text-slate-500">Chưa có bệnh nhân</p>
                  </div>
                ) : (
                  cards.map((apt) => {
                    const isBusy = busyId === apt.key;
                    return (
                      <motion.div
                        layout
                        key={apt.key}
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={spring}
                        className={`bg-white/70 border border-white/80 rounded-2xl p-3.5 shadow-sm transition-all ${accent.ring}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-50 to-white border border-slate-100 flex items-center justify-center font-black text-base text-slate-700 shrink-0">
                            {apt.patientName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-bold text-base md:text-lg text-slate-900 truncate">{apt.patientName}</h4>
                            </div>
                            <p className="text-xs md:text-sm text-slate-600 font-medium flex items-center gap-1 mt-0.5">
                              <Clock className="w-3.5 h-3.5" />
                              <span className="font-bold text-slate-700">{apt.time || '--:--'}</span>
                              <span>·</span>
                              <span className="truncate">{apt.serviceName}</span>
                            </p>
                            <p className="text-xs md:text-sm text-teal-600 font-semibold truncate mt-0.5">
                              {apt.doctorName}
                            </p>
                          </div>
                        </div>

                        {/* Quick actions */}
                        <div className="flex items-center gap-2 mt-3">
                          {col.id === 'reception' ? (
                            canCheckIn(apt.time) ? (
                              <button
                                disabled={isBusy}
                                onClick={() => handleArrive(apt)}
                                className="flex-1 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-teal-600 text-white text-xs font-bold hover:shadow-md hover:shadow-teal-500/20 active:scale-95 transition-all border-none cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                              >
                                <UserCheck className="w-3.5 h-3.5" /> Đã đến
                              </button>
                            ) : (
                              <div
                                title={getCheckInMessage(apt.time)}
                                className="flex-1 py-2 rounded-xl bg-slate-100 border border-slate-200/60 text-xs font-bold text-slate-400 flex items-center justify-center gap-1.5 select-none cursor-not-allowed"
                              >
                                <Clock className="w-3.5 h-3.5" /> {getCheckInMessage(apt.time)}
                              </div>
                            )
                          ) : col.id === 'inclinic' ? (
                            <div className="flex-1 py-2 rounded-xl bg-slate-50 border border-slate-200/60 text-xs font-bold text-slate-400 flex items-center justify-center gap-1.5 select-none">
                              <Stethoscope className="w-3.5 h-3.5 animate-pulse" /> Đang chờ bác sĩ hoàn tất
                            </div>
                          ) : (
                            <button
                              disabled={isBusy}
                              onClick={() => onGoBilling?.(apt)}
                              className="flex-1 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold hover:shadow-md hover:shadow-emerald-500/20 active:scale-95 transition-all border-none cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              Thu ngân <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => onOpenChat?.(apt.patientId, apt.patientName)}
                            title="Nhắn tin hỗ trợ"
                            className="w-9 py-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-teal-600 hover:border-teal-200 flex items-center justify-center transition-all cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </motion.section>
          );
        })}
      </div>

      {/* Footer hint */}
      <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        Bệnh nhân đã thanh toán sẽ rời khỏi bảng điều phối và xuất hiện trong lịch sử Quầy Thu Ngân.
      </div>
    </div>
  );
}
