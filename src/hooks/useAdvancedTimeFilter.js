import { useState, useRef, useEffect } from 'react';

export function useAdvancedTimeFilter(initialPeriod = 'Tháng') {
  const [period, setPeriod] = useState(initialPeriod);
  const [selectedPeriodValue, setSelectedPeriodValue] = useState('');
  const [activeDropdown, setActiveDropdown] = useState(null);
  const tabBarRef = useRef(null);
  const prevPeriodRef = useRef(period);

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tabBarRef.current && !tabBarRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (period === 'Tất cả') {
      setSelectedPeriodValue('');
      prevPeriodRef.current = period;
      return;
    }
    
    const prevPeriod = prevPeriodRef.current;
    const context = parsePeriodContext(selectedPeriodValue, prevPeriod);

    if (period === 'Ngày') {
      const lastDay = new Date(context.y, context.m, 0).getDate();
      setSelectedPeriodValue(`${context.y}-${String(context.m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`);
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
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const context = parsePeriodContext(selectedPeriodValue, period);
    const isCurrentYearSelected = context.y === currentYear;

    if (targetPeriod === 'Ngày') {
      const list = [];
      const lastDay = new Date(context.y, context.m, 0).getDate();
      const refDate = new Date(context.y, context.m - 1, lastDay);
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
          list.push({ value: valStr, label: `${sDd}/${sMm}/${startDate.getFullYear()} - ${eDd}/${eMm}/${endDate.getFullYear()}` });
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
          list.push({ value: valStr, label: `${sDd}/${sMm}/${startDate.getFullYear()} - ${eDd}/${eMm}/${endDate.getFullYear()}` });
        }
        return list;
      }
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
        list.push({ value: valStr, label: `${sDd}/${sMm}/${startDate.getFullYear()} - ${eDd}/${eMm}/${endDate.getFullYear()}` });
      }
      return list;
    }
    if (targetPeriod === 'Tháng') {
      const list = [];
      if (period === 'Quý') {
        for (let i = 2; i >= 0; i--) {
          const monthIdx = (context.q - 1) * 3 + i;
          const mStr = String(monthIdx + 1).padStart(2, '0');
          list.push({ value: `${mStr}/${context.y}`, label: `Tháng ${mStr}/${context.y}` });
        }
        return list;
      }
      const startMonth = isCurrentYearSelected ? currentMonth : 11;
      for (let i = 0; i < 12; i++) {
        const d = new Date(context.y, startMonth - i, 1);
        const m = d.getMonth() + 1;
        const y = d.getFullYear();
        if (y !== context.y) break;
        const mStr = String(m).padStart(2, '0');
        let label = `Tháng ${mStr}/${y}`;
        if (y === currentYear && m - 1 === currentMonth) label = `Tháng này (${mStr}/${y})`;
        else if (y === currentYear && m - 1 === currentMonth - 1) label = `Tháng trước (${mStr}/${y})`;
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
        list.push({ value: String(y), label: y === currentYear ? `Năm nay (${y})` : `Năm ${y}` });
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
    if (period === 'Tháng') return `Tháng ${selectedPeriodValue}`;
    if (period === 'Quý') return `${selectedPeriodValue}`;
    if (period === 'Năm') return `Năm ${selectedPeriodValue}`;
    return '';
  };

  return {
    period, setPeriod,
    selectedPeriodValue, setSelectedPeriodValue,
    activeDropdown, setActiveDropdown,
    tabBarRef,
    getOptionsForPeriod, getPeriodDetailsLabel
  };
}
