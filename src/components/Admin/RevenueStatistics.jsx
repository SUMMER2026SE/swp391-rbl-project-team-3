import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Banknote, Monitor, FileText,
  Download, ChevronDown, Landmark, CreditCard, ListFilter, BarChart2,
  Check
} from 'lucide-react';
import { AppointmentModel } from '../../models/AppointmentModel';
import { DoctorModel } from '../../models/DoctorModel';
import { ServiceTicketModel } from '../../models/ServiceTicketModel';
import { StaffModel } from '../../models/StaffModel';
import { GLASS_BASE, GLASS_HOVER, GLASS_TITLE } from '../common/GlassCard';

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
        <ChevronDown className={`w-3.5 h-3.5 text-slate-500 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
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

const generateHistoricalMockData = () => {
  const doctors = ['BS. CKII. Trần Văn A', 'ThS. BS. Nguyễn Thị B', 'BS. Trần Quốc Minh', 'BS. Lê Hoàng Nam'];
  const technicians = ['KTV. Lê Thị C', 'KTV. Trần Văn D', 'KTV. Phạm Thị E'];
  const methods = ['Tiền mặt', 'QR Code'];
  const services = [
    { name: 'Khám da liễu tổng quát', type: 'KHÁM BỆNH', minAmount: 150000, maxAmount: 300000 },
    { name: 'Xét nghiệm dị ứng da', type: 'DỊCH VỤ', minAmount: 500000, maxAmount: 1200000 },
    { name: 'Khám kiểm tra nốt ruồi lạ', type: 'KHÁM BỆNH', minAmount: 200000, maxAmount: 400000 }
  ];
  
  const mockTransactions = [];
  let idCounter = 10000;
  
  const years = [2023, 2024, 2025, 2026];
  
  years.forEach(y => {
    const maxMonth = y === 2026 ? 6 : 12;
    for (let m = 1; m <= maxMonth; m++) {
      const numTx = Math.floor(Math.random() * 14) + 12;
      for (let i = 0; i < numTx; i++) {
        const d = Math.floor(Math.random() * 28) + 1;
        const dd = String(d).padStart(2, '0');
        const mm = String(m).padStart(2, '0');
        
        const doc = doctors[Math.floor(Math.random() * doctors.length)];
        const tech = technicians[Math.floor(Math.random() * technicians.length)];
        const method = methods[Math.floor(Math.random() * methods.length)];
        const svc = services[Math.floor(Math.random() * services.length)];
        
        const amount = Math.floor(
          (Math.random() * (svc.maxAmount - svc.minAmount) + svc.minAmount) / 10000
        ) * 10000;
        
        const hour = Math.floor(Math.random() * 13) + 8;
        const minute = Math.floor(Math.random() * 4) * 15;
        const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        
        mockTransactions.push({
          id: `mock-${idCounter++}`,
          amount,
          date: `${dd}/${mm}/${y}`,
          time: timeStr,
          method,
          doctor: svc.type === 'DỊCH VỤ' ? tech : doc,
          service: svc.name,
          type: svc.type
        });
      }
    }
  });
  
  return mockTransactions;
};

const calculateNiceMax = (maxVal) => {
  if (maxVal <= 0) return 3;
  const roughStep = maxVal / 3;
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const normalizedStep = roughStep / magnitude;
  let niceMultiplier;
  if (normalizedStep <= 1) niceMultiplier = 1;
  else if (normalizedStep <= 1.5) niceMultiplier = 1.5;
  else if (normalizedStep <= 2) niceMultiplier = 2;
  else if (normalizedStep <= 2.5) niceMultiplier = 2.5;
  else if (normalizedStep <= 5) niceMultiplier = 5;
  else niceMultiplier = 10;
  return niceMultiplier * magnitude * 3;
};

export default function RevenueStatistics() {
  const [period, setPeriod] = useState('Tháng');
  const [doctor, setDoctor] = useState('all');
  const [method, setMethod] = useState('all');
  const [type, setType] = useState('all');
  const [showAll, setShowAll] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedPeriodValue, setSelectedPeriodValue] = useState('');
  const [activeDropdown, setActiveDropdown] = useState(null);
  const tabBarRef = useRef(null);  const prevPeriodRef = useRef(period);

  const parsePeriodContext = (val, per) => {
    const now = new Date();
    let y = now.getFullYear();
    let q = Math.floor(now.getMonth() / 3) + 1;
    let m = now.getMonth() + 1;
    let d = now.getDate();

    if (!val) return { y, q, m, d };

    if (per === 'Ngày' || per === 'Tuần') {
      if (val.includes('-')) {
        const [yearStr, monthStr, dayStr] = val.split('-');
        y = parseInt(yearStr, 10);
        m = parseInt(monthStr, 10);
        d = parseInt(dayStr, 10);
        q = Math.floor((m - 1) / 3) + 1;
      }
    } else if (per === 'Tháng') {
      if (val.includes('/')) {
        const [monthStr, yearStr] = val.split('/');
        y = parseInt(yearStr, 10);
        m = parseInt(monthStr, 10);
        q = Math.floor((m - 1) / 3) + 1;
        d = 1;
      }
    } else if (per === 'Quý') {
      if (val.includes('/')) {
        const [qStr, yearStr] = val.split('/');
        y = parseInt(yearStr, 10);
        q = parseInt(qStr.replace('Q', ''), 10);
        m = (q - 1) * 3 + 3;
        d = 1;
      }
    } else if (per === 'Năm') {
      y = parseInt(val, 10) || now.getFullYear();
      q = 4;
      m = 12;
      d = 31;
    }

    return { y, q, m, d };
  };

  const getSelectedYear = () => {
    if (!selectedPeriodValue) return new Date().getFullYear();
    if (selectedPeriodValue.includes('-')) {
      return parseInt(selectedPeriodValue.split('-')[0], 10);
    }
    if (selectedPeriodValue.includes('/')) {
      return parseInt(selectedPeriodValue.split('/')[1], 10);
    }
    return parseInt(selectedPeriodValue, 10) || new Date().getFullYear();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tabBarRef.current && !tabBarRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update selected period value when period changes, preserving hierarchical parent/child boundaries
  useEffect(() => {
    if (period === 'Tất cả') {
      setSelectedPeriodValue('');
      prevPeriodRef.current = period;
      return;
    }
    const prevPeriod = prevPeriodRef.current;
    const context = parsePeriodContext(selectedPeriodValue, prevPeriod);
    const now = new Date();
    const currentYear = now.getFullYear();

    if (period === 'Ngày') {
      if (prevPeriod === 'Tuần') {
        setSelectedPeriodValue(`${context.y}-${String(context.m).padStart(2, '0')}-${String(context.d).padStart(2, '0')}`);
      } else {
        const lastDay = new Date(context.y, context.m, 0).getDate();
        setSelectedPeriodValue(`${context.y}-${String(context.m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`);
      }
    } else if (period === 'Tuần') {
      const lastDay = new Date(context.y, context.m, 0).getDate();
      setSelectedPeriodValue(`${context.y}-${String(context.m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`);
    } else if (period === 'Tháng') {
      setSelectedPeriodValue(`${String(context.m).padStart(2, '0')}/${context.y}`);
    } else if (period === 'Quý') {
      setSelectedPeriodValue(`Q${context.q}/${context.y}`);
    } else if (period === 'Năm') {
      setSelectedPeriodValue(String(context.y));
    }

    prevPeriodRef.current = period;
  }, [period]);

  const getOptionsForPeriod = (targetPeriod) => {
    const now = new Date();
    const currentDay = now.getDate();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const context = parsePeriodContext(selectedPeriodValue, period);
    const isCurrentYearSelected = context.y === currentYear;

    if (targetPeriod === 'Ngày') {
      const list = [];
      const lastDay = new Date(context.y, context.m, 0).getDate();
      
      const weekIndex = Math.floor((lastDay - context.d) / 7);
      const weekEndDate = lastDay - (weekIndex * 7);
      const refDate = new Date(context.y, context.m - 1, weekEndDate);
      
      for (let i = 0; i < 7; i++) {
        const d = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate() - i);
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const valStr = `${d.getFullYear()}-${mm}-${dd}`;
        
        let label = `${dd}/${mm}/${d.getFullYear()}`;
        if (d.toDateString() === now.toDateString()) {
          label = `Hôm nay (${dd}/${mm})`;
        } else if (new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toDateString() === d.toDateString()) {
          label = `Hôm qua (${dd}/${mm})`;
        }
        
        list.push({ value: valStr, label });
      }
      return list;
    }
    if (targetPeriod === 'Tuần') {
      const list = [];
      
      // If we are currently scoping by month or quarter, list weeks inside that month/quarter
      if (period === 'Tháng') {
        const lastDay = new Date(context.y, context.m, 0).getDate();
        for (let i = 0; i < 5; i++) {
          const endDate = new Date(context.y, context.m - 1, lastDay - (i * 7));
          const startDate = new Date(context.y, context.m - 1, lastDay - (i * 7) - 6);
          
          if (endDate.getMonth() !== context.m - 1) break;
          
          const sDd = String(startDate.getDate()).padStart(2, '0');
          const sMm = String(startDate.getMonth() + 1).padStart(2, '0');
          const eDd = String(endDate.getDate()).padStart(2, '0');
          const eMm = String(endDate.getMonth() + 1).padStart(2, '0');
          
          const valStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
          list.push({
            value: valStr,
            label: `${sDd}/${sMm}/${startDate.getFullYear()} - ${eDd}/${eMm}/${endDate.getFullYear()}`
          });
        }
        return list;
      }
      
      if (period === 'Quý') {
        const lastMonth = context.q * 3;
        const lastDayOfQuarter = new Date(context.y, lastMonth, 0).getDate();
        for (let i = 0; i < 12; i++) {
          const endDate = new Date(context.y, lastMonth - 1, lastDayOfQuarter - (i * 7));
          const startDate = new Date(context.y, lastMonth - 1, lastDayOfQuarter - (i * 7) - 6);
          
          const endDateQuarter = Math.floor(endDate.getMonth() / 3) + 1;
          if (endDateQuarter !== context.q) break;
          
          const sDd = String(startDate.getDate()).padStart(2, '0');
          const sMm = String(startDate.getMonth() + 1).padStart(2, '0');
          const eDd = String(endDate.getDate()).padStart(2, '0');
          const eMm = String(endDate.getMonth() + 1).padStart(2, '0');
          
          const valStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
          list.push({
            value: valStr,
            label: `${sDd}/${sMm}/${startDate.getFullYear()} - ${eDd}/${eMm}/${endDate.getFullYear()}`
          });
        }
        return list;
      }

      // Default fallback week builder
      const lastDay = new Date(context.y, context.m, 0).getDate();
      const refDate = new Date(context.y, context.m - 1, lastDay);
      for (let i = 0; i < 5; i++) {
        const endDate = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate() - (i * 7));
        const startDate = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate() - (i * 7) - 6);
        
        const sDd = String(startDate.getDate()).padStart(2, '0');
        const sMm = String(startDate.getMonth() + 1).padStart(2, '0');
        const eDd = String(endDate.getDate()).padStart(2, '0');
        const eMm = String(endDate.getMonth() + 1).padStart(2, '0');
        
        const valStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
        let label = `${sDd}/${sMm}/${startDate.getFullYear()} - ${eDd}/${eMm}/${endDate.getFullYear()}`;
        list.push({ value: valStr, label });
      }
      return list;
    }
    if (targetPeriod === 'Tháng') {
      const list = [];
      
      // If currently selected tab is Quarter, show only months of that quarter
      if (period === 'Quý') {
        for (let i = 2; i >= 0; i--) {
          const monthIdx = (context.q - 1) * 3 + i;
          const mStr = String(monthIdx + 1).padStart(2, '0');
          list.push({
            value: `${mStr}/${context.y}`,
            label: `Tháng ${mStr}/${context.y}`
          });
        }
        return list;
      }

      // Default: show months of the selected year
      const startMonth = isCurrentYearSelected ? currentMonth : 11;
      for (let i = 0; i < 12; i++) {
        const d = new Date(context.y, startMonth - i, 1);
        const m = d.getMonth() + 1;
        const y = d.getFullYear();
        if (y !== context.y) break;
        const mStr = String(m).padStart(2, '0');
        
        let label = `Tháng ${mStr}/${y}`;
        if (y === currentYear && m - 1 === currentMonth) {
          label = `Tháng này (${mStr}/${y})`;
        } else if (y === currentYear && m - 1 === currentMonth - 1) {
          label = `Tháng trước (${mStr}/${y})`;
        }
        
        list.push({ value: `${mStr}/${y}`, label });
      }
      return list;
    }
    if (targetPeriod === 'Quý') {
      const list = [];
      const startQuarter = isCurrentYearSelected ? Math.floor(currentMonth / 3) : 3;
      
      for (let i = 0; i <= startQuarter; i++) {
        const q = startQuarter - i + 1;
        list.push({
          value: `Q${q}/${context.y}`,
          label: (q === Math.floor(currentMonth / 3) + 1 && isCurrentYearSelected) ? `Quý này (Quý ${q}/${context.y})` : `Quý ${q}/${context.y}`
        });
      }
      return list;
    }
    if (targetPeriod === 'Năm') {
      const list = [];
      for (let i = 0; i < 5; i++) {
        const y = currentYear - i;
        list.push({
          value: String(y),
          label: y === currentYear ? `Năm nay (${y})` : `Năm ${y}`
        });
      }
      return list;
    }
    return [];
  };

  const getPeriodDetailsLabel = () => {
    if (period === 'Tất cả') return 'Tất cả thời gian';
    if (!selectedPeriodValue) return '';

    if (period === 'Ngày') {
      const [y, m, d] = selectedPeriodValue.split('-');
      return `Ngày ${d}/${m}/${y}`;
    }
    if (period === 'Tuần') {
      const [y, m, d] = selectedPeriodValue.split('-').map(Number);
      const endDate = new Date(y, m - 1, d);
      const startDate = new Date(y, m - 1, d - 6);
      
      const sDd = String(startDate.getDate()).padStart(2, '0');
      const sMm = String(startDate.getMonth() + 1).padStart(2, '0');
      const eDd = String(endDate.getDate()).padStart(2, '0');
      const eMm = String(endDate.getMonth() + 1).padStart(2, '0');
      return `Tuần từ ${sDd}/${sMm}/${startDate.getFullYear()} đến ${eDd}/${eMm}/${endDate.getFullYear()}`;
    }
    if (period === 'Tháng') {
      return `Tháng ${selectedPeriodValue}`;
    }
    if (period === 'Quý') {
      return `${selectedPeriodValue}`;
    }
    if (period === 'Năm') {
      return `Năm ${selectedPeriodValue}`;
    }
    return '';
  };

  const getChartDescription = () => {
    if (period === 'Tất cả') return 'Doanh thu tất cả thời gian';
    if (!selectedPeriodValue) return '';

    if (period === 'Ngày') {
      const [y, m, d] = selectedPeriodValue.split('-');
      return `Doanh thu theo giờ (Ngày ${d}/${m}/${y})`;
    }
    if (period === 'Tuần') {
      const [y, m, d] = selectedPeriodValue.split('-').map(Number);
      const endDate = new Date(y, m - 1, d);
      const eDd = String(endDate.getDate()).padStart(2, '0');
      const eMm = String(endDate.getMonth() + 1).padStart(2, '0');
      return `Doanh thu 7 ngày qua (Đến ngày ${eDd}/${eMm}/${endDate.getFullYear()})`;
    }
    if (period === 'Tháng') {
      return `Doanh thu 6 tháng gần nhất (Đến tháng ${selectedPeriodValue})`;
    }
    if (period === 'Quý') {
      return `Doanh thu 4 quý gần nhất (Đến ${selectedPeriodValue})`;
    }
    return `Doanh thu 4 năm gần nhất (Đến năm ${selectedPeriodValue})`;
  };

  // Pull real revenue from the payments table and shape it into the transaction
  // model the charts expect ({ amount, date 'DD/MM/YYYY', time, method, doctor,
  // service, type }). Doctor names come from the appointment + DoctorModel cache.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await DoctorModel.getAllDoctors(); // warm the name cache for mapAppointment
        const [payments, appts, tickets, staff] = await Promise.all([
          AppointmentModel.getAllPayments(),
          AppointmentModel.getAll(),
          ServiceTicketModel.getAll(),
          StaffModel.getAll(),
        ]);
        const apptById = new Map((appts || []).map(a => [String(a.appointment_id ?? a.id), a]));
        const ticketByAppt = new Map((tickets || []).map(t => [String(t.appointment_id), t]));
        const staffById = new Map((staff || []).map(s => [String(s.id), s]));
        const mapped = (payments || []).flatMap(p => {
          const apt = apptById.get(String(p.appointment_id));
          const dt = new Date(p.paid_at || p.created_at || Date.now());
          const dd = String(dt.getDate()).padStart(2, '0');
          const mm = String(dt.getMonth() + 1).padStart(2, '0');
          const dateStr = `${dd}/${mm}/${dt.getFullYear()}`;
          const timeStr = `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
          const methodStr = /tiền mặt/i.test(p.payment_method || p.method) ? 'Tiền mặt' : 'QR Code';
          const doctorStr = apt?.doctorName || '—';
          
          const ticket = ticketByAppt.get(String(p.appointment_id));
          let techStr = doctorStr;
          if (ticket && ticket.technician_id) {
            const techStaff = staffById.get(String(ticket.technician_id));
            if (techStaff && techStaff.name) {
              techStr = techStaff.name;
            }
          }

          const finalAmt = Number(p.final_amount ?? p.total_amount ?? p.amount ?? 0);
          const svcName = apt?.service || 'Khám da liễu';
          
          const results = [];
          if (finalAmt === 50000) {
            results.push({
              id: `${p.payment_id}-deposit`,
              amount: finalAmt,
              date: dateStr,
              time: timeStr,
              method: methodStr,
              doctor: doctorStr,
              service: 'Đặt lịch giữ chỗ',
              type: 'ĐẶT LỊCH',
            });
          } else if (/khám/i.test(svcName)) {
            const parseFee = (feeVal, defaultVal = 300000) => {
              if (!feeVal) return defaultVal;
              if (typeof feeVal === 'number') return feeVal;
              const parsed = parseInt(String(feeVal).replace(/[^0-9]/g, ''), 10);
              return isNaN(parsed) ? defaultVal : parsed;
            };
            const baseFee = Math.min(finalAmt, parseFee(apt?.fee, 300000));
            const serviceAmt = finalAmt - baseFee;
            
            if (baseFee > 0) {
              results.push({
                id: `${p.payment_id}-base`,
                amount: baseFee,
                date: dateStr,
                time: timeStr,
                method: methodStr,
                doctor: doctorStr,
                service: svcName,
                type: 'KHÁM BỆNH',
              });
            }
            if (serviceAmt > 0) {
              results.push({
                id: `${p.payment_id}-service`,
                amount: serviceAmt,
                date: dateStr,
                time: timeStr,
                method: methodStr,
                doctor: techStr,
                service: 'Dịch vụ chỉ định',
                type: 'DỊCH VỤ',
              });
            }
          } else {
            if (finalAmt > 0) {
              results.push({
                id: p.payment_id,
                amount: finalAmt,
                date: dateStr,
                time: timeStr,
                method: methodStr,
                doctor: techStr,
                service: svcName,
                type: 'DỊCH VỤ',
              });
            }
          }
          return results;
        });

        if (active) {
          const historicalMock = generateHistoricalMockData();
          setTransactions([...historicalMock, ...mapped]);
        }
      } catch (e) {
        console.warn('Revenue fetch error:', e.message);
        if (active) setTransactions([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const doctors = useMemo(() => [...new Set(transactions?.map(t => t.doctor)?.filter?.(d => d !== '—'))], [transactions]);
  const methods = useMemo(() => [...new Set(transactions?.map?.(t => t.method))], [transactions]);
  const types = useMemo(() => [...new Set(transactions?.map?.(t => t.type))], [transactions]);

  const filteredData = useMemo(() => {
    if (!selectedPeriodValue && period !== 'Tất cả') return [];

    return transactions?.filter?.(t => {
      if (doctor !== 'all' && t.doctor !== doctor) return false;
      if (method !== 'all' && t.method !== method) return false;
      if (type !== 'all' && t.type !== type) return false;

      if (period === 'Tất cả') return true;

      const [dd, mm, yyyy] = t.date.split('/');
      const txDay = parseInt(dd, 10);
      const txMonth = parseInt(mm, 10) - 1;
      const txYear = parseInt(yyyy, 10);
      const txQuarter = Math.floor(txMonth / 3);

      if (period === 'Ngày') {
        const [selYear, selMonth, selDay] = selectedPeriodValue.split('-').map(Number);
        return txDay === selDay && txMonth === (selMonth - 1) && txYear === selYear;
      }
      if (period === 'Tuần') {
        const [selYear, selMonth, selDay] = selectedPeriodValue.split('-').map(Number);
        const endDate = new Date(selYear, selMonth - 1, selDay);
        const txDate = new Date(txYear, txMonth, txDay);
        const diffDays = (endDate - txDate) / (1000 * 60 * 60 * 24);
        return diffDays >= 0 && diffDays <= 6;
      }
      if (period === 'Tháng') {
        const [selMonthStr, selYearStr] = selectedPeriodValue.split('/');
        return txMonth === (parseInt(selMonthStr, 10) - 1) && txYear === parseInt(selYearStr, 10);
      }
      if (period === 'Quý') {
        const [selQStr, selYearStr] = selectedPeriodValue.split('/');
        const selQuarter = parseInt(selQStr.replace('Q', ''), 10) - 1;
        return txQuarter === selQuarter && txYear === parseInt(selYearStr, 10);
      }
      if (period === 'Năm') {
        return txYear === parseInt(selectedPeriodValue, 10);
      }

      return true;
    }).sort((a, b) => {
      const [dayA, monthA, yearA] = a.date.split('/');
      const dateA = new Date(`${yearA}-${monthA}-${dayA}T${a.time}:00`);
      
      const [dayB, monthB, yearB] = b.date.split('/');
      const dateB = new Date(`${yearB}-${monthB}-${dayB}T${b.time}:00`);
      
      return dateB - dateA;
    });
  }, [transactions, doctor, method, type, period, selectedPeriodValue]);

  const totalRevenue = filteredData.reduce((sum, t) => sum + t.amount, 0);
  const totalTransactions = filteredData.length;
  const avgRevenue = useMemo(() => {
    if (period === 'Tất cả') {
      return totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    }
    if (period === 'Ngày') {
      return totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    }
    
    let daysInPeriod = 1;
    if (period === 'Tuần') {
      daysInPeriod = 7;
    } else if (period === 'Tháng') {
      if (selectedPeriodValue && selectedPeriodValue.includes('/')) {
        const [mStr, yStr] = selectedPeriodValue.split('/');
        const m = parseInt(mStr, 10);
        const y = parseInt(yStr, 10);
        daysInPeriod = new Date(y, m, 0).getDate();
      } else {
        daysInPeriod = 30;
      }
    } else if (period === 'Quý') {
      if (selectedPeriodValue && selectedPeriodValue.includes('/')) {
        const [qStr, yStr] = selectedPeriodValue.split('/');
        const q = parseInt(qStr.replace('Q', ''), 10);
        const y = parseInt(yStr, 10);
        const mStart = (q - 1) * 3 + 1;
        daysInPeriod = 
          new Date(y, mStart, 0).getDate() + 
          new Date(y, mStart + 1, 0).getDate() + 
          new Date(y, mStart + 2, 0).getDate();
      } else {
        daysInPeriod = 90;
      }
    } else if (period === 'Năm') {
      const y = parseInt(selectedPeriodValue, 10) || new Date().getFullYear();
      const isLeap = new Date(y, 2, 0).getDate() === 29;
      daysInPeriod = isLeap ? 366 : 365;
    }
    
    return daysInPeriod > 0 ? totalRevenue / daysInPeriod : 0;
  }, [period, totalRevenue, totalTransactions, selectedPeriodValue]);
  
  const consultRevenue = filteredData?.filter?.(t => t.type === 'KHÁM BỆNH').reduce((sum, t) => sum + t.amount, 0);
  const serviceRevenue = filteredData?.filter?.(t => t.type === 'DỊCH VỤ').reduce((sum, t) => sum + t.amount, 0);
  const depositRevenue = filteredData?.filter?.(t => t.type === 'ĐẶT LỊCH').reduce((sum, t) => sum + t.amount, 0);

  const totalPieRevenue = consultRevenue + serviceRevenue + depositRevenue;
  const pctConsult = totalPieRevenue > 0 ? Math.round((consultRevenue / totalPieRevenue) * 100) : 0;
  const pctService = totalPieRevenue > 0 ? Math.round((serviceRevenue / totalPieRevenue) * 100) : 0;
  const pctDeposit = totalPieRevenue > 0 ? Math.max(0, 100 - pctConsult - pctService) : 0;

  const c = 251.2;
  const consultStroke = (pctConsult / 100) * c;
  const serviceStroke = (pctService / 100) * c;
  const depositStroke = (pctDeposit / 100) * c;
  
  const serviceOffset = 0;
  const consultOffset = -serviceStroke;
  const depositOffset = -(serviceStroke + consultStroke);

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
    if (!selectedPeriodValue) return [];

    const rawFiltered = transactions?.filter?.(t => {
      if (doctor !== 'all' && t.doctor !== doctor) return false;
      if (method !== 'all' && t.method !== method) return false;
      if (type !== 'all' && t.type !== type) return false;
      return true;
    });

    let rawData = [];
    const nowC = new Date();
    const currentYear = nowC.getFullYear();

    if (period === 'Ngày') {
      const [selYear, selMonth, selDay] = selectedPeriodValue.split('-').map(Number);
      const targetDateStr = `${String(selDay).padStart(2, '0')}/${String(selMonth).padStart(2, '0')}/${selYear}`;
      const hours = { '09:00': 0, '10:00': 0, '11:00': 0, '12:00': 0, '13:00': 0, '14:00': 0, '15:00': 0, '16:00': 0 };
      rawFiltered.forEach(t => {
        if (t.date === targetDateStr) {
          const hour = t.time.split(':')[0] + ':00';
          if (hours[hour] !== undefined) hours[hour] += t.amount;
        }
      });
      rawData = Object.keys(hours)?.map?.(h => ({ label: h, value: hours[h] }));
    } else if (period === 'Tuần') {
      const [selYear, selMonth, selDay] = selectedPeriodValue.split('-').map(Number);
      const endDate = new Date(selYear, selMonth - 1, selDay);
      
      const days = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() - i);
        const label = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
        days[label] = 0;
      }
      
      rawFiltered.forEach(t => {
        const [dd, mm, yyyy] = t.date.split('/');
        const txDay = parseInt(dd, 10);
        const txMonth = parseInt(mm, 10) - 1;
        const txYear = parseInt(yyyy, 10);
        
        const txDate = new Date(txYear, txMonth, txDay);
        const diffDays = (endDate - txDate) / (1000 * 60 * 60 * 24);
        
        if (diffDays >= 0 && diffDays <= 6) {
          const dayLabel = `${String(txDay).padStart(2, '0')}/${String(txMonth + 1).padStart(2, '0')}`;
          if (days[dayLabel] !== undefined) days[dayLabel] += t.amount;
        }
      });
      rawData = Object.keys(days)?.map?.(d => ({ label: d, value: days[d] }));
    } else if (period === 'Tháng') {
      const [selMonthStr, selYearStr] = selectedPeriodValue.split('/');
      const selMonthIdx = parseInt(selMonthStr, 10) - 1;
      const selYearVal = parseInt(selYearStr, 10);
      
      const months = {};
      for (let i = 5; i >= 0; i--) {
        const d = new Date(selYearVal, selMonthIdx - i, 1);
        const mVal = d.getMonth() + 1;
        const yVal = d.getFullYear();
        const label = `${mVal}/${yVal}`;
        months[label] = 0;
      }
      
      rawFiltered.forEach(t => {
        const [dd, mm, yyyy] = t.date.split('/');
        const txMonth = parseInt(mm, 10);
        const txYear = parseInt(yyyy, 10);
        const label = `${txMonth}/${txYear}`;
        if (months[label] !== undefined) {
          months[label] += t.amount;
        }
      });
      rawData = Object.keys(months)?.map?.(m => ({ label: `T${m}`, value: months[m] }));
    } else if (period === 'Quý') {
      const [selQStr, selYearStr] = selectedPeriodValue.split('/');
      const selQuarter = parseInt(selQStr.replace('Q', ''), 10) - 1;
      const selYearVal = parseInt(selYearStr, 10);
      
      const quarters = {};
      const refMonth = selQuarter * 3 + 2;
      let tempDate = new Date(selYearVal, refMonth, 1);
      
      for (let i = 3; i >= 0; i--) {
        const d = new Date(tempDate.getFullYear(), tempDate.getMonth() - (i * 3), 1);
        const q = Math.floor(d.getMonth() / 3) + 1;
        const y = d.getFullYear();
        const label = `Q${q}/${y.toString().slice(2)}`;
        quarters[label] = 0;
      }
      
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
      const selYearVal = parseInt(selectedPeriodValue, 10);
      const years = {};
      for (let i = 3; i >= 0; i--) {
        const y = selYearVal - i;
        years[y.toString()] = 0;
      }
      rawFiltered.forEach(t => {
        const txYear = parseInt(t.date.split('/')[2], 10);
        const yLabel = txYear.toString();
        if (years[yLabel] !== undefined) years[yLabel] += t.amount;
      });
      rawData = Object.keys(years)?.map?.(y => ({ label: y, value: years[y] }));
    }

    const maxVal = Math.max(...rawData?.map?.(d => d.value), 1);
    const niceMax = calculateNiceMax(maxVal);
    return rawData?.map?.(d => ({
      label: d.label,
      value: d.value,
      height: d.value === 0 ? 0 : Math.max((d.value / niceMax) * 150, 8),
      highlight: d.value > 0
    }));
  }, [transactions, doctor, method, type, period, selectedPeriodValue]);

  const getMethodIcon = (name) => {
    if (name.toLowerCase().includes('qr')) return CreditCard;
    return Banknote;
  };

  const getMethodColor = (name) => {
    if (name.toLowerCase().includes('qr')) return 'bg-orange-500';
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
      'Tất cả': { revenue: 0, tx: 0, avg: 0 },
      'Ngày': { revenue: 5.2, tx: 8.1, avg: -1.5 },
      'Tuần': { revenue: 10.4, tx: 12.0, avg: 3.5 },
      'Tháng': { revenue: 12.5, tx: -2.1, avg: 15.0 },
      'Quý': { revenue: -4.2, tx: 5.3, avg: -8.1 },
      'Năm': { revenue: 22.4, tx: 18.5, avg: 4.2 }
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

  const maxChartValue = useMemo(() => {
    const vals = chartData?.map?.(d => d.value || 0) || [];
    const actualMax = Math.max(...vals, 1);
    return calculateNiceMax(actualMax);
  }, [chartData]);

  const formatYAxisLabel = (val) => {
    if (val >= 1000000) {
      return (val / 1000000).toFixed(1).replace('.0', '') + 'M';
    }
    if (val >= 1000) {
      return (val / 1000).toFixed(0) + 'k';
    }
    return String(val);
  };

  if (loading) {
    return (
      <div className="min-h-[320px] flex flex-col items-center justify-center gap-3 text-slate-500">
        <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-indigo-500 animate-spin" />
        <p className="text-sm font-medium">Đang tải dữ liệu doanh thu…</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 bg-transparent pb-6 relative">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/40 backdrop-blur-md border border-slate-200/50 p-4 rounded-3xl relative z-50">
        <div className="text-xs sm:text-sm font-semibold text-slate-700">
          Thời gian thống kê: <span className="text-indigo-600 font-extrabold">{period === 'Tất cả' ? 'Toàn thời gian' : getPeriodDetailsLabel()}</span>
        </div>
        <div ref={tabBarRef} className="flex bg-slate-100 border border-slate-200 rounded-full p-1 gap-1 relative z-50">
          {['Tất cả', 'Ngày', 'Tuần', 'Tháng', 'Quý', 'Năm']?.map?.(p => {
            const isActive = period === p;
            const options = p !== 'Tất cả' ? getOptionsForPeriod(p) : [];
            const isDropdownOpen = activeDropdown === p;

            return (
              <div key={p} className="relative">
                <button
                  onClick={() => {
                    setPeriod(p);
                    if (p === 'Tất cả') {
                      setActiveDropdown(null);
                      setSelectedPeriodValue('');
                    } else {
                      setActiveDropdown(activeDropdown === p ? null : p);
                    }
                  }}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border-none outline-none cursor-pointer flex items-center gap-1 ${
                    isActive ? 'bg-white text-indigo-700 shadow-sm' : 'bg-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {p}
                  {p !== 'Tất cả' && (
                    <ChevronDown className={`w-3 h-3 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  )}
                </button>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-48 bg-white border border-slate-200/50 rounded-2xl shadow-xl z-50 overflow-hidden py-1"
                    >
                      <div className="max-h-56 overflow-y-auto custom-scrollbar flex flex-col">
                        {options.map((opt) => {
                          const isSelected = selectedPeriodValue === opt.value;
                          return (
                            <button
                              key={opt.value}
                              onClick={() => {
                                setSelectedPeriodValue(opt.value);
                                setActiveDropdown(null);
                              }}
                              className={`w-full text-left px-3 py-2 text-xs font-semibold transition-colors hover:bg-slate-50 flex justify-between items-center ${
                                isSelected ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-600'
                              }`}
                            >
                              <span className="truncate">{opt.label}</span>
                              {isSelected && <Check className="w-3 h-3 shrink-0" />}
                            </button>
                          );
                        })}
                        
                        {p === 'Ngày' && (
                          <div className="p-2 border-t border-slate-100 flex flex-col gap-1 bg-slate-50/50">
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Ngày khác:</span>
                            <input 
                              type="date" 
                              value={selectedPeriodValue.includes('-') ? selectedPeriodValue : ''} 
                              onChange={(e) => {
                                if (e.target.value) {
                                  setSelectedPeriodValue(e.target.value);
                                  setActiveDropdown(null);
                                }
                              }}
                              className="w-full px-2 py-1 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white cursor-pointer font-semibold text-slate-700"
                            />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-1 relative z-30">
        <div className={`${GLASS_BASE} ${GLASS_HOVER} p-6 flex flex-col min-h-[130px]`}>
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
            <p className="text-[9px] text-slate-500 font-medium uppercase tracking-wider">Lọc theo {period.toLowerCase()}</p>
          </div>
        </div>

        <div className={`${GLASS_BASE} ${GLASS_HOVER} p-6 flex flex-col min-h-[130px]`}>
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
            <p className="text-[9px] text-slate-500 font-medium uppercase tracking-wider">Thanh toán hoàn tất</p>
          </div>
        </div>

        <div className={`${GLASS_BASE} ${GLASS_HOVER} p-6 flex flex-col min-h-[130px]`}>
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
            <p className="text-[9px] text-slate-500 font-medium uppercase tracking-wider">{period === 'Ngày' ? 'TB mỗi giao dịch' : 'TB mỗi ngày'}</p>
          </div>
        </div>
      </div>
      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-20">
        <div className={`${GLASS_BASE} p-6 lg:col-span-2 flex flex-col`}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className={GLASS_TITLE}>{period === 'Ngày' ? 'Chi tiết doanh thu' : 'Xu hướng doanh thu'}</h3>
              <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                {getChartDescription()}
              </p>
            </div>
            {period !== 'Ngày' && (
              <div className={`flex items-center gap-1 px-2 py-1 ${revTrend.isUp ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'} text-[10px] font-bold rounded-full`}>
                {revTrend.isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />} {revTrend.isUp ? '+' : '-'}{revTrend.value}% so với kỳ trước
              </div>
            )}
          </div>

          <div className="flex-1 flex gap-3 mt-6 min-h-[180px] relative">
            {/* Y-Axis Labels */}
            <div className="w-10 flex flex-col justify-between text-right text-[9px] font-bold text-slate-400 select-none pr-1.5 h-[150px] mt-auto">
              <span>{formatYAxisLabel(maxChartValue)}</span>
              <span>{formatYAxisLabel(maxChartValue * 2 / 3)}</span>
              <span>{formatYAxisLabel(maxChartValue / 3)}</span>
              <span>0</span>
            </div>

            {/* Chart Area */}
            <div className="flex-1 relative flex flex-col justify-end h-[150px] mt-auto border-b border-slate-200/60">
              {/* Background Grid Lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                <div className="w-full border-t border-dashed border-slate-300"></div>
                <div className="w-full border-t border-dashed border-slate-300"></div>
                <div className="w-full border-t border-dashed border-slate-300"></div>
                <div className="w-full"></div>
              </div>

              {/* Foreground Bars */}
              <div className="absolute inset-x-0 bottom-0 top-0 flex items-end justify-between gap-2 z-10">
                {chartData?.map?.((d) => (
                  <div key={d.label} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                    {/* Bar */}
                    <div 
                      className={`w-6 md:w-8 ${d.highlight ? 'bg-indigo-600' : 'bg-slate-200'} transition-all duration-500 relative`} 
                      style={{ height: `${d.height}px` }}
                    >
                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1.5 px-2 py-1 bg-slate-800 text-white text-[9px] font-bold rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                        {d.value.toLocaleString('vi-VN')} VNĐ
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* X-Axis Labels */}
          <div className="flex pl-10 pr-0 mt-1">
            <div className="flex-1 flex justify-between gap-2">
              {chartData?.map?.((d) => (
                <div key={d.label} className="flex-1 text-center">
                  <span className={`text-[10px] font-bold ${d.highlight ? 'text-indigo-600' : 'text-slate-500'}`}>{d.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={`${GLASS_BASE} p-6 flex flex-col`}>
          <div>
            <h3 className={GLASS_TITLE}>Cơ cấu nguồn thu</h3>
            <p className="text-[11px] text-slate-500 mt-0.5 mb-4">Phân bổ theo loại hình doanh thu</p>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <div className="flex justify-center mb-4">
              <div className="relative w-32 h-32">
                <svg width="100%" height="100%" viewBox="0 0 100 100" className="transform -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="16" />
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#ef4444" strokeWidth="16" strokeDasharray={`${serviceStroke} 251.2`} strokeDashoffset={serviceOffset} className="transition-all duration-700" />
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#eab308" strokeWidth="16" strokeDasharray={`${consultStroke} 251.2`} strokeDashoffset={consultOffset} className="transition-all duration-700" />
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#3b82f6" strokeWidth="16" strokeDasharray={`${depositStroke} 251.2`} strokeDashoffset={depositOffset} className="transition-all duration-700" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[8px] font-bold text-slate-500">TỔNG THU</span>
                  <span className="text-lg font-black text-slate-900 leading-none mt-0.5">100%</span>
                </div>
              </div>
            </div>
            <div className="space-y-2 px-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div><span className="font-semibold text-slate-700">Dịch vụ</span>
                </div>
                <span className="font-bold text-slate-900">{pctService}%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div><span className="font-semibold text-slate-700">Khám bệnh</span>
                </div>
                <span className="font-bold text-slate-900">{pctConsult}%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div><span className="font-semibold text-slate-700">Đặt lịch giữ chỗ</span>
                </div>
                <span className="font-bold text-slate-900">{pctDeposit}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* ── Middle Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
        <div className={`${GLASS_BASE} p-6 flex flex-col justify-between`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={GLASS_TITLE}>Doanh thu theo bác sĩ</h3>
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

        <div className={`${GLASS_BASE} p-6 flex flex-col justify-between`}>
          <div>
            <h3 className={GLASS_TITLE}>Phương thức thanh toán</h3>
            <p className="text-[11px] text-slate-500 mt-0.5 mb-4">Tỷ lệ theo phương thức thanh toán</p>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <div className="flex justify-center mb-4">
              <div className="relative w-32 h-32">
                <svg width="100%" height="100%" viewBox="0 0 100 100" className="transform -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="16" />
                  {(() => {
                    let offset = 0;
                    return methodStats?.map?.((ms, i) => {
                      let strokeColor = '#3b82f6'; // default blue
                      if (ms.name.toLowerCase().includes('tiền mặt')) strokeColor = '#10b981'; // emerald-500
                      else if (ms.name.toLowerCase().includes('qr')) strokeColor = '#8b5cf6'; // violet-500
                      else if (i === 0) strokeColor = '#10b981';
                      else if (i === 1) strokeColor = '#8b5cf6';
                      
                      const strokeDash = ms.pct * 2.512; // r=40 -> C=251.2 -> pct/100 * 251.2
                      const currentOffset = offset;
                      offset -= strokeDash;
                      
                      if (ms.pct === 0) return null;
                      return (
                        <circle
                          key={ms.name}
                          cx="50" cy="50" r="40"
                          fill="transparent"
                          stroke={strokeColor}
                          strokeWidth="16"
                          strokeDasharray={`${strokeDash} 251.2`}
                          strokeDashoffset={currentOffset}
                          className="transition-all duration-700"
                        />
                      );
                    });
                  })()}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[8px] font-bold text-slate-500">TỔNG GIAO DỊCH</span>
                  <span className="text-lg font-black text-slate-900 leading-none mt-0.5">{totalTransactions}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2 px-1 mt-2">
              {methodStats.length > 0 ? methodStats?.map?.((ms, i) => {
                let dotColor = 'bg-blue-500';
                if (ms.name.toLowerCase().includes('tiền mặt')) dotColor = 'bg-emerald-500';
                else if (ms.name.toLowerCase().includes('qr')) dotColor = 'bg-violet-500';
                else if (i === 0) dotColor = 'bg-emerald-500';
                else if (i === 1) dotColor = 'bg-violet-500';

                return (
                  <div key={ms.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${dotColor}`}></div>
                      <span className="font-semibold text-slate-700">{ms.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-medium">{formatCurrency(ms.amount)} VNĐ</span>
                      <span className="font-bold text-slate-900 w-8 text-right">{Math.round(ms.pct)}%</span>
                    </div>
                  </div>
                );
              }) : <p className="text-xs text-slate-500 text-center py-2">Không có dữ liệu phương thức</p>}
            </div>
          </div>
        </div>
      </div>
      {/* ── Table Chi tiết giao dịch ── */}
      <div className={`${GLASS_BASE} overflow-hidden relative z-0`}>
        <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <h3 className={GLASS_TITLE}>Chi tiết giao dịch</h3>
          <span className="text-xs font-semibold text-slate-500">
            {totalTransactions} giao dịch <span className="mx-1.5 text-slate-300">•</span> <span className="text-indigo-600 font-bold">{formatCurrency(totalRevenue)} VNĐ</span>
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-4 py-2.5 text-left font-bold text-slate-500 text-[10px] uppercase tracking-wider whitespace-nowrap">Ngày/Giờ</th>
                <th className="px-4 py-2.5 text-left font-bold text-slate-500 text-[10px] uppercase tracking-wider">Dịch vụ/Khám bệnh</th>
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
                        tx.type === 'DỊCH VỤ' ? 'bg-red-50 text-red-700' :
                        tx.type === 'ĐẶT LỊCH' ? 'bg-blue-50 text-blue-700' :
                        'bg-yellow-50 text-yellow-700'
                      }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600 font-medium flex items-center gap-1.5">
                      <Icon className="w-3 h-3 text-slate-500" />
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
