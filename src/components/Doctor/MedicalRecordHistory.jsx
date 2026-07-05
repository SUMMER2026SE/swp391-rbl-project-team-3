import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, CalendarDays, Eye, CheckCircle2, Clock, FileText, Users, ChevronLeft, ChevronRight, Filter, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GLASS_BASE, GLASS_HOVER, GLASS_INPUT } from '../common/GlassCard';
import { supabase } from '../../supabaseClient';
import { DoctorModel } from '../../models/DoctorModel';

const PAGE_SIZE = 10;

/**
 * MedicalRecordHistory — full-featured history browser for the Doctor Portal.
 *
 * Pulls ALL completed appointments (status ∈ 'Đã khám' | 'Đã thanh toán' |
 * 'Reviewed') for the logged-in doctor, together with their medical_records
 * row (diagnosis, symptoms, doctor_note) in a single Supabase query.
 *
 * Supports:
 *  • free-text search on patient name
 *  • date-range filter
 *  • client-side pagination
 *  • click "Xem lại hồ sơ" → opens VirtualClinicWorkspace in review mode
 */
export default function MedicalRecordHistory({ doctorId, searchQuery = '', onReviewRecord }) {
  // ── Data ──
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // ── Filters ──
  const [localSearch, setLocalSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // ── Pagination ──
  const [currentPage, setCurrentPage] = useState(1);

  // Merge the global header search with the local search box. The local box
  // takes priority when it has content; otherwise we fall back to whatever the
  // doctor typed in the header.
  const effectiveSearch = (localSearch || searchQuery || '').trim().toLowerCase();

  // ── Fetch once on mount / doctorId change ──
  const loadRecords = useCallback(async () => {
    if (!doctorId) return;
    setIsLoading(true);
    try {
      // Pull completed appointments that belong to THIS doctor. We join
      // medical_records via appointment_id so we get the diagnosis inline.
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          appointment_id,
          patient_id,
          doctor_id,
          appointment_date,
          start_time,
          status,
          service,
          reason,
          fee,
          medical_records (
            record_id,
            diagnosis,
            symptoms,
            doctor_note,
            created_at
          )
        `)
        .eq('doctor_id', doctorId)
        .in('status', ['Đã khám', 'COMPLETED', 'EXAMINED', 'Đã thanh toán', 'PAID', 'Reviewed', 'REVIEWED']);

      if (error) throw error;

      // Resolve patient names in a single batch
      const rows = data || [];
      const patientIds = [...new Set(rows.map((r) => r.patient_id).filter(Boolean))];
      let nameMap = {};
      if (patientIds.length > 0) {
        const { data: users } = await supabase
          .from('users')
          .select('user_id, full_name, phone')
          .in('user_id', patientIds);
        if (users) {
          users.forEach((u) => {
            nameMap[u.user_id] = { name: u.full_name, phone: u.phone };
          });
        }
      }

      const mapped = rows.map((row) => {
        const mr = Array.isArray(row.medical_records)
          ? row.medical_records[0]
          : row.medical_records;
        return {
          id: row.appointment_id,
          patientId: row.patient_id,
          patientName: nameMap[row.patient_id]?.name || 'Bệnh nhân',
          patientPhone: nameMap[row.patient_id]?.phone || '',
          doctorId: row.doctor_id,
          date: row.appointment_date,
          time: (row.start_time || '').substring(0, 5),
          status: row.status,
          service: row.service || 'Khám da liễu tổng quát',
          reason: row.reason || '',
          fee: row.fee || '',
          diagnosis: mr?.diagnosis || '',
          symptoms: mr?.symptoms || '',
          doctorNote: mr?.doctor_note || '',
          recordId: mr?.record_id || null,
          recordCreatedAt: mr?.created_at || row.appointment_date,
        };
      });

      // Sort most recent first
      mapped.sort((a, b) => {
        const dCmp = (b.date || '').localeCompare(a.date || '');
        if (dCmp !== 0) return dCmp;
        return (b.time || '').localeCompare(a.time || '');
      });

      setRecords(mapped);
    } catch (err) {
      console.error('[MedicalRecordHistory] Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [doctorId]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [effectiveSearch, dateFrom, dateTo]);

  // ── Filtering ──
  const filtered = useMemo(() => {
    return records.filter((r) => {
      // Text search — patient name or phone
      if (effectiveSearch) {
        const haystack = `${r.patientName} ${r.patientPhone} ${r.diagnosis}`.toLowerCase();
        if (!haystack.includes(effectiveSearch)) return false;
      }
      // Date range
      if (dateFrom && r.date < dateFrom) return false;
      if (dateTo && r.date > dateTo) return false;
      return true;
    });
  }, [records, effectiveSearch, dateFrom, dateTo]);

  // ── Pagination ──
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // ── Stats ──
  const totalAll = records.length;
  const thisMonth = (() => {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return records.filter((r) => (r.date || '').startsWith(ym)).length;
  })();

  // Handle "Xem lại hồ sơ" click — resolve doctor name and build the
  // appointment-like object that VirtualClinicWorkspace expects.
  const handleReview = async (rec) => {
    if (!onReviewRecord) return;
    const doctors = DoctorModel.getAllDoctorsSync?.() || [];
    const doc = doctors.find((d) => String(d.id || d.user_id) === String(rec.doctorId));
    onReviewRecord({
      id: rec.id,
      appointment_id: rec.id,
      patient_id: rec.patientId,
      patientId: rec.patientId,
      patientName: rec.patientName,
      doctor_id: rec.doctorId,
      doctorId: rec.doctorId,
      doctorName: doc?.name || 'Bác sĩ',
      date: rec.date,
      time: rec.time,
      status: 'Đã khám',
      service: rec.service,
      reason: rec.reason,
      symptoms: rec.symptoms,
    });
  };

  const clearFilters = () => {
    setLocalSearch('');
    setDateFrom('');
    setDateTo('');
  };

  const hasActiveFilters = localSearch || dateFrom || dateTo;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div>
        <h1 className="font-extrabold text-2xl md:text-3xl text-slate-900 tracking-tight">
          Lịch sử Khám bệnh
        </h1>
        <p className="text-sm md:text-base text-slate-600 font-medium mt-1">
          Tra cứu hồ sơ bệnh nhân đã khám
        </p>
      </div>

      {/* ── Quick Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`${GLASS_BASE} p-4 flex items-center gap-4`}>
          <div className="w-11 h-11 rounded-xl border flex items-center justify-center bg-emerald-500/10 border-emerald-200/60">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-extrabold leading-none text-emerald-600">{totalAll}</p>
            <p className="text-sm font-bold text-slate-600 mt-1">Tổng ca đã khám</p>
          </div>
        </div>
        <div className={`${GLASS_BASE} p-4 flex items-center gap-4`}>
          <div className="w-11 h-11 rounded-xl border flex items-center justify-center bg-sky-500/10 border-sky-200/60">
            <CalendarDays className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <p className="text-2xl font-extrabold leading-none text-sky-600">{thisMonth}</p>
            <p className="text-sm font-bold text-slate-600 mt-1">Tháng này</p>
          </div>
        </div>
        <div className={`${GLASS_BASE} p-4 flex items-center gap-4`}>
          <div className="w-11 h-11 rounded-xl border flex items-center justify-center bg-violet-500/10 border-violet-200/60">
            <FileText className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <p className="text-2xl font-extrabold leading-none text-violet-600">{filtered.length}</p>
            <p className="text-sm font-bold text-slate-600 mt-1">Kết quả lọc</p>
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className={`${GLASS_BASE} p-4`}>
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Tìm theo tên bệnh nhân, SĐT, chẩn đoán..."
              className={`${GLASS_INPUT} w-full pl-10 pr-4 py-2.5 text-sm font-semibold rounded-xl`}
            />
          </div>

          {/* Toggle advanced filters */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border cursor-pointer ${
              showFilters
                ? 'bg-teal-500/10 text-teal-700 border-teal-300/50'
                : 'bg-white/30 text-slate-600 border-white/40 hover:bg-white/50'
            }`}
          >
            <Filter className="w-4 h-4" />
            Bộ lọc
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-bold text-rose-600 bg-rose-50/50 border border-rose-200/50 hover:bg-rose-100/60 transition-all cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Xóa bộ lọc
            </button>
          )}
        </div>

        {/* Advanced filter row */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row gap-3 mt-3 pt-3 border-t border-slate-200/40">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    Từ ngày
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className={`${GLASS_INPUT} px-3 py-2 text-sm font-semibold rounded-xl`}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    Đến ngày
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className={`${GLASS_INPUT} px-3 py-2 text-sm font-semibold rounded-xl`}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Records Table ── */}
      <div className="backdrop-blur-xl bg-white/40 border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-[2rem] overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
            <span className="ml-3 text-sm font-semibold text-slate-500">Đang tải lịch sử khám...</span>
          </div>
        ) : paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <FileText className="w-12 h-12 mb-3 text-slate-300" />
            <p className="text-base font-semibold">
              {effectiveSearch || dateFrom || dateTo
                ? 'Không tìm thấy hồ sơ phù hợp với bộ lọc.'
                : 'Chưa có hồ sơ khám bệnh nào.'}
            </p>
            {(effectiveSearch || dateFrom || dateTo) && (
              <button
                onClick={clearFilters}
                className="mt-3 text-sm font-bold text-teal-600 hover:text-teal-700 cursor-pointer bg-transparent border-none"
              >
                Xóa bộ lọc để xem tất cả
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-200/50">
                    <th className="py-4 pl-6 pr-2 text-xs font-bold text-slate-500 uppercase tracking-wider w-12">
                      #
                    </th>
                    <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Ngày khám
                    </th>
                    <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Bệnh nhân
                    </th>
                    <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Dịch vụ
                    </th>
                    <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Chẩn đoán
                    </th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/50">
                  {paginated.map((rec, idx) => (
                    <tr
                      key={rec.id}
                      className="hover:bg-white/60 transition-colors"
                    >
                      <td className="py-4 pl-6 pr-2">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-extrabold border bg-slate-100 text-slate-500 border-slate-200">
                          {(currentPage - 1) * PAGE_SIZE + idx + 1}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 text-sm text-slate-800 font-bold">
                          <CalendarDays className="w-4 h-4 text-teal-500 shrink-0" />
                          {rec.date ? new Date(rec.date + 'T00:00:00').toLocaleDateString('vi-VN') : '—'}
                        </div>
                        {rec.time && (
                          <span className="text-xs text-slate-500 font-semibold flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {rec.time}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-base font-bold text-slate-900">{rec.patientName}</p>
                        {rec.patientPhone && (
                          <p className="text-xs text-slate-500 font-medium mt-0.5">{rec.patientPhone}</p>
                        )}
                      </td>
                      <td className="py-4 px-4 text-sm font-medium text-slate-600 max-w-[180px] truncate">
                        {rec.service}
                      </td>
                      <td className="py-4 px-4">
                        {rec.diagnosis ? (
                          <span className="inline-block max-w-[220px] truncate text-sm font-semibold text-slate-700 bg-emerald-50/60 border border-emerald-200/40 px-2.5 py-1 rounded-lg">
                            {rec.diagnosis}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Chưa ghi nhận</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleReview(rec)}
                          className="inline-flex items-center justify-center gap-2 bg-white/40 hover:bg-white/80 border border-slate-200/50 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:shadow active:scale-95 transition-all cursor-pointer backdrop-blur-md"
                        >
                          <Eye className="w-4 h-4 text-emerald-500" />
                          Xem lại hồ sơ
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Pagination ── */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200/40">
                <p className="text-xs font-semibold text-slate-500">
                  Hiển thị {(currentPage - 1) * PAGE_SIZE + 1}–
                  {Math.min(currentPage * PAGE_SIZE, filtered.length)} / {filtered.length} kết quả
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className={`p-2 rounded-lg border text-sm font-bold transition-all cursor-pointer ${
                      currentPage <= 1
                        ? 'text-slate-300 border-slate-100 cursor-not-allowed bg-transparent'
                        : 'text-slate-600 border-slate-200/50 hover:bg-white/60 active:scale-95 bg-white/30'
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                    .reduce((acc, p, i, arr) => {
                      if (i > 0 && p - arr[i - 1] > 1) acc.push('...');
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((item, i) =>
                      item === '...' ? (
                        <span key={`ellipsis-${i}`} className="px-1 text-slate-400 text-xs select-none">
                          ···
                        </span>
                      ) : (
                        <button
                          key={item}
                          onClick={() => setCurrentPage(item)}
                          className={`w-9 h-9 rounded-lg text-sm font-extrabold transition-all cursor-pointer border ${
                            currentPage === item
                              ? 'bg-teal-500 text-white border-teal-500 shadow-sm shadow-teal-500/30'
                              : 'text-slate-600 border-slate-200/50 hover:bg-white/60 bg-white/30'
                          }`}
                        >
                          {item}
                        </button>
                      )
                    )}

                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className={`p-2 rounded-lg border text-sm font-bold transition-all cursor-pointer ${
                      currentPage >= totalPages
                        ? 'text-slate-300 border-slate-100 cursor-not-allowed bg-transparent'
                        : 'text-slate-600 border-slate-200/50 hover:bg-white/60 active:scale-95 bg-white/30'
                    }`}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
