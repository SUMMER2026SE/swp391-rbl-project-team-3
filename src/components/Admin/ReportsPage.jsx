import React, { useState, useMemo, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, Activity, Calendar, Search, Stethoscope,
  CheckCircle2, Clock, AlertCircle, Info, ShieldAlert,
  Database, User, UserCog, Wrench, ChevronDown, ChevronUp,
  BarChart3, TrendingDown, Award, XCircle,
} from 'lucide-react';
import {
  mockSystemLogs,
  mockUserActivityLogs,
  mockAppointments,
  mockServices,
  doctors,
} from '../../mockData';

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
  const [period, setPeriod] = useState('all');

  // Load appointments once
  const allApts = useMemo(() => {
    try {
      const s = localStorage.getItem('dermasmart_appointments');
      return s ? JSON.parse(s) : mockAppointments;
    } catch { return mockAppointments; }
  }, []);

  // Filter by period
  const apts = useMemo(() => {
    if (period === 'all') return allApts;
    const now = new Date('2026-06-09');
    return allApts.filter(a => {
      const d = new Date(a.date);
      if (period === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      if (period === 'q2')    return d.getMonth() >= 3 && d.getMonth() <= 5 && d.getFullYear() === 2026;
      if (period === 'year')  return d.getFullYear() === 2026;
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

  // Monthly trend — last 6 months for top 3 services
  const MONTHS = ['T1','T2','T3','T4','T5','T6'];
  const top3 = serviceStats.slice(0, 3).map(s => s.name);
  const monthlyTrend = useMemo(() => {
    return MONTHS.map((label, mi) => {
      const row = { label };
      top3.forEach(svc => {
        row[svc] = allApts.filter(a => {
          const m = new Date(a.date).getMonth();
          return m === mi && a.service === svc && a.status !== 'Đã hủy';
        }).length;
      });
      return row;
    });
  }, [allApts, top3.join(',')]);

  const TREND_COLORS = ['#6366f1','#10b981','#f59e0b'];
  const totalUsed   = serviceStats.reduce((s, x) => s + x.total, 0);
  const totalDone   = serviceStats.reduce((s, x) => s + x.done, 0);
  const totalRev    = serviceStats.reduce((s, x) => s + x.revenue, 0);
  const cancelRate  = totalUsed > 0 ? ((serviceStats.reduce((s,x)=>s+x.cancelled,0)/totalUsed)*100).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      {/* Header + period */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Báo cáo Dịch vụ</h3>
          <p className="text-xs text-slate-500 mt-0.5">Thống kê lượt sử dụng, doanh thu và xu hướng theo dịch vụ</p>
        </div>
        <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
          {[['all','Tất cả'],['month','Tháng này'],['q2','Quý 2'],['year','Năm 2026']].map(([k,l]) => (
            <button key={k} onClick={() => setPeriod(k)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-none cursor-pointer ${
                period === k ? 'bg-white text-indigo-700 shadow-sm' : 'bg-transparent text-slate-500 hover:text-slate-700'}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tổng lượt đặt',  value: totalUsed,            color: 'indigo',  icon: Calendar },
          { label: 'Lượt hoàn thành',value: totalDone,             color: 'emerald', icon: CheckCircle2 },
          { label: 'Tỷ lệ hủy',      value: `${cancelRate}%`,     color: 'rose',    icon: XCircle },
          { label: 'Doanh thu DV',   value: fmtVND(totalRev),     color: 'amber',   icon: TrendingUp },
        ].map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className={`bg-${c.color}-50 border border-${c.color}-100 rounded-2xl p-4 shadow-sm`}>
            <c.icon className={`w-5 h-5 text-${c.color}-500 mb-2`} />
            <p className={`text-2xl font-black text-${c.color}-700`}>{c.value}</p>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">{c.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Top services table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-bold text-slate-800">Top dịch vụ sử dụng nhiều nhất</span>
        </div>
        <div className="divide-y divide-slate-100">
          {serviceStats.map((s, i) => {
            const usePct   = totalUsed > 0 ? (s.total / totalUsed) * 100 : 0;
            const cancelPct = s.total > 0 ? (s.cancelled / s.total) * 100 : 0;
            const RANK_CLS  = i === 0 ? 'bg-amber-400 text-white' : i === 1 ? 'bg-slate-300 text-white' : i === 2 ? 'bg-orange-300 text-white' : 'bg-slate-100 text-slate-500';
            return (
              <motion.div key={s.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                className="px-5 py-4 hover:bg-slate-50/60 transition-colors">
                <div className="flex items-center gap-4">
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${RANK_CLS}`}>{i+1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                      <span className="text-sm font-bold text-slate-800 truncate">{s.name}</span>
                      <div className="flex items-center gap-3 text-xs shrink-0">
                        <span className="text-slate-500">{s.total} lượt</span>
                        <span className="text-emerald-600 font-semibold">{s.done} hoàn thành</span>
                        <span className="text-rose-500 font-semibold">{cancelPct.toFixed(0)}% hủy</span>
                        <span className="text-indigo-700 font-black">{fmtVND(s.revenue)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <MiniBar pct={usePct} color="#6366f1" />
                      <span className="text-[10px] text-slate-400 w-8 text-right">{usePct.toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Revenue per service bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-indigo-500" />
          <span className="text-sm font-bold text-slate-800">Doanh thu theo dịch vụ</span>
        </div>
        <div className="space-y-3">
          {serviceStats.filter(s => s.revenue > 0).map((s, i) => {
            const maxRev = Math.max(...serviceStats.map(x => x.revenue), 1);
            return (
              <div key={s.name} className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-600 w-44 truncate shrink-0">{s.name}</span>
                <MiniBar pct={(s.revenue / maxRev) * 100} color="#10b981" />
                <span className="text-xs font-bold text-emerald-700 w-28 text-right shrink-0">{fmtVND(s.revenue)}</span>
              </div>
            );
          })}
          {serviceStats.every(s => s.revenue === 0) && (
            <p className="text-sm text-slate-400 text-center py-4">Chưa có dữ liệu doanh thu.</p>
          )}
        </div>
      </div>

      {/* Monthly trend */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-violet-500" />
            <span className="text-sm font-bold text-slate-800">Xu hướng sử dụng dịch vụ theo tháng</span>
          </div>
          <div className="flex items-center gap-3">
            {top3.map((name, i) => (
              <span key={name} className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: TREND_COLORS[i] }} />
                {name.length > 20 ? name.slice(0,20)+'…' : name}
              </span>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="py-2 px-3 text-left font-bold text-slate-500 uppercase tracking-wider">Tháng</th>
                {top3.map((name, i) => (
                  <th key={name} className="py-2 px-3 text-center font-bold" style={{ color: TREND_COLORS[i] }}>
                    {name.length > 18 ? name.slice(0,18)+'…' : name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {monthlyTrend.map((row, ri) => (
                <tr key={row.label} className={`border-b border-slate-50 ${ri % 2 === 0 ? 'bg-slate-50/30' : ''}`}>
                  <td className="py-2.5 px-3 font-bold text-slate-700">{row.label}</td>
                  {top3.map((name, i) => (
                    <td key={name} className="py-2.5 px-3 text-center font-semibold" style={{ color: row[name] > 0 ? TREND_COLORS[i] : '#94a3b8' }}>
                      {row[name] || 0}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 2 — Báo cáo lịch hẹn
// ══════════════════════════════════════════════════════════════════════════════
function AppointmentReportTab() {
  const [filterDoctor, setFilterDoctor] = useState('all');

  const allApts = useMemo(() => {
    try { const s = localStorage.getItem('dermasmart_appointments'); return s ? JSON.parse(s) : mockAppointments; }
    catch { return mockAppointments; }
  }, []);

  const apts = useMemo(() =>
    filterDoctor === 'all' ? allApts : allApts.filter(a => a.doctorId === filterDoctor),
  [allApts, filterDoctor]);

  const total     = apts.length;
  const done      = apts.filter(a => a.status === 'Đã khám').length;
  const cancelled = apts.filter(a => a.status === 'Đã hủy').length;
  const pending   = apts.filter(a => ['Đang chờ','Đã xác nhận','Chờ xác nhận'].includes(a.status)).length;
  const online    = apts.filter(a => a.notes?.includes('Portal') || a.notes?.includes('website')).length;

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
    return Object.entries(m).sort((a,b) => a[0].localeCompare(b[0])).map(([k,v]) => ({ month: k, ...v }));
  }, [apts]);

  // Peak hours
  const byHour = useMemo(() => {
    const m = {};
    apts.forEach(a => { if (a.time) { m[a.time] = (m[a.time] || 0) + 1; } });
    return Object.entries(m).sort((a,b) => b[1]-a[1]).slice(0,6).map(([t,c]) => ({ time: t, count: c }));
  }, [apts]);

  const maxHour = Math.max(...byHour.map(h => h.count), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Báo cáo Lịch hẹn</h3>
          <p className="text-xs text-slate-500 mt-0.5">Tổng quan trạng thái, xu hướng và khung giờ cao điểm</p>
        </div>
        <select value={filterDoctor} onChange={e => setFilterDoctor(e.target.value)}
          className="px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl outline-none cursor-pointer shadow-sm">
          <option value="all">Tất cả bác sĩ</option>
          {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Tổng lịch hẹn', value: total,                color: 'indigo',  icon: Calendar },
          { label: 'Hoàn thành',    value: done,                  color: 'emerald', icon: CheckCircle2 },
          { label: 'Đã hủy',        value: cancelled,             color: 'rose',    icon: XCircle },
          { label: 'Đang chờ',      value: pending,               color: 'amber',   icon: Clock },
          { label: 'Đặt online',    value: `${online}`,           color: 'sky',     icon: TrendingUp },
        ].map((c, i) => (
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
              {byMonth.map((row, i) => {
                const maxT = Math.max(...byMonth.map(r => r.total), 1);
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
              {byHour.map((h, i) => (
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
  const allApts = useMemo(() => {
    try { const s = localStorage.getItem('dermasmart_appointments'); return s ? JSON.parse(s) : mockAppointments; }
    catch { return mockAppointments; }
  }, []);

  const docStats = useMemo(() => {
    return doctors.map(doc => {
      const mine = allApts.filter(a => a.doctorId === doc.id);
      const done = mine.filter(a => a.status === 'Đã khám');
      const cancelled = mine.filter(a => a.status === 'Đã hủy');
      const patients = new Set(done.map(a => a.patientId)).size;
      const revenue = done.reduce((s, a) => s + parseFee(a.fee), 0);
      const completionRate = mine.length > 0 ? ((done.length / mine.length) * 100).toFixed(0) : 0;
      return { doc, total: mine.length, done: done.length, cancelled: cancelled.length, patients, revenue, completionRate };
    }).sort((a, b) => b.revenue - a.revenue);
  }, [allApts]);

  const maxRev = Math.max(...docStats.map(d => d.revenue), 1);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-slate-900">Báo cáo Nhân viên</h3>
        <p className="text-xs text-slate-500 mt-0.5">Hiệu suất làm việc, số bệnh nhân và doanh thu của từng bác sĩ / KTV</p>
      </div>

      {/* Doctor cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {docStats.map((d, i) => (
          <motion.div key={d.doc.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start gap-3 mb-4">
              <img src={d.doc.image} alt="" className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">{d.doc.name}</p>
                <p className="text-xs text-slate-500 truncate">{d.doc.title}</p>
                <div className="flex items-center gap-1 mt-1">
                  {[0,1,2,3,4].map(s => (
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
              ].map(item => (
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

  const sysFiltered = useMemo(() => mockSystemLogs.filter(l => {
    const q = search.toLowerCase();
    return (!q || l.action.toLowerCase().includes(q) || l.details.toLowerCase().includes(q) || l.actor.toLowerCase().includes(q))
        && (filterSev === 'all' || l.severity === filterSev);
  }), [search, filterSev]);

  const actFiltered = useMemo(() => mockUserActivityLogs.filter(l => {
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
    const pts = mockUserActivityLogs.filter(l => l.role === 'PATIENT');
    return {
      booking:     pts.filter(l => l.category === 'booking').length,
      cancel:      pts.filter(l => l.category === 'cancel').length,
      reschedule:  pts.filter(l => l.category === 'reschedule').length,
      payment:     pts.filter(l => l.category === 'payment').length,
      ai_scan:     pts.filter(l => l.category === 'ai_scan').length,
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
    staff_record:       mockUserActivityLogs.filter(l => l.category === 'staff_record').length,
    staff_prescription: mockUserActivityLogs.filter(l => l.category === 'staff_prescription').length,
    staff_treatment:    mockUserActivityLogs.filter(l => l.category === 'staff_treatment').length,
    staff_confirm:      mockUserActivityLogs.filter(l => l.category === 'staff_confirm').length,
    staff_patient_edit: mockUserActivityLogs.filter(l => l.category === 'staff_patient_edit').length,
  }), []);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-bold text-slate-900">Nhật ký hệ thống & hoạt động</h3>
        <p className="text-xs text-slate-500 mt-0.5">Theo dõi sự kiện hệ thống và hành động của người dùng</p>
      </div>

      {/* Inner tabs */}
      <div className="flex gap-2">
        {[['system','Nhật ký hệ thống'],['activity','Hoạt động người dùng']].map(([k,l]) => (
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
              { key:'all',        label:'Tất cả',         value: mockUserActivityLogs.length, cls:'bg-slate-50 border-slate-200 text-slate-700',     icon: Activity },
              { key:'booking',    label:'Đặt lịch',       value: patientStats.booking,        cls:'bg-emerald-50 border-emerald-200 text-emerald-700', icon: Calendar },
              { key:'cancel',     label:'Hủy / Đổi lịch', value: patientStats.cancel + patientStats.reschedule, cls:'bg-rose-50 border-rose-200 text-rose-700', icon: XCircle },
              { key:'payment',    label:'Thanh toán',     value: patientStats.payment,        cls:'bg-indigo-50 border-indigo-200 text-indigo-700',   icon: TrendingUp },
              { key:'ai_scan',    label:'AI Skin Analysis',value: patientStats.ai_scan,       cls:'bg-violet-50 border-violet-200 text-violet-700',   icon: Database },
            ].map((c, i) => (
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
            ].map((c, i) => (
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
          <select value={filterSev} onChange={e => setFilterSev(e.target.value)}
            className="px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none cursor-pointer">
            <option value="all">Tất cả mức độ</option>
            {['Success','Info','Warning','Error'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        ) : (
          <select value={filterRole} onChange={e => { setFilterRole(e.target.value); setFilterCat('all'); }}
            className="px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none cursor-pointer">
            <option value="all">Tất cả vai trò</option>
            {['ADMIN','DOCTOR','RECEPTIONIST','TECHNICIAN','PATIENT'].map(r => <option key={r} value={r}>{r}</option>)}
          </select>
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
              {sysFiltered.map((log, i) => (
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
              {actFiltered.map((log, i) => {
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
  return mockAppointments;
}

// ── Sub: Chi tiết lịch hẹn ──────────────────────────────────────────────────
function AptDetailTab({ allApts }) {
  const [search, setSearch]       = useState('');
  const [filterDoc, setFilterDoc] = useState('all');
  const [expandId, setExpandId]   = useState(null);

  // Safety: ensure allApts is always array
  const apts = Array.isArray(allApts) ? allApts : [];

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return apts.filter(a =>
      a && (
        !q
        || (a.patientName||'').toLowerCase().includes(q)
        || (a.doctorName||'').toLowerCase().includes(q)
        || (a.service||'').toLowerCase().includes(q)
        || (a.id||'').toLowerCase().includes(q)
      )
      && (filterDoc === 'all' || a.doctorId === filterDoc)
    ).sort((a,b) => (b.date||'').localeCompare(a.date||''));
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
        <select value={filterDoc} onChange={e => setFilterDoc(e.target.value)}
          className="px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none cursor-pointer">
          <option value="all">Tất cả bác sĩ</option>
          {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <span className="text-xs text-slate-400 font-medium ml-auto">{filtered.length} lịch hẹn</span>
      </div>

      {/* List */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {filtered.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {filtered.map((apt, i) => {
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
                          ].filter(Boolean).map((f, fi) => (
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

  const paidCount   = useMemo(() => apts.filter(a => a?.paymentStatus === 'Đã thanh toán').length, [apts]);
  const unpaidCount = useMemo(() => apts.filter(a => a?.paymentStatus === 'Chưa thanh toán' && a?.status !== 'Đã hủy').length, [apts]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let list = apts.filter(a => {
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
        {ALL_STATUSES.map((status, i) => {
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
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none cursor-pointer">
          <option value="all">Tất cả trạng thái</option>
          {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterDoc} onChange={e => setFilterDoc(e.target.value)}
          className="px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none cursor-pointer">
          <option value="all">Tất cả bác sĩ</option>
          {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          className="px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none cursor-pointer">
          <option value="date-desc">Mới nhất trước</option>
          <option value="date-asc">Cũ nhất trước</option>
        </select>
        <span className="text-xs text-slate-400 font-medium ml-auto">{filtered.length}/{allApts.length}</span>
      </div>

      {/* List */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {filtered.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {filtered.map((apt, i) => {
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
        ].map(t => {
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
        {SYSTEM_SUBTABS.map(t => {
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
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Doanh thu & Báo cáo</h2>
        <p className="text-sm text-slate-500 mt-1">Tổng hợp báo cáo toàn hệ thống phòng khám</p>
      </div>

      {/* Main tab bar */}
      <div className="flex gap-1 bg-slate-100 rounded-2xl p-1.5 flex-wrap">
        {TABS.map(tab => {
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
