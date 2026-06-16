import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  UserCheck,
  Stethoscope,
  Wallet,
  CheckCircle2,
  X,
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
//   Chờ tiếp đón (Đã xác nhận)  → "Đã đến"          → Đang chờ
//   Đang khám   (Đang chờ)      → "Chờ thanh toán"  → Đã khám
//   Chờ thu     (Đã khám)       → "Thu ngân"        → opens Billing
// Pending requests (Chờ xác nhận) ride in the first column with approve/decline.
// ─────────────────────────────────────────────────────────────────────────────

const spring = { type: 'spring', stiffness: 260, damping: 26 };

const COLUMNS = [
  {
    id: 'reception',
    title: 'Chờ tiếp đón',
    subtitle: 'Đã xác nhận · chưa đến',
    icon: CalendarClock,
    accent: 'sky',
    statuses: [APT_STATUS.REQUEST, APT_STATUS.CONFIRMED],
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
    bar: 'from-sky-400 to-sky-600',
    chip: 'bg-sky-50 text-sky-700 border-sky-200/60',
    dot: 'bg-sky-500',
    ring: 'hover:border-sky-300/70',
  },
  teal: {
    bar: 'from-teal-400 to-emerald-600',
    chip: 'bg-teal-50 text-teal-700 border-teal-200/60',
    dot: 'bg-teal-500',
    ring: 'hover:border-teal-300/70',
  },
  amber: {
    bar: 'from-amber-400 to-orange-500',
    chip: 'bg-amber-50 text-amber-700 border-amber-200/60',
    dot: 'bg-amber-500',
    ring: 'hover:border-amber-300/70',
  },
};

