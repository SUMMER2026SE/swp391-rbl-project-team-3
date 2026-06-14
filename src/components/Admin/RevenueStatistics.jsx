import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Banknote, Monitor, FileText, Package,
  Download, ChevronDown, Landmark, CreditCard, ListFilter, BarChart2,
  Check
} from 'lucide-react';

const transactions = [];

const formatCurrency = (value) => {
  return new Intl.NumberFormat('vi-VN').format(value);
};

const formatNumber = (value) => {
  return new Intl.NumberFormat('en-US').format(value);
};

const formatCompactCurrency = (value) => {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M VNĐ';
  }
  return formatCurrency(value) + ' VNĐ';
};

const FilterDropdown = ({ label, icon: Icon, options, value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative z-40" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-40 px-3 py-2 bg-white border border-slate-200 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-50 transition-all"
      >
        <div className="flex items-center gap-1.5 truncate">
          {Icon && <Icon className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
          <span className="truncate">{value === 'all' ? placeholder : value}</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-1.5 w-full bg-white border border-slate-100 rounded-3xl shadow-lg overflow-hidden"
          >
            <div className="max-h-48 overflow-y-auto custom-scrollbar">
              <button 
                onClick={() => { onChange('all'); setIsOpen(false); }}
                className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors hover:bg-slate-50 flex justify-between items-center ${value === 'all' ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-700'}`}
              >
                {placeholder}
                {value === 'all' && <Check className="w-3.5 h-3.5" />}
              </button>
              {options?.map?.(opt => (
                <button 
                  key={opt}
                  onClick={() => { onChange(opt); setIsOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors hover:bg-slate-50 flex justify-between items-center ${value === opt ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-700'}`}
                >
                  <span className="truncate">{opt}</span>
                  {value === opt && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function RevenueStatistics() {
  const [period, setPeriod] = useState('Ngày');
  const [doctor, setDoctor] = useState('all');
  const [method, setMethod] = useState('all');
  const [type, setType] = useState('all');
  const [showAll, setShowAll] = useState(false);

  const doctors = useMemo(() => [...new Set(transactions?.map(t => t.doctor)?.filter?.(d => d !== '—'))], []);
  const methods = useMemo(() => [...new Set(transactions?.map?.(t => t.method))], []);
  const types = useMemo(() => [...new Set(transactions?.map?.(t => t.type))], []);

  const filteredData = useMemo(() => {
    const currentDay = 11;
    const currentMonth = 5; // 0-indexed (June)
    const currentYear = 2026;
    const currentQuarter = Math.floor(currentMonth / 3);

    return transactions?.filter?.(t => {
      if (doctor !== 'all' && t.doctor !== doctor) return false;
      if (method !== 'all' && t.method !== method) return false;
      if (type !== 'all' && t.type !== type) return false;

      const [dd, mm, yyyy] = t.date.split('/');
      const txDay = parseInt(dd, 10);
      const txMonth = parseInt(mm, 10) - 1;
      const txYear = parseInt(yyyy, 10);
      const txQuarter = Math.floor(txMonth / 3);

      if (period === 'Ngày' && (txDay !== currentDay || txMonth !== currentMonth || txYear !== currentYear)) return false;
      if (period === 'Tuần') {
        const txDate = new Date(txYear, txMonth, txDay);
        const today = new Date(currentYear, currentMonth, currentDay);
        const diffDays = (today - txDate) / (1000 * 60 * 60 * 24);
        if (diffDays < 0 || diffDays > 6) return false;
      }
      if (period === 'Tháng' && (txMonth !== currentMonth || txYear !== currentYear)) return false;
      if (period === 'Quý' && (txQuarter !== currentQuarter || txYear !== currentYear)) return false;
      if (period === 'Năm' && txYear !== currentYear) return false;

      return true;
    });
  }, [doctor, method, type, period]);

  const totalRevenue = filteredData.reduce((sum, t) => sum + t.amount, 0);
  const totalTransactions = filteredData.length;
  const uniqueDaysCount = new Set(filteredData?.map?.(t => t.date)).size;
  const avgRevenue = period === 'Ngày' 
    ? (totalTransactions > 0 ? totalRevenue / totalTransactions : 0)
    : (uniqueDaysCount > 0 ? totalRevenue / uniqueDaysCount : 0);
  
  const treatmentRevenue = filteredData?.filter?.(t => t.type === 'GÓI LIỆU TRÌNH').reduce((sum, t) => sum + t.amount, 0);
  const consultRevenue = filteredData?.filter?.(t => t.type === 'KHÁM BỆNH').reduce((sum, t) => sum + t.amount, 0);
  const testRevenue = filteredData?.filter?.(t => t.type === 'XÉT NGHIỆM').reduce((sum, t) => sum + t.amount, 0);

  const pctTreatment = totalRevenue > 0 ? Math.round((treatmentRevenue / totalRevenue) * 100) : 0;
  const pctConsult = totalRevenue > 0 ? Math.round((consultRevenue / totalRevenue) * 100) : 0;
  const pctTest = totalRevenue > 0 ? 100 - pctTreatment - pctConsult : 0;

  const c = 251.2;
  const treatmentStroke = (pctTreatment / 100) * c;
  const testStroke = (pctTest / 100) * c;
  const consultStroke = (pctConsult / 100) * c;
  
  const treatmentOffset = 0;
  const consultOffset = -treatmentStroke;
  const testOffset = consultOffset - consultStroke;

  const doctorStats = useMemo(() => {
    const stats = {};
    doctors.forEach(d => { stats[d] = 0; });
    filteredData.forEach(t => {
      if (t.doctor !== '—') stats[t.doctor] = (stats[t.doctor] || 0) + t.amount;
    });
    return Object.entries(stats)?.map?.(
      ([name, amount]) => ({ name, amount, pct: totalRevenue > 0 ? (amount / totalRevenue) * 100 : 0 })
    )
      .sort((a, b) => b.amount - a.amount);
  }, [filteredData, totalRevenue, doctors]);

  const methodStats = useMemo(() => {
    const stats = {};
    methods.forEach(m => { stats[m] = 0; });
    filteredData.forEach(t => {
      stats[t.method] = (stats[t.method] || 0) + t.amount;
    });
    return Object.entries(stats)?.map?.(
      ([name, amount]) => ({ name, amount, pct: totalRevenue > 0 ? (amount / totalRevenue) * 100 : 0 })
    )
      .sort((a, b) => b.amount - a.amount);
  }, [filteredData, totalRevenue, methods]);

  const chartData = useMemo(() => {
    const rawFiltered = transactions?.filter?.(t => {
      if (doctor !== 'all' && t.doctor !== doctor) return false;
      if (method !== 'all' && t.method !== method) return false;
      if (type !== 'all' && t.type !== type) return false;
      return true;
    });

    let rawData = [];
    const currentYear = 2026;

    if (period === 'Ngày') {
      const hours = { '09:00': 0, '10:00': 0, '11:00': 0, '12:00': 0, '13:00': 0, '14:00': 0, '15:00': 0, '16:00': 0 };
      rawFiltered.forEach(t => {
        if (t.date === '11/06/2026') {
          const hour = t.time.split(':')[0] + ':00';
          if (hours[hour] !== undefined) hours[hour] += t.amount;
        }
      });
      rawData = Object.keys(hours)?.map?.(h => ({ label: h, value: hours[h] }));
    } else if (period === 'Tuần') {
      const days = { '05/06': 0, '06/06': 0, '07/06': 0, '08/06': 0, '09/06': 0, '10/06': 0, '11/06': 0 };
      rawFiltered.forEach(t => {
        const [dd, mm, yyyy] = t.date.split('/');
        const dayLabel = `${dd}/${mm}`;
        if (days[dayLabel] !== undefined) days[dayLabel] += t.amount;
      });
      rawData = Object.keys(days)?.map?.(d => ({ label: d, value: days[d] }));
    } else if (period === 'Tháng') {
      const months = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
      rawFiltered.forEach(t => {
        const [dd, mm, yyyy] = t.date.split('/');
        const txMonth = parseInt(mm, 10);
        const txYear = parseInt(yyyy, 10);
        if (txYear === currentYear && txMonth >= 1 && txMonth <= 6) {
          months[txMonth] += t.amount;
        }
      });
      rawData = Object.keys(months)?.map?.(m => ({ label: `Tháng ${m}`, value: months[m] }));
    } else if (period === 'Quý') {
      const quarters = { 'Q3/25': 0, 'Q4/25': 0, 'Q1/26': 0, 'Q2/26': 0 };
      rawFiltered.forEach(t => {
        const [dd, mm, yyyy] = t.date.split('/');
        const txMonth = parseInt(mm, 10) - 1;
        const txYear = parseInt(yyyy, 10);
        const txQuarter = Math.floor(txMonth / 3) + 1;
        const qLabel = `Q${txQuarter}/${txYear.toString().slice(2)}`;
        if (quarters[qLabel] !== undefined) quarters[qLabel] += t.amount;
      });
      rawData = Object.keys(quarters)?.map?.(q => ({ label: q, value: quarters[q] }));
    } else {
      const years = { '2023': 0, '2024': 0, '2025': 0, '2026': 0 };
      rawFiltered.forEach(t => {
        const txYear = parseInt(t.date.split('/')[2], 10);
        const yLabel = txYear.toString();
        if (years[yLabel] !== undefined) years[yLabel] += t.amount;
      });
      rawData = Object.keys(years)?.map?.(y => ({ label: y, value: years[y] }));
    }

    const maxVal = Math.max(...rawData?.map?.(d => d.value), 1);
    return rawData?.map?.(d => ({
      label: d.label,
      height: d.value === 0 ? 0 : Math.max((d.value / maxVal) * 100, 12),
      highlight: d.value > 0
    }));
  }, [doctor, method, type, period]);

  const getMethodIcon = (name) => {
    if (name.toLowerCase().includes('chuyển khoản')) return Landmark;
    if (name.toLowerCase().includes('thẻ')) return CreditCard;
    return Banknote;
  };

  const getMethodColor = (name) => {
    if (name.toLowerCase().includes('chuyển khoản')) return 'bg-emerald-600';
    if (name.toLowerCase().includes('thẻ')) return 'bg-sky-500';
    return 'bg-amber-500';
  };

  const exportToCSV = () => {
    if (filteredData.length === 0) return alert("Không có dữ liệu để xuất!");
    const headers = ["Ngay", "Gio", "Dich vu/San pham", "Bac si", "Loai", "Phuong thuc", "So tien (VND)"];
    const csvContent = [
      headers.join(","),
      ...filteredData?.map?.(
        t => `"${t.date}","${t.time}","${t.service}","${t.doctor}","${t.type}","${t.method}",${t.amount}`
      )
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `doanh_thu_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const displayedTransactions = showAll ? filteredData : filteredData.slice(0, 4);

  // Dynamic Trends
  const getTrend = (metric) => {
    const trends = {
      'Ngày': { revenue: 5.2, tx: 8.1, avg: -1.5, pkg: 4.2 },
      'Tuần': { revenue: 10.4, tx: 12.0, avg: 3.5, pkg: 8.9 },
      'Tháng': { revenue: 12.5, tx: -2.1, avg: 15.0, pkg: -5.4 },
      'Quý': { revenue: -4.2, tx: 5.3, avg: -8.1, pkg: 12.0 },
      'Năm': { revenue: 22.4, tx: 18.5, avg: 4.2, pkg: 25.1 }
    };
    const val = trends[period][metric];
    return {
      value: Math.abs(val),
      isUp: val >= 0
    };
  };

  const revTrend = getTrend('revenue');
  const txTrend = getTrend('tx');
  const avgTrend = getTrend('avg');
  const pkgTrend = getTrend('pkg');

  return (
    <div className="space-y-4 bg-transparent pb-6 relative">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Thống kê Doanh thu</h2>
          <p className="text-[11px] text-slate-500 mt-1">Tổng quan thu nhập từ khám bệnh, xét nghiệm và gói liệu trình điều trị</p>
        </div>
        <div className="flex bg-slate-50 border border-slate-200 rounded-full p-1 gap-1">
          {['Ngày', 'Tuần', 'Tháng', 'Quý', 'Năm']?.map?.(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all border-none outline-none cursor-pointer ${
                period === p ? 'bg-white text-indigo-600 shadow-sm' : 'bg-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-2.5 items-center relative z-40">
        <FilterDropdown icon={ListFilter} options={doctors} value={doctor} onChange={setDoctor} placeholder="Tất cả BS / KTV" />
        <FilterDropdown options={methods} value={method} onChange={setMethod} placeholder="Mọi phương thức" />
        <FilterDropdown options={types} value={type} onChange={setType} placeholder="Mọi loại hình" />
        <button onClick={exportToCSV} className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-xs font-bold text-slate-900 cursor-pointer hover:bg-slate-50 transition-all ml-auto">
          <Download className="w-3.5 h-3.5" /> Xuất báo cáo CSV
        </button>
      </div>
      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-1 relative z-30">
        <div className="border border-slate-200 rounded-3xl p-4 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col hover:shadow-md transition-shadow min-h-[130px]">
          <div className="flex items-start justify-between mb-4">
            <div className="p-2 bg-[#4F46E5] rounded-2xl text-white shadow-md shadow-indigo-500/20">
              <Banknote className="w-4 h-4" />
            </div>
            {period !== 'Ngày' && (
              <div className={`flex items-center gap-1 text-[11px] font-black ${revTrend.isUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                {revTrend.isUp ? <TrendingUp className="w-3 h-3 stroke-[3]" /> : <TrendingDown className="w-3 h-3 stroke-[3]" />} {revTrend.isUp ? '+' : '-'}{revTrend.value}%
              </div>
            )}
          </div>
          <div className="mt-auto">
            <p className="text-[10px] font-semibold text-slate-500 mb-0.5">Tổng doanh thu</p>
            <p className="text-lg font-black text-slate-900 leading-tight mb-1 tracking-tight truncate">{formatCurrency(totalRevenue)} VNĐ</p>
            <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">Lọc theo {period.toLowerCase()}</p>
          </div>
        </div>

        <div className="border border-slate-200 rounded-3xl p-4 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col hover:shadow-md transition-shadow min-h-[130px]">
          <div className="flex items-start justify-between mb-4">
            <div className="p-2 bg-[#059669] rounded-2xl text-white shadow-md shadow-emerald-700/20">
              <FileText className="w-4 h-4" />
            </div>
            {period !== 'Ngày' && (
              <div className={`flex items-center gap-1 text-[11px] font-black ${txTrend.isUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                {txTrend.isUp ? <TrendingUp className="w-3 h-3 stroke-[3]" /> : <TrendingDown className="w-3 h-3 stroke-[3]" />} {txTrend.isUp ? '+' : '-'}{txTrend.value}%
              </div>
            )}
          </div>
          <div className="mt-auto">
            <p className="text-[10px] font-semibold text-slate-500 mb-0.5">Số giao dịch</p>
            <p className="text-lg font-black text-slate-900 leading-tight mb-1 tracking-tight">{formatNumber(totalTransactions)}</p>
            <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">Thanh toán hoàn tất</p>
          </div>
        </div>

        <div className="border border-slate-200 rounded-3xl p-4 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col hover:shadow-md transition-shadow min-h-[130px]">
          <div className="flex items-start justify-between mb-4">
            <div className="p-2 bg-[#9A5B1C] rounded-2xl text-white shadow-md shadow-[#9A5B1C]/20">
              <BarChart2 className="w-4 h-4" />
            </div>
            {period !== 'Ngày' && (
              <div className={`flex items-center gap-1 text-[11px] font-black ${avgTrend.isUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                {avgTrend.isUp ? <TrendingUp className="w-3 h-3 stroke-[3]" /> : <TrendingDown className="w-3 h-3 stroke-[3]" />} {avgTrend.isUp ? '+' : '-'}{avgTrend.value}%
              </div>
            )}
          </div>
          <div className="mt-auto">
            <p className="text-[10px] font-semibold text-slate-500 mb-0.5">Doanh thu TB</p>
            <p className="text-lg font-black text-slate-900 leading-tight mb-1 tracking-tight">{formatCompactCurrency(avgRevenue)}</p>
            <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">{period === 'Ngày' ? 'TB mỗi giao dịch' : 'TB mỗi ngày'}</p>
          </div>
        </div>

        <div className="border border-slate-200 rounded-3xl p-4 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col hover:shadow-md transition-shadow min-h-[130px]">
          <div className="flex items-start justify-between mb-4">
            <div className="p-2 bg-[#6366F1] rounded-2xl text-white shadow-md shadow-indigo-500/20">
              <Package className="w-4 h-4" />
            </div>
            {period !== 'Ngày' && (
              <div className={`flex items-center gap-1 text-[11px] font-black ${pkgTrend.isUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                {pkgTrend.isUp ? <TrendingUp className="w-3 h-3 stroke-[3]" /> : <TrendingDown className="w-3 h-3 stroke-[3]" />} {pkgTrend.isUp ? '+' : '-'}{pkgTrend.value}%
              </div>
            )}
          </div>
          <div className="mt-auto">
            <p className="text-[10px] font-semibold text-slate-500 mb-0.5">Gói liệu trình</p>
            <p className="text-lg font-black text-slate-900 leading-tight mb-1 tracking-tight">{formatCompactCurrency(treatmentRevenue)}</p>
            <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">Từ các gói điều trị</p>
          </div>
        </div>
      </div>
      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 relative z-20">
        <div className="lg:col-span-2 border border-slate-200 rounded-3xl p-4 bg-white shadow-sm flex flex-col">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-[13px] font-bold text-slate-900">{period === 'Ngày' ? 'Chi tiết doanh thu' : 'Xu hướng doanh thu'}</h3>
              <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                {period === 'Ngày' ? 'Doanh thu theo giờ (Ngày 11/06/2026)' :
                 period === 'Tuần' ? 'Doanh thu 7 ngày qua (Đến 11/06/2026)' :
                 period === 'Tháng' ? 'Doanh thu 6 tháng gần nhất (Đến Tháng 6/2026)' : 
                 period === 'Quý' ? 'Doanh thu 4 quý gần nhất (Đến Quý 2/2026)' : 
                 'Doanh thu 4 năm gần nhất (Đến năm 2026)'}
              </p>
            </div>
            {period !== 'Ngày' && (
              <div className={`flex items-center gap-1 px-2 py-1 ${revTrend.isUp ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'} text-[10px] font-bold rounded-full`}>
                {revTrend.isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />} {revTrend.isUp ? '+' : '-'}{revTrend.value}% so với kỳ trước
              </div>
            )}
          </div>
          <div className="flex-1 flex items-end justify-between gap-2 mt-auto pt-4">
            {chartData?.map?.((d) => (
              <div key={d.label} className="flex-1 flex flex-col items-center gap-1.5">
                <div className={`w-6 md:w-8 ${d.highlight ? 'bg-indigo-600' : 'bg-slate-200'} rounded-t-full transition-all duration-500`} style={{ height: `${d.height}px` }}></div>
                <span className={`text-[10px] font-bold ${d.highlight ? 'text-indigo-600' : 'text-slate-400'}`}>{d.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-slate-200 rounded-3xl p-4 bg-white shadow-sm flex flex-col">
          <div>
            <h3 className="text-[13px] font-bold text-slate-900">Cơ cấu nguồn thu</h3>
            <p className="text-[11px] text-slate-500 mt-0.5 mb-4">Phân bổ theo loại hình doanh thu</p>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <div className="flex justify-center mb-4">
              <div className="relative w-32 h-32">
                <svg width="100%" height="100%" viewBox="0 0 100 100" className="transform -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="16" />
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#15803d" strokeWidth="16" strokeDasharray={`${treatmentStroke} 251.2`} strokeDashoffset={treatmentOffset} className="transition-all duration-700" />
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#eab308" strokeWidth="16" strokeDasharray={`${consultStroke} 251.2`} strokeDashoffset={consultOffset} className="transition-all duration-700" />
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#ef4444" strokeWidth="16" strokeDasharray={`${testStroke} 251.2`} strokeDashoffset={testOffset} className="transition-all duration-700" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[8px] font-bold text-slate-400">TỔNG THU</span>
                  <span className="text-lg font-black text-slate-900 leading-none mt-0.5">100%</span>
                </div>
              </div>
            </div>
            <div className="space-y-2 px-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-700"></div><span className="font-semibold text-slate-700">Gói liệu trình</span>
                </div>
                <span className="font-bold text-slate-900">{pctTreatment}%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div><span className="font-semibold text-slate-700">Khám bệnh</span>
                </div>
                <span className="font-bold text-slate-900">{pctConsult}%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div><span className="font-semibold text-slate-700">Xét nghiệm</span>
                </div>
                <span className="font-bold text-slate-900">{pctTest}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* ── Middle Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 relative z-10">
        <div className="border border-slate-200 rounded-3xl p-4 bg-white shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13px] font-bold text-slate-900">Doanh thu theo bác sĩ</h3>
          </div>
          <div className="space-y-4">
            {doctorStats.length > 0 ? doctorStats?.map?.((ds, i) => (
              <div key={ds.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-800">{ds.name}</span>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="font-bold text-slate-900">{formatCurrency(ds.amount)} VNĐ</span>
                    <span className="text-slate-500 font-medium">{ds.pct.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="h-2 w-full bg-indigo-50 rounded-full overflow-hidden">
                  <div className={`h-full ${['bg-indigo-600', 'bg-indigo-500', 'bg-indigo-400', 'bg-indigo-300', 'bg-indigo-200'][i] || 'bg-indigo-100'} rounded-full transition-all duration-700`} style={{ width: `${ds.pct}%` }}></div>
                </div>
              </div>
            )) : <p className="text-xs text-slate-500 text-center py-2">Không có dữ liệu bác sĩ</p>}
          </div>
        </div>

        <div className="border border-slate-200 rounded-3xl p-4 bg-white shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13px] font-bold text-slate-900">Phương thức thanh toán</h3>
          </div>
          <div className="space-y-3">
            {methodStats.length > 0 ? methodStats?.map?.(ms => {
              const Icon = getMethodIcon(ms.name);
              const color = getMethodColor(ms.name);
              return (
                <div key={ms.name} className="flex items-center gap-2.5">
                  <div className="p-2 bg-slate-50 rounded-2xl text-slate-600 shrink-0 border border-slate-100">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5 text-xs">
                      <span className="font-bold text-slate-800">{ms.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 font-medium">{formatCurrency(ms.amount)} VNĐ</span>
                        <span className="font-semibold text-slate-900 w-6 text-right">{Math.round(ms.pct)}%</span>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${ms.pct}%` }}></div>
                    </div>
                  </div>
                </div>
              );
            }) : <p className="text-xs text-slate-500 text-center py-2">Không có dữ liệu phương thức</p>}
          </div>
        </div>
      </div>
      {/* ── Table Chi tiết giao dịch ── */}
      <div className="border border-slate-200 rounded-3xl bg-white overflow-hidden shadow-sm relative z-0">
        <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-[13px] font-bold text-slate-900">Chi tiết giao dịch</h3>
          <span className="text-xs font-semibold text-slate-500">
            {totalTransactions} giao dịch <span className="mx-1.5 text-slate-300">•</span> <span className="text-indigo-600 font-bold">{formatCurrency(totalRevenue)} VNĐ</span>
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-4 py-2.5 text-left font-bold text-slate-500 text-[10px] uppercase tracking-wider whitespace-nowrap">Ngày/Giờ</th>
                <th className="px-4 py-2.5 text-left font-bold text-slate-500 text-[10px] uppercase tracking-wider">Dịch vụ/Xét nghiệm</th>
                <th className="px-4 py-2.5 text-left font-bold text-slate-500 text-[10px] uppercase tracking-wider whitespace-nowrap">Bác sĩ</th>
                <th className="px-4 py-2.5 text-left font-bold text-slate-500 text-[10px] uppercase tracking-wider">Loại</th>
                <th className="px-4 py-2.5 text-left font-bold text-slate-500 text-[10px] uppercase tracking-wider">Phương thức</th>
                <th className="px-4 py-2.5 text-right font-bold text-slate-500 text-[10px] uppercase tracking-wider whitespace-nowrap">Số tiền</th>
              </tr>
            </thead>
            <tbody>
              {displayedTransactions.length > 0 ? displayedTransactions?.map?.((tx, i) => {
                const Icon = getMethodIcon(tx.method);
                return (
                  <tr key={i} className="border-b border-slate-50 last:border-b-0 hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-2.5 text-slate-500 whitespace-pre-line text-[11px] font-medium leading-relaxed">{`${tx.date}\n${tx.time}`}</td>
                    <td className="px-4 py-2.5 font-bold text-slate-800">{tx.service}</td>
                    <td className="px-4 py-2.5 text-slate-500 font-medium">{tx.doctor}</td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full whitespace-nowrap tracking-wide ${
                        tx.type === 'GÓI LIỆU TRÌNH' ? 'bg-green-50 text-green-700' :
                        tx.type === 'XÉT NGHIỆM' ? 'bg-red-50 text-red-700' :
                        'bg-yellow-50 text-yellow-700'
                      }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600 font-medium flex items-center gap-1.5">
                      <Icon className="w-3 h-3 text-slate-400" />
                      {tx.method}
                    </td>
                    <td className="px-4 py-2.5 text-right font-bold text-slate-900 whitespace-nowrap">{formatCurrency(tx.amount)} VNĐ</td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="6" className="px-4 py-5 text-center text-slate-500 font-medium">Không tìm thấy giao dịch nào phù hợp với bộ lọc hiện tại.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {filteredData.length > 4 && (
          <div className="border-t border-slate-100 p-2.5 flex justify-center bg-slate-50/30">
            <button 
              onClick={() => setShowAll(!showAll)}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-transparent border-none cursor-pointer"
            >
              {showAll ? 'Thu gọn danh sách' : 'Xem tất cả giao dịch'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
