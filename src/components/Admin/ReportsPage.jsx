import React, { useState, useMemo, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, Activity, Calendar, Search, Stethoscope,
  CheckCircle2, Clock, AlertCircle, Info, ShieldAlert,
  Database, User, UserCog, Wrench, ChevronDown, ChevronUp,
  BarChart3, TrendingDown, Award, XCircle,
} from 'lucide-react';
import GlassSelect from '../common/GlassSelect';


import { useDoctors } from '../../hooks/useDoctors';

const RevenueStatistics = lazy(() => import('./RevenueStatistics'));

// ─── Shared helpers ────────────────────────────────────────────────────────────
function fmtTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
}
function fmtVND(n) {
  return Number(n).toLocaleString('vi-VN') + ' VNĐ';
}
function parseFee(s) {
  if (!s) return 0;
  return parseInt(String(s).replace(/[^0-9]/g, ''), 10) || 0;
}

// ─── Simple bar (pure CSS/motion) ─────────────────────────────────────────────
function MiniBar({ pct, color = '#6366f1' }) {
  return (
    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(pct, 100)}%` }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="h-full rounded-full"
        style={{ background: color }}
      />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 1 — Báo cáo dịch vụ
// ══════════════════════════════════════════════════════════════════════════════
function ServiceReportTab() {
  const [period, setPeriod] = useState('Tất cả');

  // Load appointments once
  const allApts = useMemo(() => {
    try {
      const s = localStorage.getItem('dermasmart_appointments');
      const parsed = s ? JSON.parse(s) : null;
      // Force update if we added new mock data
      if (parsed && parsed.length >= ([]).length) return parsed;
      if (parsed && parsed.length < ([]).length) {
          localStorage.setItem('dermasmart_appointments', JSON.stringify(([])));
          return ([]);
      }
      return ([]);
    } catch { return ([]); }
  }, []);

  // Filter by period
  const apts = useMemo(() => {
    const now = new Date('2026-06-09');
    return allApts?.filter?.(a => {
      if (period === 'Tất cả') return true;
      const d = new Date(a.date);
      if (period === 'Tháng') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      if (period === 'Quý') {
        const qNow = Math.floor(now.getMonth() / 3);
        const qD = Math.floor(d.getMonth() / 3);
        return qNow === qD && d.getFullYear() === now.getFullYear();
      }
      if (period === 'Năm') return d.getFullYear() === now.getFullYear();
      return true;
    });
  }, [allApts, period]);

  // Usage count per service
  const serviceStats = useMemo(() => {
    const map = {};
    apts.forEach(a => {
      const key = a.service || 'Khác';
      if (!map[key]) map[key] = { name: key, total: 0, done: 0, cancelled: 0, revenue: 0 };
      map[key].total++;
      if (a.status === 'Đã khám') { map[key].done++; map[key].revenue += parseFee(a.fee); }
      if (a.status === 'Đã hủy')   map[key].cancelled++;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [apts]);

  // Monthly trend — last 6 months for top 3 services (uses filtered apts for consistency)
  const MONTHS = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6'];
  const top3 = serviceStats.slice(0, 3)?.map?.(s => s.name);
  const monthlyTrend = useMemo(() => {
    return MONTHS?.map?.((label, mi) => {
      const row = { label };
      top3.forEach(svc => {
        row[svc] = apts?.filter?.(a => {
          const m = new Date(a.date).getMonth();
          return m === mi && a.service === svc && a.status !== 'Đã hủy';
        }).length;
      });
      return row;
    });
  }, [apts, top3.join(',')]);

  const TREND_COLORS = ['#4f46e5','#10b981','#d97706'];
  const TREND_TEXT_COLORS = ['text-indigo-600', 'text-emerald-600', 'text-amber-600'];

  const totalUsed   = serviceStats.reduce((s, x) => s + x.total, 0);
  const totalDone   = serviceStats.reduce((s, x) => s + x.done, 0);
  const totalRev    = serviceStats.reduce((s, x) => s + x.revenue, 0);
  const cancelRate  = totalUsed > 0 ? ((serviceStats.reduce((s,x)=>s+x.cancelled,0)/totalUsed)*100).toFixed(1) : 0;

  const formatCompact = (val) => {
    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
    if (val >= 1000) return (val / 1000).toFixed(1) + 'K';
    return val;
  };

  const maxTrendVal = Math.max(1, ...monthlyTrend?.map?.(row => Math.max(...top3?.map?.(n => row[n] || 0))));

  const syncedTop4 = useMemo(() => {
    if (serviceStats.length <= 4) return serviceStats;
    const top4 = serviceStats.slice(0, 4);
    const others = serviceStats.slice(4);
    const othersTotal = others.reduce((sum, s) => sum + s.total, 0);
    const othersDone = others.reduce((sum, s) => sum + s.done, 0);
    const othersRev = others.reduce((sum, s) => sum + s.revenue, 0);
    if (othersTotal > 0) {
      top4.push({ name: 'Các dịch vụ khác', total: othersTotal, done: othersDone, revenue: othersRev });
    }
    return top4;
  }, [serviceStats]);

  return (
    <div className="space-y-4 bg-transparent">
      {/* Header + period */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Báo cáo Dịch vụ</h3>
          <p className="text-xs text-slate-500 mt-0.5">Thống kê lượt sử dụng, doanh thu và xu hướng theo dịch vụ</p>
        </div>
        <div className="flex bg-indigo-50/50 border border-indigo-100 rounded-full p-0.5 gap-0.5">
          {['Tất cả', 'Tháng', 'Quý', 'Năm']?.map?.(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-full text-[10px] font-semibold transition-all border-none outline-none cursor-pointer ${
                period === p ? 'bg-white text-indigo-700 shadow-sm' : 'bg-transparent text-slate-500 hover:text-slate-700'}`}>
              {p}
            </button>
          ))}
        </div>
      </div>
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'TỔNG LƯỢT ĐẶT',  value: totalUsed,            color: '#4f46e5', lightColor: '#c7d2fe', iconColor: 'text-indigo-500',  iconBg: 'bg-indigo-100/50', icon: Calendar },
          { label: 'LƯỢT HOÀN THÀNH',value: totalDone,             color: '#10b981', lightColor: '#a7f3d0', iconColor: 'text-emerald-500', iconBg: 'bg-emerald-100/50', icon: CheckCircle2 },
          { label: 'TỶ LỆ HỦY',      value: `${cancelRate}%`,     color: '#ef4444', lightColor: '#fecaca', iconColor: 'text-rose-500', iconBg: 'bg-rose-100/50', icon: XCircle },
          { label: 'DOANH THU DV',   value: fmtVND(totalRev),     color: '#b45309', lightColor: '#fde68a', iconColor: 'text-amber-600', iconBg: 'bg-amber-100/50', icon: TrendingUp },
        ]?.map?.((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="bg-white rounded-[18px] p-3.5 shadow-sm relative flex flex-col justify-between min-h-[120px]"
            style={{ 
               borderStyle: 'solid',
               borderWidth: '2px',
               borderLeftColor: c.color,
               borderBottomColor: c.color,
               borderTopColor: c.lightColor,
               borderRightColor: c.lightColor
            }}>
            <div className={`w-9 h-9 rounded-full flex items-center justify-center ${c.iconBg}`}>
               {c.icon && <c.icon className={`w-4.5 h-4.5 ${c.iconColor}`} />}
            </div>
            <div className="mt-2">
              <p className="text-[8px] sm:text-[9px] font-bold text-slate-500 tracking-wider mb-1 uppercase">{c.label}</p>
              <p className="text-xl sm:text-2xl font-black text-slate-900 leading-tight break-all sm:break-normal">{c.value}</p>
            </div>
          </motion.div>
        ))}
      </div>
      {/* 2 Main Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Top dịch vụ sử dụng nhiều nhất (Vertical Bar Chart) */}
        <div className="bg-white rounded-[18px] p-4 shadow-sm flex flex-col min-h-[240px] lg:col-span-3" style={{ border: '1px solid #f1f5f9' }}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Award className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-bold text-slate-800">Top dịch vụ sử dụng nhiều nhất</span>
          </div>
          <div className="flex-1 flex items-end justify-around gap-2 sm:gap-3 px-1.5 pb-3 pt-4">
            {syncedTop4.length === 0 ? (
               <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs pb-8">Chưa có dữ liệu</div>
            ) : (
               (() => {
                 const maxDone = Math.max(...syncedTop4?.map?.(x => x.done), 1);
                 return syncedTop4?.map?.((s, i) => {
                   const heightPct = (s.done / maxDone) * 100;
                   const barOpacity = i === 0 ? 1 : i === 1 ? 0.85 : i === 2 ? 0.7 : 0.45;
                   return (
                     <div key={s.name} className="flex flex-col items-center gap-1 flex-1">
                        {/* Completed count label */}
                        <span className="text-[10px] sm:text-xs font-black text-indigo-700">{s.done}</span>
                        {/* Total booked label — shows the gap */}
                        <span className="text-[8px] text-slate-400 font-semibold -mt-0.5">/{s.total} đặt</span>
                        {/* Bar container – fixed height, bar grows from bottom */}
                        <div className="w-full flex items-end justify-center" style={{ height: '110px' }}>
                           <motion.div
                             initial={{ height: 0 }}
                             animate={{ height: `${heightPct}%` }}
                             transition={{ duration: 0.9, delay: i * 0.12, ease: 'easeOut' }}
                             className="w-full max-w-[36px] rounded-t-[6px] bg-indigo-500"
                             style={{ opacity: barOpacity }}
                           />
                        </div>
                        <span className="text-[8px] sm:text-[9px] font-bold text-slate-600 text-center leading-tight line-clamp-2 h-6 px-0.5">
                          {s.name}
                        </span>
                     </div>
                   );
                 });
               })()
            )}
          </div>
        </div>

        {/* Doanh thu theo dịch vụ */}
        <div className="bg-white rounded-[18px] p-4 shadow-sm lg:col-span-2" style={{ border: '1px solid #f1f5f9' }}>
          <div className="flex items-center gap-1.5 mb-5">
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-bold text-slate-800">Doanh thu theo dịch vụ</span>
          </div>
          <div className="space-y-4">
            {syncedTop4?.map?.((s, i) => {
              const maxRev = Math.max(...syncedTop4?.map?.(x => x.revenue), 1);
              const pct = maxRev > 0 ? (s.revenue / maxRev) * 100 : 0;
              return (
                <div key={s.name}>
                  <div className="flex justify-between text-[10px] mb-1.5">
                    <span className="font-bold text-slate-700 truncate mr-2">{s.name}</span>
                    <span className="font-black text-slate-900">{formatCompact(s.revenue)}</span>
                  </div>
                  <div className="h-2.5 bg-emerald-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: `${pct}%` }} 
                      transition={{ duration: 0.8, delay: i * 0.1 }} 
                      className="h-full bg-emerald-700 rounded-full" 
                    />
                  </div>
                </div>
              );
            })}
            {syncedTop4.every(s => s.revenue === 0) && (
              <p className="text-xs text-slate-400 text-center py-3">Chưa có dữ liệu doanh thu.</p>
            )}
            <div className="text-center mt-4 pt-3 border-t border-slate-100">
               <span className="text-[9px] text-slate-400 italic">Dữ liệu được cập nhật thời gian thực</span>
            </div>
          </div>
        </div>
      </div>
      {/* Monthly trend */}
      <div className="bg-white border border-slate-100 rounded-[18px] p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-bold text-slate-800">Xu hướng sử dụng dịch vụ theo tháng</span>
          </div>
          <div className="flex items-center gap-3">
            {top3?.map?.((name, i) => (
              <span key={name} className="flex items-center gap-1 text-[10px] font-bold text-slate-700">
                <span className="w-2 h-2 rounded-full inline-block" style={{ background: TREND_COLORS[i] }} />
                {name}
              </span>
            ))}
          </div>
        </div>
        {top3.length > 0 ? (
          <div className="w-full h-[225px] mt-3">
            <svg viewBox="0 0 800 300" className="w-full h-full drop-shadow-sm">
              {/* Grid lines */}
              {[0, 1, 2, 3, 4]?.map?.(step => {
                const y = 240 - (step / 4) * 200;
                return (
                  <g key={step}>
                    <line x1="60" y1={y} x2="760" y2={y} stroke="#f1f5f9" strokeWidth="1.5" strokeDasharray="4 4" />
                    <text x="50" y={y + 4} fontSize="12" fill="#94a3b8" textAnchor="end" fontWeight="600">
                      {Math.round((step / 4) * maxTrendVal)}
                    </text>
                  </g>
                );
              })}

              {/* X Axis labels */}
              {monthlyTrend?.map?.((row, i) => (
                <text key={i} x={80 + (i * 128)} y="270" fontSize="13" fill="#64748b" textAnchor="middle" fontWeight="bold">
                  {row.label}
                </text>
              ))}

              {/* Lines */}
              {top3?.map?.((name, i) => {
                const pts = monthlyTrend?.map?.((row, index) => ({
                  x: 80 + (index * 128),
                  y: 240 - ((row[name] || 0) / maxTrendVal) * 200,
                  val: row[name] || 0
                }));
                const d = `M ${pts?.map?.(p => `${p.x},${p.y}`).join(' L ')}`;
                return (
                  <g key={name}>
                    <motion.path
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 1.5, ease: "easeOut", delay: i * 0.2 }}
                      d={d}
                      fill="none"
                      stroke={TREND_COLORS[i]}
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {pts?.map?.((p, j) => (
                      <motion.circle
                        key={j}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.8 + (i * 0.2) + (j * 0.1) }}
                        cx={p.x}
                        cy={p.y}
                        r="5"
                        fill="white"
                        stroke={TREND_COLORS[i]}
                        strokeWidth="2.5"
                      />
                    ))}
                    {/* Tooltip values above circles */}
                    {pts?.map?.((p, j) => (
                      p.val > 0 && (
                        <motion.text
                          key={`txt-${j}`}
                          initial={{ opacity: 0, y: p.y }}
                          animate={{ opacity: 1, y: p.y - 12 }}
                          transition={{ delay: 1.2 + (i * 0.2) + (j * 0.1) }}
                          x={p.x}
                          fontSize="12"
                          fill={TREND_COLORS[i]}
                          textAnchor="middle"
                          fontWeight="bold"
                        >
                          {p.val}
                        </motion.text>
                      )
                    ))}
                  </g>
                );
              })}
            </svg>
          </div>
        ) : (
          <div className="w-full h-[225px] flex items-center justify-center text-slate-400 text-sm">
            Không có dữ liệu
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 2 — Báo cáo lịch hẹn
// ══════════════════════════════════════════════════════════════════════════════
function AppointmentReportTab() {
  const { doctors } = useDoctors();
  const [filterDoctor, setFilterDoctor] = useState('all');

  const allApts = useMemo(() => {
    try { const s = localStorage.getItem('dermasmart_appointments'); return s ? JSON.parse(s) : ([]); }
    catch { return ([]); }
  }, []);

  const apts = useMemo(() =>
    filterDoctor === 'all' ? allApts : allApts?.filter?.(a => a.doctorId === filterDoctor),
  [allApts, filterDoctor]);

  const total     = apts.length;
  const done      = apts?.filter?.(a => a.status === 'Đã khám').length;
  const cancelled = apts?.filter?.(a => a.status === 'Đã hủy').length;
  const pending   = apts?.filter?.(a => ['Đang chờ','Đã xác nhận','Chờ xác nhận'].includes(a.status)).length;
  const online    = apts?.filter?.(a => a.notes?.includes('Portal') || a.notes?.includes('website')).length;

  // By month
  const byMonth = useMemo(() => {
    const m = {};
    apts.forEach(a => {
      const key = a.date?.slice(0, 7) || '—';
      if (!m[key]) m[key] = { total: 0, done: 0, cancelled: 0 };
      m[key].total++;
      if (a.status === 'Đã khám') m[key].done++;
      if (a.status === 'Đã hủy')  m[key].cancelled++;
    });
    return Object.entries(m).sort((a,b) => a[0].localeCompare(b[0]))?.map?.(([k,v]) => ({ month: k, ...v }));
  }, [apts]);

  // Peak hours
  const byHour = useMemo(() => {
    const m = {};
    apts.forEach(a => { if (a.time) { m[a.time] = (m[a.time] || 0) + 1; } });
    return Object.entries(m).sort((a,b) => b[1]-a[1]).slice(0,6)?.map?.(([t,c]) => ({ time: t, count: c }));
  }, [apts]);

  const maxHour = Math.max(...byHour?.map?.(h => h.count), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Báo cáo Lịch hẹn</h3>
          <p className="text-xs text-slate-500 mt-0.5">Tổng quan trạng thái, xu hướng và khung giờ cao điểm</p>
        </div>
        <GlassSelect value={filterDoctor} onChange={setFilterDoctor}
          options={[{ value: 'all', label: 'Tất cả bác sĩ' }, ...(doctors || []).map(d => ({ value: String(d.id), label: d.name }))]}
          buttonClassName="px-3 py-2.5 text-sm" />
      </div>
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Tổng lịch hẹn', value: total,                color: 'indigo',  icon: Calendar },
          { label: 'Hoàn thành',    value: done,                  color: 'emerald', icon: CheckCircle2 },
          { label: 'Đã hủy',        value: cancelled,             color: 'rose',    icon: XCircle },
          { label: 'Đang chờ',      value: pending,               color: 'amber',   icon: Clock },
          { label: 'Đặt online',    value: `${online}`,           color: 'sky',     icon: TrendingUp },
        ]?.map?.((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className={`bg-${c.color}-50 border border-${c.color}-100 rounded-2xl p-4 shadow-sm text-center`}>
            <c.icon className={`w-5 h-5 text-${c.color}-500 mx-auto mb-1.5`} />
            <p className={`text-2xl font-black text-${c.color}-700`}>{c.value}</p>
            <p className="text-[10px] font-semibold text-slate-500 mt-0.5">{c.label}</p>
          </motion.div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly breakdown */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-indigo-500" />
            <span className="text-sm font-bold text-slate-800">Số lịch hẹn theo tháng</span>
          </div>
          {byMonth.length > 0 ? (
            <div className="space-y-3">
              {byMonth?.map?.((row, i) => {
                const maxT = Math.max(...byMonth?.map?.(r => r.total), 1);
                return (
                  <div key={row.month}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-700">{row.month}</span>
                      <div className="flex gap-3 text-[10px]">
                        <span className="text-slate-500">{row.total} tổng</span>
                        <span className="text-emerald-600">{row.done} hoàn thành</span>
                        <span className="text-rose-500">{row.cancelled} hủy</span>
                      </div>
                    </div>
                    <MiniBar pct={(row.total/maxT)*100} color="#6366f1" />
                  </div>
                );
              })}
            </div>
          ) : <p className="text-sm text-slate-400 text-center py-6">Chưa có dữ liệu.</p>}
        </div>

        {/* Peak hours */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-bold text-slate-800">Khung giờ cao điểm</span>
          </div>
          {byHour.length > 0 ? (
            <div className="space-y-3">
              {byHour?.map?.((h, i) => (
                <div key={h.time} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-600 w-12 shrink-0">{h.time}</span>
                  <MiniBar pct={(h.count/maxHour)*100} color={i === 0 ? '#f59e0b' : '#6366f1'} />
                  <span className="text-xs font-bold text-slate-700 w-8 text-right shrink-0">{h.count}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-slate-400 text-center py-6">Chưa có dữ liệu.</p>}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 3 — Báo cáo nhân viên
// ══════════════════════════════════════════════════════════════════════════════
function EmployeeReportTab() {
  const { doctors } = useDoctors();
  const allApts = useMemo(() => {
    try { const s = localStorage.getItem('dermasmart_appointments'); return s ? JSON.parse(s) : ([]); }
    catch { return ([]); }
  }, []);

  const docStats = useMemo(() => {
    return doctors?.map?.(doc => {
      const mine = allApts?.filter?.(a => a.doctorId === doc.id);
      const done = mine?.filter?.(a => a.status === 'Đã khám');
      const cancelled = mine?.filter?.(a => a.status === 'Đã hủy');
      const patients = new Set(done?.map?.(a => a.patientId)).size;
      const revenue = done.reduce((s, a) => s + parseFee(a.fee), 0);
      const completionRate = mine.length > 0 ? ((done.length / mine.length) * 100).toFixed(0) : 0;
      return { doc, total: mine.length, done: done.length, cancelled: cancelled.length, patients, revenue, completionRate };
    }).sort((a, b) => b.revenue - a.revenue);
  }, [allApts]);

  const maxRev = Math.max(...docStats?.map?.(d => d.revenue), 1);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-slate-900">Báo cáo Nhân viên</h3>
        <p className="text-xs text-slate-500 mt-0.5">Hiệu suất làm việc, số bệnh nhân và doanh thu của từng bác sĩ / KTV</p>
      </div>
      {/* Doctor cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {docStats?.map?.((d, i) => (
          <motion.div key={d.doc.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start gap-3 mb-4">
              <img src={d.doc.image} alt="" className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">{d.doc.name}</p>
                <p className="text-xs text-slate-500 truncate">{d.doc.title}</p>
                <div className="flex items-center gap-1 mt-1">
                  {[0,1,2,3,4]?.map?.(s => (
                    <span key={s} className={`text-[10px] ${s < Math.round(d.doc.rating) ? 'text-amber-400' : 'text-slate-200'}`}>★</span>
                  ))}
                  <span className="text-[10px] text-slate-400 ml-1">{d.doc.rating}</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {[
                { label: 'Tổng ca', value: d.total, cls: 'bg-indigo-50 text-indigo-700' },
                { label: 'Hoàn thành', value: d.done, cls: 'bg-emerald-50 text-emerald-700' },
                { label: 'Bệnh nhân', value: d.patients, cls: 'bg-sky-50 text-sky-700' },
                { label: 'Tỷ lệ HT', value: `${d.completionRate}%`, cls: 'bg-teal-50 text-teal-700' },
              ]?.map?.(item => (
                <div key={item.label} className={`rounded-xl p-2 text-center ${item.cls}`}>
                  <p className="text-lg font-black">{item.value}</p>
                  <p className="text-[10px] font-semibold text-slate-500">{item.label}</p>
                </div>
              ))}
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-500 font-medium">Doanh thu</span>
                <span className="font-black text-indigo-700">{fmtVND(d.revenue)}</span>
              </div>
              <MiniBar pct={(d.revenue / maxRev) * 100} color="#6366f1" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 4 — Nhật ký hệ thống & người dùng
// ══════════════════════════════════════════════════════════════════════════════
function SystemActivityTab() {
  const [activeInner, setActiveInner] = useState('activity');
  const [search, setSearch]           = useState('');
  const [filterSev, setFilterSev]     = useState('all');
  const [filterRole, setFilterRole]   = useState('all');
  const [filterCat, setFilterCat]     = useState('all'); // patient category filter

  const sysFiltered = useMemo(() => ([])?.filter?.(l => {
    const q = search.toLowerCase();
    return (!q || l.action.toLowerCase().includes(q) || l.details.toLowerCase().includes(q) || l.actor.toLowerCase().includes(q))
        && (filterSev === 'all' || l.severity === filterSev);
  }), [search, filterSev]);

  const actFiltered = useMemo(() => ([])?.filter?.(l => {
    const q = search.toLowerCase();
    const matchQ    = !q || l.userName.toLowerCase().includes(q) || l.details.toLowerCase().includes(q) || l.action.toLowerCase().includes(q);
    const matchRole = filterRole === 'all' || l.role === filterRole;
    // category filter: 'all' shows everything, patient cats filter patients, staff cats filter staff
    const matchCat  = filterCat  === 'all'
      || l.category === filterCat
      || (filterCat === 'cancel' && l.category === 'reschedule'); // group cancel+reschedule
    return matchQ && matchRole && matchCat;
  }), [search, filterRole, filterCat]);

  // Stats for patient actions
  const patientStats = useMemo(() => {
    const pts = ([])?.filter?.(l => l.role === 'PATIENT');
    return {
      booking:     pts?.filter?.(l => l.category === 'booking').length,
      cancel:      pts?.filter?.(l => l.category === 'cancel').length,
      reschedule:  pts?.filter?.(l => l.category === 'reschedule').length,
      payment:     pts?.filter?.(l => l.category === 'payment').length,
      ai_scan:     pts?.filter?.(l => l.category === 'ai_scan').length,
    };
  }, []);

  const SEV_DOT   = { Success:'bg-emerald-500', Info:'bg-sky-400', Warning:'bg-amber-500', Error:'bg-rose-500' };
  const SEV_BADGE = {
    Success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    Info:    'bg-sky-50 text-sky-700 border border-sky-200',
    Warning: 'bg-amber-50 text-amber-700 border border-amber-200',
    Error:   'bg-rose-50 text-rose-700 border border-rose-200',
  };
  const ROLE_BADGE = {
    ADMIN:        'bg-indigo-50 text-indigo-700 border border-indigo-200',
    DOCTOR:       'bg-emerald-50 text-emerald-700 border border-emerald-200',
    RECEPTIONIST: 'bg-purple-50 text-purple-700 border border-purple-200',
    TECHNICIAN:   'bg-sky-50 text-sky-700 border border-sky-200',
    PATIENT:      'bg-amber-50 text-amber-700 border border-amber-200',
  };

  // Action → icon + color label
  const ACTION_META = {
    // Patient
    BOOK_APPOINTMENT:      { icon: Calendar,      cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200', label: 'Đặt lịch' },
    CANCEL_APPOINTMENT:    { icon: XCircle,       cls: 'bg-rose-50 text-rose-700 border border-rose-200',         label: 'Hủy lịch' },
    RESCHEDULE_APPOINTMENT:{ icon: Activity,      cls: 'bg-sky-50 text-sky-700 border border-sky-200',            label: 'Đổi lịch' },
    PAYMENT:               { icon: TrendingUp,    cls: 'bg-indigo-50 text-indigo-700 border border-indigo-200',   label: 'Thanh toán' },
    AI_SKIN_ANALYSIS:      { icon: Database,      cls: 'bg-violet-50 text-violet-700 border border-violet-200',   label: 'AI Scan' },
    SUBMIT_FEEDBACK:       { icon: CheckCircle2,  cls: 'bg-amber-50 text-amber-700 border border-amber-200',      label: 'Đánh giá' },
    // Doctor
    CREATE_MEDICAL_RECORD: { icon: Stethoscope,   cls: 'bg-teal-50 text-teal-700 border border-teal-200',        label: 'Tạo hồ sơ bệnh án' },
    UPDATE_MEDICAL_RECORD: { icon: Stethoscope,   cls: 'bg-teal-50 text-teal-700 border border-teal-200',        label: 'Cập nhật hồ sơ' },
    PRESCRIBE_MEDICINE:    { icon: Database,      cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200', label: 'Kê đơn thuốc' },
    // Technician
    UPDATE_TREATMENT_RESULT:{ icon: Activity,     cls: 'bg-sky-50 text-sky-700 border border-sky-200',           label: 'Kết quả điều trị' },
    COMPLETE_TASK:         { icon: CheckCircle2,  cls: 'bg-sky-50 text-sky-700 border border-sky-200',           label: 'Hoàn thành thủ thuật' },
    UPLOAD_SCAN_RESULT:    { icon: Database,      cls: 'bg-sky-50 text-sky-700 border border-sky-200',           label: 'Upload kết quả soi' },
    // Receptionist
    CONFIRM_APPOINTMENT:   { icon: CheckCircle2,  cls: 'bg-purple-50 text-purple-700 border border-purple-200',  label: 'Xác nhận lịch hẹn' },
    UPDATE_PATIENT_INFO:   { icon: UserCog,       cls: 'bg-purple-50 text-purple-700 border border-purple-200',  label: 'Sửa thông tin BN' },
    CHECKIN:               { icon: Calendar,      cls: 'bg-purple-50 text-purple-700 border border-purple-200',  label: 'Check-in' },
  };

  // Staff-specific stat counts
  const staffStats = useMemo(() => ({
    staff_record:       ([])?.filter?.(l => l.category === 'staff_record').length,
    staff_prescription: ([])?.filter?.(l => l.category === 'staff_prescription').length,
    staff_treatment:    ([])?.filter?.(l => l.category === 'staff_treatment').length,
    staff_confirm:      ([])?.filter?.(l => l.category === 'staff_confirm').length,
    staff_patient_edit: ([])?.filter?.(l => l.category === 'staff_patient_edit').length,
  }), []);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-bold text-slate-900">Nhật ký hệ thống & hoạt động</h3>
        <p className="text-xs text-slate-500 mt-0.5">Theo dõi sự kiện hệ thống và hành động của người dùng</p>
      </div>
      {/* Inner tabs */}
      <div className="flex gap-2">
        {[['system','Nhật ký hệ thống'],['activity','Hoạt động người dùng']]?.map?.(([k,l]) => (
          <button key={k} onClick={() => setActiveInner(k)}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all border-none cursor-pointer ${
              activeInner === k ? 'bg-indigo-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {l}
          </button>
        ))}
      </div>
      {/* Patient activity stats (only show in activity tab) */}
      {activeInner === 'activity' && (
        <div className="space-y-3">
          {/* Patient group */}
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Hoạt động bệnh nhân
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { key:'all',        label:'Tất cả',         value: ([]).length, cls:'bg-slate-50 border-slate-200 text-slate-700',     icon: Activity },
              { key:'booking',    label:'Đặt lịch',       value: patientStats.booking,        cls:'bg-emerald-50 border-emerald-200 text-emerald-700', icon: Calendar },
              { key:'cancel',     label:'Hủy / Đổi lịch', value: patientStats.cancel + patientStats.reschedule, cls:'bg-rose-50 border-rose-200 text-rose-700', icon: XCircle },
              { key:'payment',    label:'Thanh toán',     value: patientStats.payment,        cls:'bg-indigo-50 border-indigo-200 text-indigo-700',   icon: TrendingUp },
              { key:'ai_scan',    label:'AI Skin Analysis',value: patientStats.ai_scan,       cls:'bg-violet-50 border-violet-200 text-violet-700',   icon: Database },
            ]?.map?.((c, i) => (
              <motion.div key={c.key} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                onClick={() => { setFilterCat(c.key); setFilterRole('all'); }}
                className={`border rounded-2xl p-3 text-center cursor-pointer hover:shadow-sm transition-all ${c.cls} ${filterCat === c.key ? 'ring-2 ring-offset-1 ring-amber-400' : ''}`}>
                <c.icon className="w-4 h-4 mx-auto mb-1.5 opacity-80" />
                <p className="text-xl font-black">{c.value}</p>
                <p className="text-[10px] font-semibold text-slate-500 mt-0.5 leading-snug">{c.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Staff group */}
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 pt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Hoạt động nhân viên
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { key:'staff_record',       label:'Tạo/Sửa hồ sơ',    value: staffStats.staff_record,       cls:'bg-teal-50 border-teal-200 text-teal-700',      icon: Stethoscope },
              { key:'staff_prescription', label:'Kê đơn thuốc',     value: staffStats.staff_prescription, cls:'bg-emerald-50 border-emerald-200 text-emerald-700', icon: Database },
              { key:'staff_treatment',    label:'KQ điều trị',      value: staffStats.staff_treatment,    cls:'bg-sky-50 border-sky-200 text-sky-700',          icon: Activity },
              { key:'staff_confirm',      label:'Xác nhận lịch hẹn',value: staffStats.staff_confirm,      cls:'bg-purple-50 border-purple-200 text-purple-700', icon: CheckCircle2 },
              { key:'staff_patient_edit', label:'Sửa TT bệnh nhân', value: staffStats.staff_patient_edit, cls:'bg-pink-50 border-pink-200 text-pink-700',       icon: UserCog },
            ]?.map?.((c, i) => (
              <motion.div key={c.key} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 + 0.25 }}
                onClick={() => { setFilterCat(c.key); setFilterRole('all'); }}
                className={`border rounded-2xl p-3 text-center cursor-pointer hover:shadow-sm transition-all ${c.cls} ${filterCat === c.key ? 'ring-2 ring-offset-1 ring-emerald-400' : ''}`}>
                <c.icon className="w-4 h-4 mx-auto mb-1.5 opacity-80" />
                <p className="text-xl font-black">{c.value}</p>
                <p className="text-[10px] font-semibold text-slate-500 mt-0.5 leading-snug">{c.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}
      {/* Search + filter */}
      <div className="flex flex-wrap gap-3 items-center bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm kiếm người dùng, hành động..."
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-400" />
        </div>
        {activeInner === 'system' ? (
          <GlassSelect value={filterSev} onChange={setFilterSev}
            options={[{ value: 'all', label: 'Tất cả mức độ' }, ...['Success','Info','Warning','Error'].map(s => ({ value: s, label: s }))]}
            buttonClassName="px-3 py-2.5 text-sm" />
        ) : (
          <GlassSelect value={filterRole} onChange={(v) => { setFilterRole(v); setFilterCat('all'); }}
            options={[{ value: 'all', label: 'Tất cả vai trò' }, ...['ADMIN','DOCTOR','RECEPTIONIST','TECHNICIAN','PATIENT'].map(r => ({ value: r, label: r }))]}
            buttonClassName="px-3 py-2.5 text-sm" />
        )}
        <span className="text-xs text-slate-400 ml-auto">
          {activeInner === 'system' ? sysFiltered.length : actFiltered.length} mục
        </span>
      </div>
      {/* List */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {activeInner === 'system' ? (
          sysFiltered.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {sysFiltered?.map?.((log, i) => (
                <motion.div key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50/60 transition-colors">
                  <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${SEV_DOT[log.severity] || 'bg-slate-400'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <span className="text-xs font-black text-slate-800 font-mono">{log.action}</span>
                        <span className="ml-2 text-[10px] text-slate-400">→ {log.target}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${SEV_BADGE[log.severity] || ''}`}>{log.severity}</span>
                        <span className="text-[10px] text-slate-400">{fmtTime(log.timestamp)}</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{log.details}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{log.actor}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : <p className="text-center py-10 text-slate-400 text-sm">Không tìm thấy sự kiện.</p>
        ) : (
          actFiltered.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {actFiltered?.map?.((log, i) => {
                const actionMeta = ACTION_META[log.action];
                const ActionIcon = actionMeta?.icon;
                return (
                  <motion.div key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50/60 transition-colors">
                    {/* Action icon (patient-specific) */}
                    {ActionIcon && (
                      <div className={`p-1.5 rounded-xl shrink-0 mt-0.5 ${actionMeta.cls}`}>
                        <ActionIcon className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-800">{log.userName}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ROLE_BADGE[log.role] || ''}`}>{log.role}</span>
                          {/* Action label */}
                          {actionMeta ? (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${actionMeta.cls}`}>{actionMeta.label}</span>
                          ) : (
                            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-mono">{log.action}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] bg-indigo-50 text-indigo-600 border border-indigo-200 px-2 py-0.5 rounded-full font-semibold">{log.module}</span>
                          <span className="text-[10px] text-slate-400">{fmtTime(log.timestamp)}</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{log.details}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : <p className="text-center py-10 text-slate-400 text-sm">Không tìm thấy hoạt động.</p>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// AppointmentViewHub — Xem lịch hẹn (chi tiết + trạng thái)
// ══════════════════════════════════════════════════════════════════════════════

// Dùng inline style để tránh Tailwind purge dynamic class
function aptStatusStyle(status) {
  const map = {
    'Đã xác nhận':  { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0', dot: '#22c55e' },
    'Chờ xác nhận': { bg: '#fffbeb', color: '#b45309', border: '#fde68a', dot: '#f59e0b' },
    'Đang chờ':     { bg: '#f0fdfa', color: '#0f766e', border: '#99f6e4', dot: '#14b8a6' },
    'Đã khám':      { bg: '#f0f9ff', color: '#0369a1', border: '#bae6fd', dot: '#0ea5e9' },
    'Đã hủy':       { bg: '#fff1f2', color: '#be123c', border: '#fecdd3', dot: '#f43f5e' },
  };
  return map[status] || { bg: '#f8fafc', color: '#475569', border: '#e2e8f0', dot: '#94a3b8' };
}

function aptPaymentStyle(status) {
  const map = {
    'Đã thanh toán':   { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
    'Chưa thanh toán': { bg: '#fffbeb', color: '#b45309', border: '#fde68a' },
    'Chờ xác nhận':    { bg: '#f0f9ff', color: '#0369a1', border: '#bae6fd' },
  };
  return map[status] || { bg: '#f8fafc', color: '#475569', border: '#e2e8f0' };
}

function StatusPill({ text, styleFn }) {
  if (!text) return null;
  const s = styleFn(text);
  return (
    <span
      className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
      style={{ background: s.bg, color: s.color, borderColor: s.border }}
    >
      {text}
    </span>
  );
}

// ── Lấy appointments từ localStorage (ngoài component để tránh stale) ──────
function loadAppointments() {
  try {
    const s = localStorage.getItem('dermasmart_appointments');
    if (s) {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Validate: skip if data has English status (stale legacy data)
        const first = parsed[0];
        const isLegacy = first && ['Pending','Completed','Cancelled','Confirmed'].includes(first.status);
        if (!isLegacy) return parsed;
      }
    }
  } catch { /* ignore */ }
  return ([]);
}

// ── Sub: Chi tiết lịch hẹn ──────────────────────────────────────────────────
function AptDetailTab({ allApts }) {
  const { doctors } = useDoctors();
  const [search, setSearch]       = useState('');
  const [filterDoc, setFilterDoc] = useState('all');
  const [expandId, setExpandId]   = useState(null);

  // Safety: ensure allApts is always array
  const apts = Array.isArray(allApts) ? allApts : [];

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return apts?.filter?.(a =>
      a && (
        !q
        || (a.patientName||'').toLowerCase().includes(q)
        || (a.doctorName||'').toLowerCase().includes(q)
        || (a.service||'').toLowerCase().includes(q)
        || (a.id||'').toLowerCase().includes(q)
      )
      && (filterDoc === 'all' || a.doctorId === filterDoc)).sort((a,b) => (b.date||'').localeCompare(a.date||''));
  }, [apts, search, filterDoc]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm bệnh nhân, bác sĩ, dịch vụ, mã lịch hẹn..."
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20" />
        </div>
        <GlassSelect value={filterDoc} onChange={setFilterDoc}
          options={[{ value: 'all', label: 'Tất cả bác sĩ' }, ...(doctors || []).map(d => ({ value: String(d.id), label: d.name }))]}
          buttonClassName="px-3 py-2.5 text-sm" />
        <span className="text-xs text-slate-400 font-medium ml-auto">{filtered.length} lịch hẹn</span>
      </div>
      {/* List */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {filtered.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {filtered?.map?.((apt, i) => {
              const isExp = expandId === apt.id;
              const st = aptStatusStyle(apt.status);
              return (
                <motion.div key={apt.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                  <div className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/70 transition-colors cursor-pointer"
                    onClick={() => setExpandId(isExp ? null : apt.id)}>
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: st.dot }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-800">{apt.patientName}</span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-600 truncate max-w-[160px]">{apt.doctorName}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">{apt.date} {apt.time} • {apt.service}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                      <StatusPill text={apt.status}        styleFn={aptStatusStyle} />
                      <StatusPill text={apt.paymentStatus} styleFn={aptPaymentStyle} />
                      <span className="text-xs font-bold text-slate-700">{apt.fee}</span>
                      {isExp ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </div>
                  {/* Expanded detail */}
                  <AnimatePresence>
                    {isExp && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-slate-100 bg-slate-50/50"
                      >
                        <div className="px-11 py-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {[
                            { label: 'Mã lịch hẹn',   value: apt.id },
                            { label: 'Bệnh nhân',      value: `${apt.patientName} (${apt.patientId})` },
                            { label: 'Bác sĩ',          value: apt.doctorName },
                            { label: 'Dịch vụ',         value: apt.service },
                            { label: 'Ngày & Giờ',      value: `${apt.date} lúc ${apt.time}` },
                            { label: 'Phí dịch vụ',    value: apt.fee },
                            { label: 'Thanh toán',      value: apt.paymentStatus },
                            { label: 'Trạng thái',      value: apt.status },
                            { label: 'Chẩn đoán',       value: apt.diagnosis || '—' },
                            { label: 'Đơn thuốc',       value: apt.prescription || '—' },
                            { label: 'Ghi chú',         value: apt.notes || '—' },
                            apt.voucherId ? { label: 'Ưu đãi', value: `Tiết kiệm ${Number(apt.discount||0).toLocaleString('vi-VN')}đ` } : null,
                          ]?.filter(Boolean)?.map?.((f, fi) => (
                            <div key={fi} className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{f.label}</p>
                              <p className="text-xs font-semibold text-slate-700 break-words">{f.value}</p>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-400 font-semibold">Không tìm thấy lịch hẹn nào.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub: Trạng thái lịch hẹn ────────────────────────────────────────────────
function AptStatusTab({ allApts }) {
  const { doctors } = useDoctors();
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDoc, setFilterDoc]       = useState('all');
  const [search, setSearch]             = useState('');
  const [sortBy, setSortBy]             = useState('date-desc');

  const ALL_STATUSES = ['Đã xác nhận','Chờ xác nhận','Đang chờ','Đã khám','Đã hủy'];

  // Safety
  const apts = Array.isArray(allApts) ? allApts : [];

  const stats = useMemo(() => {
    const m = {};
    apts.forEach(a => { if (a?.status) m[a.status] = (m[a.status]||0)+1; });
    return m;
  }, [apts]);

  const paidCount   = useMemo(() => apts?.filter?.(a => a?.paymentStatus === 'Đã thanh toán').length, [apts]);
  const unpaidCount = useMemo(() => apts?.filter?.(a => a?.paymentStatus === 'Chưa thanh toán' && a?.status !== 'Đã hủy').length, [apts]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let list = apts?.filter?.(a => {
      if (!a) return false;
      const matchQ = !q || (a.patientName||'').toLowerCase().includes(q) || (a.doctorName||'').toLowerCase().includes(q);
      return matchQ && (filterStatus === 'all' || a.status === filterStatus) && (filterDoc === 'all' || a.doctorId === filterDoc);
    });
    if (sortBy === 'date-desc') list = [...list].sort((a,b) => (b.date||'').localeCompare(a.date||''));
    if (sortBy === 'date-asc')  list = [...list].sort((a,b) => (a.date||'').localeCompare(b.date||''));
    return list;
  }, [apts, search, filterStatus, filterDoc, sortBy]);

  return (
    <div className="space-y-4">
      {/* Status summary cards — dùng inline style tránh purge */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {ALL_STATUSES?.map?.((status, i) => {
          const s = aptStatusStyle(status);
          const isActive = filterStatus === status;
          return (
            <motion.div key={status}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              onClick={() => setFilterStatus(filterStatus === status ? 'all' : status)}
              className={`border rounded-2xl p-3 text-center cursor-pointer hover:shadow-sm transition-all ${isActive ? 'ring-2 ring-offset-1 ring-indigo-400' : ''}`}
              style={{ background: s.bg, borderColor: s.border }}
            >
              <div className="w-2.5 h-2.5 rounded-full mx-auto mb-2" style={{ background: s.dot }} />
              <p className="text-2xl font-black" style={{ color: s.color }}>{stats[status]||0}</p>
              <p className="text-[10px] font-semibold text-slate-600 mt-0.5 leading-snug">{status}</p>
            </motion.div>
          );
        })}
      </div>
      {/* Payment quick stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <p className="text-xl font-black text-emerald-700">{paidCount}</p>
            <p className="text-xs font-semibold text-slate-600">Đã thanh toán</p>
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
          <Clock className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <p className="text-xl font-black text-amber-700">{unpaidCount}</p>
            <p className="text-xs font-semibold text-slate-600">Chưa thanh toán</p>
          </div>
        </div>
      </div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm bệnh nhân, bác sĩ..."
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20" />
        </div>
        <GlassSelect value={filterStatus} onChange={setFilterStatus}
          options={[{ value: 'all', label: 'Tất cả trạng thái' }, ...(ALL_STATUSES || []).map(s => ({ value: s, label: s }))]}
          buttonClassName="px-3 py-2.5 text-sm" />
        <GlassSelect value={filterDoc} onChange={setFilterDoc}
          options={[{ value: 'all', label: 'Tất cả bác sĩ' }, ...(doctors || []).map(d => ({ value: String(d.id), label: d.name }))]}
          buttonClassName="px-3 py-2.5 text-sm" />
        <GlassSelect value={sortBy} onChange={setSortBy}
          options={[{ value: 'date-desc', label: 'Mới nhất trước' }, { value: 'date-asc', label: 'Cũ nhất trước' }]}
          buttonClassName="px-3 py-2.5 text-sm" />
        <span className="text-xs text-slate-400 font-medium ml-auto">{filtered.length}/{allApts.length}</span>
      </div>
      {/* List */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {filtered.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {filtered?.map?.((apt, i) => {
              const st = aptStatusStyle(apt.status);
              return (
                <motion.div key={apt.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/60 transition-colors">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: st.dot }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-slate-800">{apt.patientName}</span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-600 truncate">{apt.doctorName}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{apt.date} {apt.time} • {apt.service}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                    <StatusPill text={apt.status}        styleFn={aptStatusStyle} />
                    <StatusPill text={apt.paymentStatus} styleFn={aptPaymentStyle} />
                    <span className="text-xs font-semibold text-slate-700">{apt.fee}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-400 font-semibold">Không tìm thấy lịch hẹn.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Hub wrapper ─────────────────────────────────────────────────────────────
function AppointmentViewHub() {
  const [sub, setSub] = useState('detail');
  // Load once — không dùng useMemo để tránh closure cũ
  const allApts = loadAppointments();

  return (
    <div className="space-y-5">
      <div className="flex gap-1 bg-slate-100 rounded-2xl p-1.5">
        {[
          { id: 'detail', label: 'Chi tiết lịch hẹn',   icon: ChevronDown },
          { id: 'status', label: 'Trạng thái lịch hẹn',  icon: CheckCircle2 },
        ]?.map?.(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setSub(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border-none cursor-pointer ${
                sub === t.id
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'bg-transparent text-slate-500 hover:text-slate-700 hover:bg-white/60'
              }`}>
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
        <span className="ml-auto flex items-center text-xs text-slate-400 pr-2 font-medium">
          {allApts.length} lịch hẹn
        </span>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={sub}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}>
          {sub === 'detail' && <AptDetailTab allApts={allApts} />}
          {sub === 'status' && <AptStatusTab allApts={allApts} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ── Sub: Chi tiết lịch hẹn ──────────────────────────────────────────────────
const TABS = [
  { id: 'revenue',      label: 'Doanh thu',          icon: TrendingUp },
  { id: 'system',       label: 'Báo cáo hệ thống',   icon: Database },
  { id: 'appointments', label: 'Xem lịch hẹn',        icon: Calendar },
  { id: 'logs',         label: 'Nhật ký hoạt động',   icon: Activity },
];

// Sub-tabs bên trong "Báo cáo hệ thống"
const SYSTEM_SUBTABS = [
  { id: 'service',     label: 'Báo cáo dịch vụ',  icon: Stethoscope },
  { id: 'appointment', label: 'Báo cáo lịch hẹn', icon: Calendar },
  { id: 'employee',    label: 'Báo cáo nhân viên', icon: UserCog },
];

function SystemReportHub() {
  const [sub, setSub] = useState('service');
  return (
    <div className="space-y-5">
      {/* Inner sub-tab bar */}
      <div className="flex gap-1 bg-slate-100 rounded-2xl p-1.5 flex-wrap">
        {SYSTEM_SUBTABS?.map?.(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setSub(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border-none cursor-pointer ${
                sub === t.id
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'bg-transparent text-slate-500 hover:text-slate-700 hover:bg-white/60'
              }`}>
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>
      {/* Sub content */}
      <AnimatePresence mode="wait">
        <motion.div key={sub}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}>
          {sub === 'service'     && <ServiceReportTab />}
          {sub === 'appointment' && <AppointmentReportTab />}
          {sub === 'employee'    && <EmployeeReportTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('revenue');

  return (
    <div className="space-y-6">
      {/* Main tab bar */}
      <div className="flex gap-1 bg-slate-100 rounded-2xl p-1.5 flex-wrap">
        {TABS?.map?.(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border-none cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'bg-transparent text-slate-500 hover:text-slate-700 hover:bg-white/50'
              }`}>
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>
      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.18 }}>
          {activeTab === 'revenue' && (
            <Suspense fallback={<div className="py-20 text-center text-slate-400 text-sm">Đang tải...</div>}>
              <RevenueStatistics />
            </Suspense>
          )}
          {activeTab === 'system' && <SystemReportHub />}
          {activeTab === 'appointments' && <AppointmentViewHub />}
          {activeTab === 'logs'   && <SystemActivityTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