export default function TodayQueueBoard({
  appointments = [],
  doctors = [],
  onChangeStatus, // async (aptId, newStatus)
  onApprove, // async (aptId)
  onDecline, // async (aptId)
  onOpenChat, // (patientId, patientName)
  onGoBilling, // (apt) — jump to the Billing module pre-filtered to this patient
  showToast,
}) {
  const [busyId, setBusyId] = useState(null);

  // Only TODAY's non-cancelled, non-paid appointments belong on the board.
  const todays = useMemo(() => {
    return (appointments || [])
      .map((a, i) => normalizeApt(a, i))
      .filter((a) => a.date === TODAY_STR)
      .filter((a) => a.status !== APT_STATUS.CANCELLED && a.status !== APT_STATUS.PAID)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments]);

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

  const handleArrive = (apt) =>
    run(apt.key, async () => {
      await onChangeStatus?.(apt.aptId, APT_STATUS.CHECKED_IN);
      showToast?.(`${apt.patientName} đã được tiếp đón và xếp vào hàng chờ khám.`, 'success');
    });

  const handleToBilling = (apt) =>
    run(apt.key, async () => {
      await onChangeStatus?.(apt.aptId, APT_STATUS.EXAMINED);
      showToast?.(`${apt.patientName} đã khám xong, chuyển sang chờ thanh toán.`, 'info');
    });

  const handleApprove = (apt) =>
    run(apt.key, async () => {
      await onApprove?.(apt.aptId);
      showToast?.(`Đã phê duyệt lịch hẹn của ${apt.patientName}.`, 'success');
    });

  const handleDecline = (apt) =>
    run(apt.key, async () => {
      await onDecline?.(apt.aptId);
      showToast?.(`Đã từ chối lịch hẹn của ${apt.patientName}.`, 'error');
    });

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Bàn Điều Phối</h2>
          <p className="text-xs text-slate-500 font-medium">
            Điều phối hàng chờ khám hôm nay ({TODAY_STR}) — tiếp đón, theo dõi và chuyển thu ngân.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {COLUMNS.map((c) => (
            <span
              key={c.id}
              className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${ACCENT[c.accent].chip}`}
            >
              {c.title}: {grouped[c.id]?.length || 0}
            </span>
          ))}
        </div>
      </div>

      {/* Kanban — responsive grid, never scrolls horizontally */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
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
              className="backdrop-blur-md bg-white/40 border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-[2rem] overflow-hidden flex flex-col"
            >
              {/* Column header */}
              <div className="relative px-5 pt-5 pb-4">
                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent.bar}`} />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${accent.chip}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-800">{col.title}</h3>
                      <p className="text-[10px] text-slate-400 font-semibold">{col.subtitle}</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-slate-400">{cards.length}</span>
                </div>
              </div>

              {/* Cards */}
              <div className="px-4 pb-4 space-y-3 min-h-[120px]">
                {cards.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center py-8 text-slate-300">
                    <Inbox className="w-7 h-7 mb-2" />
                    <p className="text-[11px] font-semibold text-slate-400">Chưa có bệnh nhân</p>
                  </div>
                ) : (
                  cards.map((apt) => {
                    const isRequest = apt.status === APT_STATUS.REQUEST;
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
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-50 to-white border border-slate-100 flex items-center justify-center font-black text-sm text-slate-600 shrink-0">
                            {apt.patientName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-bold text-sm text-slate-800 truncate">{apt.patientName}</h4>
                              {isRequest && (
                                <span className="text-[8px] font-black uppercase tracking-wide bg-rose-50 text-rose-600 border border-rose-200/60 rounded px-1 py-0.5">
                                  Mới
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" />
                              <span className="font-bold text-slate-500">{apt.time || '--:--'}</span>
                              <span>·</span>
                              <span className="truncate">{apt.serviceName}</span>
                            </p>
                            <p className="text-[11px] text-teal-600 font-semibold truncate mt-0.5">
                              {apt.doctorName}
                            </p>
                          </div>
                        </div>

                        {/* Quick actions */}
                        <div className="flex items-center gap-2 mt-3">
                          {isRequest ? (
                            <>
                              <button
                                disabled={isBusy}
                                onClick={() => handleApprove(apt)}
                                className="flex-1 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 text-white text-[11px] font-bold hover:shadow-md hover:shadow-sky-500/20 active:scale-95 transition-all border-none cursor-pointer disabled:opacity-50"
                              >
                                Phê duyệt
                              </button>
                              <button
                                disabled={isBusy}
                                onClick={() => handleDecline(apt)}
                                title="Từ chối"
                                className="w-9 py-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200 flex items-center justify-center transition-all cursor-pointer disabled:opacity-50"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : col.id === 'reception' ? (
                            <button
                              disabled={isBusy}
                              onClick={() => handleArrive(apt)}
                              className="flex-1 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-teal-600 text-white text-[11px] font-bold hover:shadow-md hover:shadow-teal-500/20 active:scale-95 transition-all border-none cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                            >
                              <UserCheck className="w-3.5 h-3.5" /> Đã đến
                            </button>
                          ) : col.id === 'inclinic' ? (
                            <button
                              disabled={isBusy}
                              onClick={() => handleToBilling(apt)}
                              className="flex-1 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-amber-500 text-white text-[11px] font-bold hover:shadow-md hover:shadow-amber-500/20 active:scale-95 transition-all border-none cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                            >
                              <Wallet className="w-3.5 h-3.5" /> Chờ thanh toán
                            </button>
                          ) : (
                            <button
                              disabled={isBusy}
                              onClick={() => onGoBilling?.(apt)}
                              className="flex-1 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[11px] font-bold hover:shadow-md hover:shadow-emerald-500/20 active:scale-95 transition-all border-none cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              Thu ngân <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => onOpenChat?.(apt.patientId, apt.patientName)}
                            title="Nhắn tin hỗ trợ"
                            className="w-9 py-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-teal-600 hover:border-teal-200 flex items-center justify-center transition-all cursor-pointer"
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
      <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        Bệnh nhân đã thanh toán sẽ rời khỏi bảng điều phối và xuất hiện trong lịch sử Quầy Thu Ngân.
      </div>
    </div>
  );
}
