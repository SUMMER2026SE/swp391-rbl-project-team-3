import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, TrendingDown, DollarSign, Calendar, Users,
  Stethoscope, CreditCard, BarChart3, PieChart, ArrowUpRight,
  ArrowDownRight, Filter, Download, RefreshCw, Pill,
  Package, Wifi, Banknote, ChevronDown,
} from 'lucide-react';
import { mockAppointments, doctors, mockServices } from '../../mockData';

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Parse "X,000,000 VNĐ" → number
function parseFee(fee) {
  if (!fee) return 0;
  return parseInt(fee.replace(/[^0-9]/g, ''), 10) || 0;
}

function formatVND(amount) {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000)     return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000)         return `${(amount / 1_000).toFixed(0)}K`;
  return amount.toLocaleString('vi-VN');
}

function formatVNDFull(amount) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

// Seed mock revenue data extending mockAppointments
const MOCK_EXTRA_REVENUE = [
  // Offline cash payments (walk-in)
  { id: 'rev-01', date: '2026-05-02', type: 'service', source: 'Peel Da Sinh Học', amount: 800000, doctorId: 'doc-02', method: 'Tiền mặt', category: 'Dịch vụ' },
  { id: 'rev-02', date: '2026-05-05', type: 'medicine', source: 'Retinol Serum + Sunscreen', amount: 450000, doctorId: 'doc-01', method: 'Tiền mặt', category: 'Thuốc & Sản phẩm' },
  { id: 'rev-03', date: '2026-05-08', type: 'package', source: 'Gói điều trị nám 6 buổi', amount: 9600000, doctorId: 'doc-02', method: 'Chuyển khoản', category: 'Gói dịch vụ' },
  { id: 'rev-04', date: '2026-05-12', type: 'service', source: 'Tiêm Filler & Botox', amount: 3000000, doctorId: 'doc-01', method: 'Online (VNPay)', category: 'Dịch vụ' },
  { id: 'rev-05', date: '2026-05-15', type: 'medicine', source: 'Hydrocortisone + Cetirizine', amount: 180000, doctorId: 'doc-01', method: 'Tiền mặt', category: 'Thuốc & Sản phẩm' },
  { id: 'rev-06', date: '2026-05-18', type: 'service', source: 'Trị Liệu Laser Fractional CO2', amount: 2500000, doctorId: 'doc-01', method: 'Chuyển khoản', category: 'Dịch vụ' },
  { id: 'rev-07', date: '2026-05-20', type: 'service', source: 'Khám Da Liễu Tổng Quát', amount: 300000, doctorId: 'doc-01', method: 'Tiền mặt', category: 'Dịch vụ' },
  { id: 'rev-08', date: '2026-05-22', type: 'package', source: 'Gói chăm sóc da AI 3 tháng', amount: 1500000, doctorId: 'doc-03', method: 'Online (Momo)', category: 'Gói dịch vụ' },
  { id: 'rev-09', date: '2026-05-25', type: 'medicine', source: 'Ketoconazole + Clindamycin', amount: 220000, doctorId: 'doc-01', method: 'Tiền mặt', category: 'Thuốc & Sản phẩm' },
  { id: 'rev-10', date: '2026-05-27', type: 'service', source: 'Soi Da AI Chuyên Sâu', amount: 500000, doctorId: 'doc-03', method: 'Online (VNPay)', category: 'Dịch vụ' },
  { id: 'rev-11', date: '2026-06-01', type: 'service', source: 'Trị Mụn Chuyên Sâu', amount: 600000, doctorId: 'doc-02', method: 'Tiền mặt', category: 'Dịch vụ' },
  { id: 'rev-12', date: '2026-06-02', type: 'package', source: 'Gói trị nám Premium 12 buổi', amount: 18000000, doctorId: 'doc-02', method: 'Chuyển khoản', category: 'Gói dịch vụ' },
  { id: 'rev-13', date: '2026-06-03', type: 'medicine', source: 'Tretinoin + Arbutin Serum', amount: 560000, doctorId: 'doc-02', method: 'Online (Momo)', category: 'Thuốc & Sản phẩm' },
  { id: 'rev-14', date: '2026-06-04', type: 'service', source: 'Peel Da Sinh Học', amount: 800000, doctorId: 'doc-01', method: 'Tiền mặt', category: 'Dịch vụ' },
  { id: 'rev-15', date: '2026-06-05', type: 'service', source: 'Khám Da Liễu Tổng Quát', amount: 300000, doctorId: 'doc-01', method: 'Tiền mặt', category: 'Dịch vụ' },
];

// Build full revenue list from appointments + extra
function buildRevenueData() {
  const fromApts = mockAppointments
    .filter(a => a.paymentStatus === 'Đã thanh toán' && a.fee)
    .map(a => ({
      id: a.id,
      date: a.date,
      type: 'appointment',
      source: a.service,
      amount: parseFee(a.fee),
      doctorId: a.doctorId,
      doctorName: a.doctorName,
      method: ['Tiền mặt', 'Chuyển khoản', 'Online (VNPay)', 'Online (Momo)'][Math.floor(Math.random() * 4)],
      category: 'Dịch vụ',
      patientName: a.patientName,
    }));

  const extra = MOCK_EXTRA_REVENUE.map(r => ({
    ...r,
    doctorName: doctors.find(d => d.id === r.doctorId)?.name || '—',
    patientName: '—',
  }));

  return [...fromApts, ...extra].sort((a, b) => b.date.localeCompare(a.date));
}

// ─── Bar Chart (simple CSS) ───────────────────────────────────────────────────
function BarChart({ data, color = 'indigo', height = 120 }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-1.5 w-full" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
          <div className="relative w-full flex items-end justify-center" style={{ height: height - 20 }}>
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${(d.value / max) * 100}%` }}
              transition={{ duration: 0.6, delay: i * 0.04, ease: 'easeOut' }}
              className={`w-full rounded-t-lg bg-${color}-500 opacity-80 group-hover:opacity-100 transition-opacity cursor-pointer relative`}
              title={`${d.label}: ${formatVNDFull(d.value)}`}
            >
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap z-10 shadow-lg">
                {formatVND(d.value)}
              </div>
            </motion.div>
          </div>
          <span className="text-[9px] font-semibold text-slate-400 truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Donut Chart (SVG) ────────────────────────────────────────────────────────
function DonutChart({ segments, size = 120 }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  let offset = 0;
  const r = 45, cx = 60, cy = 60;
  const circumference = 2 * Math.PI * r;
  const COLORS = ['#6366f1','#0ea5e9','#10b981','#f59e0b','#ec4899','#8b5cf6'];

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width={size} height={size} viewBox="0 0 120 120">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth="18" />
        {segments.map((seg, i) => {
          const pct = seg.value / total;
          const dash = pct * circumference;
          const gap  = circumference - dash;
          const el = (
            <circle
              key={i}
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={COLORS[i % COLORS.length]}
              strokeWidth="18"
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-offset * circumference}
              transform="rotate(-90 60 60)"
              strokeLinecap="butt"
            />
          );
          offset += pct;
          return el;
        })}
        <text x={cx} y={cy - 6} textAnchor="middle" className="text-xs font-bold" fill="#1e293b" fontSize="11" fontWeight="700">
          {total > 0 ? formatVND(total) : '0'}
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill="#94a3b8" fontSize="8">
          Tổng
        </text>
      </svg>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 w-full">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
            <span className="text-[10px] font-semibold text-slate-500 truncate">{seg.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, color, trend, trendValue }) {
  const up = trend === 'up';
  const colorMap = {
    indigo:  { bg: 'bg-indigo-50',  icon: 'text-indigo-600',  border: 'border-indigo-100'  },
    emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', border: 'border-emerald-100' },
    amber:   { bg: 'bg-amber-50',   icon: 'text-amber-600',   border: 'border-amber-100'   },
    sky:     { bg: 'bg-sky-50',     icon: 'text-sky-600',     border: 'border-sky-100'     },
    violet:  { bg: 'bg-violet-50',  icon: 'text-violet-600',  border: 'border-violet-100'  },
    rose:    { bg: 'bg-rose-50',    icon: 'text-rose-600',    border: 'border-rose-100'    },
  }[color] || colorMap.indigo;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white border ${colorMap.border} rounded-2xl p-5 shadow-sm hover:shadow-md transition-all`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 ${colorMap.bg} rounded-xl`}>
          <Icon className={`w-5 h-5 ${colorMap.icon}`} />
        </div>
        {trendValue !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-bold ${up ? 'text-emerald-600' : 'text-rose-600'}`}>
            {up ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {trendValue}%
          </div>
        )}
      </div>
      <p className="text-2xl font-black text-slate-800 leading-none">{value}</p>
      <p className="text-xs font-bold text-slate-500 mt-1">{label}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function RevenueStatistics() {
  const allRevenue = useMemo(() => buildRevenueData(), []);

  const [period, setPeriod]   = useState('month'); // 'week' | 'month' | 'year'
  const [filterCat, setFilterCat] = useState('all');
  const [filterDoc, setFilterDoc] = useState('all');
  const [filterMethod, setFilterMethod] = useState('all');
  const [showTable, setShowTable] = useState(false);

  // ── Filtered data ──
  const filtered = useMemo(() => {
    return allRevenue.filter(r => {
      const catOk  = filterCat    === 'all' || r.category === filterCat;
      const docOk  = filterDoc    === 'all' || r.doctorId  === filterDoc;
      const methOk = filterMethod === 'all' || r.method    === filterMethod;
      return catOk && docOk && methOk;
    });
  }, [allRevenue, filterCat, filterDoc, filterMethod]);

  // ── Totals ──
  const totalRevenue  = filtered.reduce((s, r) => s + r.amount, 0);
  const prevRevenue   = totalRevenue * 0.82; // simulated prev period
  const growthPct     = prevRevenue > 0 ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 100) : 0;
  const totalTx       = filtered.length;
  const avgTx         = totalTx > 0 ? Math.round(totalRevenue / totalTx) : 0;

  // ── By category ──
  const byCategory = useMemo(() => {
    const map = {};
    filtered.forEach(r => { map[r.category] = (map[r.category] || 0) + r.amount; });
    return Object.entries(map).map(([label, value]) => ({ label, value })).sort((a,b) => b.value - a.value);
  }, [filtered]);

  // ── By doctor ──
  const byDoctor = useMemo(() => {
    const map = {};
    filtered.forEach(r => {
      const key = r.doctorName || r.doctorId || '—';
      map[key] = (map[key] || 0) + r.amount;
    });
    return Object.entries(map).map(([label, value]) => ({ label, value })).sort((a,b) => b.value - a.value);
  }, [filtered]);

  // ── By payment method ──
  const byMethod = useMemo(() => {
    const map = {};
    filtered.forEach(r => { map[r.method] = (map[r.method] || 0) + r.amount; });
    return Object.entries(map).map(([label, value]) => ({ label, value })).sort((a,b) => b.value - a.value);
  }, [filtered]);

  // ── Monthly trend (last 6 months) ──
  const monthlyTrend = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(2026, 5 - i, 1); // June 2026 is index 5
      const yyyy = d.getFullYear();
      const mm   = String(d.getMonth() + 1).padStart(2, '0');
      const prefix = `${yyyy}-${mm}`;
      const total = filtered.filter(r => r.date.startsWith(prefix)).reduce((s,r) => s + r.amount, 0);
      months.push({ label: `T${d.getMonth() + 1}`, value: total });
    }
    return months;
  }, [filtered]);

  // ── Service ranking ──
  const serviceRanking = useMemo(() => {
    const map = {};
    filtered.forEach(r => { map[r.source] = (map[r.source] || 0) + r.amount; });
    return Object.entries(map)
      .map(([label, value]) => ({ label, value }))
      .sort((a,b) => b.value - a.value)
      .slice(0, 8);
  }, [filtered]);

  const METHODS = ['all', 'Tiền mặt', 'Chuyển khoản', 'Online (VNPay)', 'Online (Momo)'];
  const CATEGORIES = ['all', 'Dịch vụ', 'Thuốc & Sản phẩm', 'Gói dịch vụ'];
  const METHOD_ICONS = {
    'Tiền mặt': Banknote,
    'Chuyển khoản': CreditCard,
    'Online (VNPay)': Wifi,
    'Online (Momo)': Wifi,
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Thống kê Doanh thu</h2>
          <p className="text-sm text-slate-500 mt-1">
            Tổng quan thu nhập từ dịch vụ, thuốc, gói điều trị và thanh toán
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Period toggle */}
          <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
            {[
              { id: 'week',  label: 'Tuần' },
              { id: 'month', label: 'Tháng' },
              { id: 'year',  label: 'Năm' },
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-none cursor-pointer ${
                  period === p.id
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'bg-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-all cursor-pointer">
            <Download className="w-3.5 h-3.5" /> Xuất CSV
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Tổng doanh thu"
          value={formatVNDFull(totalRevenue)}
          sub="Từ tất cả nguồn"
          icon={DollarSign}
          color="indigo"
          trend="up"
          trendValue={growthPct}
        />
        <StatCard
          label="Số giao dịch"
          value={totalTx}
          sub="Lượt thanh toán"
          icon={CreditCard}
          color="sky"
          trend="up"
          trendValue={12}
        />
        <StatCard
          label="Doanh thu TB/giao dịch"
          value={formatVND(avgTx) + ' VNĐ'}
          sub="Trung bình mỗi lần"
          icon={BarChart3}
          color="emerald"
        />
        <StatCard
          label="Gói dịch vụ"
          value={formatVND(byCategory.find(c => c.label === 'Gói dịch vụ')?.value || 0) + ' VNĐ'}
          sub="Doanh thu từ packages"
          icon={Package}
          color="violet"
          trend="up"
          trendValue={28}
        />
      </div>

      {/* ── Filters ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap gap-3 items-center">
        <Filter className="w-4 h-4 text-slate-400 shrink-0" />
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lọc:</span>

        {/* Category */}
        <select
          value={filterCat}
          onChange={e => setFilterCat(e.target.value)}
          className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-400 cursor-pointer"
        >
          {CATEGORIES.map(c => <option key={c} value={c}>{c === 'all' ? 'Tất cả loại' : c}</option>)}
        </select>

        {/* Doctor */}
        <select
          value={filterDoc}
          onChange={e => setFilterDoc(e.target.value)}
          className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-400 cursor-pointer"
        >
          <option value="all">Tất cả bác sĩ</option>
          {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>

        {/* Payment method */}
        <select
          value={filterMethod}
          onChange={e => setFilterMethod(e.target.value)}
          className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-400 cursor-pointer"
        >
          {METHODS.map(m => <option key={m} value={m}>{m === 'all' ? 'Tất cả phương thức' : m}</option>)}
        </select>

        <span className="text-xs text-slate-400 font-medium ml-auto">
          {filtered.length} giao dịch • {formatVNDFull(totalRevenue)}
        </span>
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monthly trend bar chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h4 className="text-sm font-bold text-slate-800">Xu hướng doanh thu 6 tháng</h4>
              <p className="text-xs text-slate-400 mt-0.5">Tổng thu theo từng tháng</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
              <TrendingUp className="w-3.5 h-3.5" /> +{growthPct}% so với kỳ trước
            </div>
          </div>
          <BarChart data={monthlyTrend} color="indigo" height={160} />
        </div>

        {/* Category donut */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h4 className="text-sm font-bold text-slate-800 mb-1">Cơ cấu nguồn thu</h4>
          <p className="text-xs text-slate-400 mb-4">Phân bổ theo loại</p>
          <DonutChart segments={byCategory} size={140} />
        </div>
      </div>

      {/* ── By Doctor + By Method ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* By doctor */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-emerald-500" /> Doanh thu theo bác sĩ
          </h4>
          <div className="space-y-3">
            {byDoctor.map((d, i) => {
              const pct = totalRevenue > 0 ? (d.value / totalRevenue) * 100 : 0;
              const COLORS = ['bg-indigo-500', 'bg-sky-500', 'bg-emerald-500', 'bg-violet-500'];
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-700 truncate max-w-[180px]">{d.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">{pct.toFixed(1)}%</span>
                      <span className="text-xs font-bold text-slate-800">{formatVNDFull(d.value)}</span>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: i * 0.1 }}
                      className={`h-full ${COLORS[i % COLORS.length]} rounded-full`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* By payment method */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-sky-500" /> Phương thức thanh toán
          </h4>
          <div className="space-y-3">
            {byMethod.map((m, i) => {
              const pct = totalRevenue > 0 ? (m.value / totalRevenue) * 100 : 0;
              const Icon = METHOD_ICONS[m.label] || CreditCard;
              const COLORS_M = ['bg-amber-500', 'bg-teal-500', 'bg-violet-500', 'bg-rose-500'];
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl bg-slate-50 border border-slate-100 shrink-0`}>
                    <Icon className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-slate-700">{m.label}</span>
                      <span className="text-xs font-bold text-slate-800">{formatVNDFull(m.value)}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1 }}
                        className={`h-full ${COLORS_M[i % COLORS_M.length]} rounded-full`}
                      />
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 w-10 text-right shrink-0">{pct.toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Top Services ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-violet-500" /> Dịch vụ & Sản phẩm doanh thu cao nhất
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
          {serviceRanking.map((s, i) => {
            const pct = serviceRanking[0]?.value > 0 ? (s.value / serviceRanking[0].value) * 100 : 0;
            return (
              <div key={i} className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${
                  i === 0 ? 'bg-amber-400 text-white' :
                  i === 1 ? 'bg-slate-300 text-white' :
                  i === 2 ? 'bg-orange-400 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-700 truncate">{s.label}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.7, delay: i * 0.05 }}
                        className="h-full bg-violet-500 rounded-full"
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 shrink-0 w-20 text-right">
                      {formatVNDFull(s.value)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Transaction Table (expandable) ── */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <button
          onClick={() => setShowTable(!showTable)}
          className="w-full flex items-center justify-between px-5 py-4 border-none bg-transparent cursor-pointer hover:bg-slate-50 transition-colors"
        >
          <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-500" />
            Chi tiết giao dịch ({filtered.length})
          </span>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showTable ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {showTable && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-slate-100"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      {['Ngày', 'Dịch vụ / Sản phẩm', 'Bác sĩ', 'Loại', 'Phương thức', 'Số tiền'].map(h => (
                        <th key={h} className="px-4 py-3 text-left font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.slice(0, 20).map((r, i) => (
                      <motion.tr
                        key={r.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.02 }}
                        className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{r.date}</td>
                        <td className="px-4 py-3 font-semibold text-slate-800 max-w-[200px] truncate">{r.source}</td>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap max-w-[140px] truncate">{r.doctorName}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] whitespace-nowrap ${
                            r.category === 'Dịch vụ'         ? 'bg-sky-50 text-sky-700 border border-sky-200' :
                            r.category === 'Gói dịch vụ'     ? 'bg-violet-50 text-violet-700 border border-violet-200' :
                            'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {r.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{r.method}</td>
                        <td className="px-4 py-3 font-black text-indigo-700 whitespace-nowrap text-right">
                          {formatVNDFull(r.amount)}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-indigo-50 border-t border-indigo-100">
                      <td colSpan={5} className="px-4 py-3 font-black text-indigo-700 text-right uppercase tracking-wider text-xs">
                        Tổng cộng ({filtered.length > 20 ? `20/${filtered.length} hiển thị` : filtered.length})
                      </td>
                      <td className="px-4 py-3 font-black text-indigo-700 text-right text-sm">
                        {formatVNDFull(totalRevenue)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
