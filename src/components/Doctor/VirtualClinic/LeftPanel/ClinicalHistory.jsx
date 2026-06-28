import React, { useState, useEffect } from 'react';
import { Activity, Beaker, CalendarDays, ChevronDown, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../../supabaseClient';
import { GLASS_BASE } from '../../../common/GlassCard';

export default function ClinicalHistory({ patientId, ticketsStatusHash }) {
  const [patientLabs, setPatientLabs] = useState([]);
  const [patientRecords, setPatientRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (!patientId) return;

    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        // 1. Fetch service tickets for this patient
        const { data: tickets, error: ticketErr } = await supabase
          .from('service_tickets')
          .select(`
            id,
            service_name,
            status,
            result_notes,
            result_image_url,
            created_at,
            updated_at,
            appointment:appointments!inner (
              patient_id
            )
          `)
          .eq('appointment.patient_id', patientId);

        if (ticketErr) throw ticketErr;

        // 2. Fetch past medical records for this patient
        const { data: records, error: recordErr } = await supabase
          .from('medical_records')
          .select(`
            record_id,
            diagnosis,
            symptoms,
            doctor_note,
            created_at,
            doctor:users!medical_records_doctor_id_users_fkey (
              full_name
            )
          `)
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false });

        if (recordErr) throw recordErr;

        // Map database tickets to UI model
        const mappedLabs = (tickets || []).map((t) => ({
          id: t.id,
          testName: t.service_name,
          status: t.status === 'TECH_COMPLETED' ? 'Đã hoàn thành' : 'Đang thực hiện',
          dateRequested: new Date(t.created_at).toLocaleDateString('vi-VN'),
          dateCompleted: t.updated_at ? new Date(t.updated_at).toLocaleDateString('vi-VN') : '—',
          summary: t.result_notes || 'Chưa ghi nhận kết luận kỹ thuật.',
          result_image_url: t.result_image_url,
        }));

        // Map database medical records to UI model
        const mappedRecords = (records || []).map((rec) => ({
          id: rec.record_id,
          date: new Date(rec.created_at).toLocaleDateString('vi-VN'),
          specialty: 'Da liễu',
          doctor: rec.doctor?.full_name || 'Bác sĩ',
          diagnosis: rec.diagnosis || 'Chưa ghi nhận',
          prescription: rec.doctor_note || 'Chưa ghi nhận',
        }));

        setPatientLabs(mappedLabs);
        setPatientRecords(mappedRecords);
      } catch (err) {
        console.error('[ClinicalHistory] Fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [patientId, ticketsStatusHash]);

  if (isLoading) {
    return (
      <div className={`${GLASS_BASE} water-refract rounded-[2rem] p-8 text-center text-slate-500 font-medium`}>
        <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto mb-3" />
        <p className="text-sm font-semibold">Đang tải lịch sử bệnh án...</p>
      </div>
    );
  }

  if (patientLabs.length === 0 && patientRecords.length === 0) {
    return (
      <div className={`${GLASS_BASE} water-refract rounded-[2rem] p-8 text-center text-slate-500 font-medium`}>
        <Activity className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-sm font-semibold">Chưa có dữ liệu xét nghiệm/AI cho bệnh nhân này.</p>
      </div>
    );
  }

  return (
    <div className={`${GLASS_BASE} water-refract rounded-[2rem] p-6 text-left`}>
      {/* Always visible: Header + Summary */}
      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-200/40">
        <Activity className="w-5 h-5 text-teal-600" />
        <div className="flex-1">
          <h3 className="font-bold text-lg text-slate-900">Lịch sử Cận lâm sàng & Tiến triển</h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {patientLabs.length} kết quả dịch vụ • {patientRecords.length} lần khám
          </p>
        </div>
      </div>
      {/* Toggle Button */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center gap-1.5 text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors mb-4 cursor-pointer border-none bg-transparent"
      >
        <motion.span
          animate={{ rotate: showDetails ? 180 : 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="inline-flex"
        >
          <ChevronDown className="w-4 h-4" />
        </motion.span>
        {showDetails ? 'Thu gọn' : 'Xem thêm chi tiết'}
      </button>
      {/* Collapsible: Lab Tests + Timeline */}
      <AnimatePresence initial={false}>
        {showDetails && (
          <motion.div
            key="clinical-details"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            {/* Lab Tests Section */}
            <div className="mb-8">
              <h4 className="font-bold text-sm text-slate-700 flex items-center gap-1.5 mb-4">
                <Beaker className="w-4 h-4 text-sky-500" /> Kết quả Xét nghiệm / Dịch vụ
              </h4>
              <div className="grid grid-cols-1 gap-4">
                {patientLabs.length > 0 ? (
                  patientLabs.map((lab) => (
                    <div key={lab.id} className="bg-white/65 p-4 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow group">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-sm text-sky-700 group-hover:text-sky-650 transition-colors">{lab.testName}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          lab.status === 'Đã hoàn thành'
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200/30'
                            : 'bg-amber-50 text-amber-600 border-amber-200/30 animate-pulse'
                        }`}>
                          {lab.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 font-semibold mb-2">
                        Yêu cầu: {lab.dateRequested} {lab.status === 'Đã hoàn thành' && `| Hoàn thành: ${lab.dateCompleted}`}
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-lg text-xs font-semibold text-slate-700 border border-slate-100/50 leading-relaxed">
                        <span className="text-slate-400 font-bold">Ghi nhận KTV:</span> {lab.summary}
                      </div>
                      {lab.result_image_url && (
                        <div className="mt-3.5 rounded-xl overflow-hidden border border-slate-200 max-h-48 max-w-full">
                          <img src={lab.result_image_url} alt={lab.testName} className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400 italic">Không có xét nghiệm cận lâm sàng nào.</p>
                )}
              </div>
            </div>

            {/* Timeline Section */}
            <div>
              <h4 className="font-bold text-sm text-slate-700 flex items-center gap-1.5 mb-4">
                <CalendarDays className="w-4 h-4 text-teal-500" /> Tiến triển điều trị (Lịch sử khám)
              </h4>
              <div className="relative pl-4 border-l-2 border-slate-200/60 space-y-6">
                {patientRecords.length > 0 ? (
                  patientRecords.map((rec) => (
                    <div key={rec.id} className="relative">
                      <div className="absolute -left-[21px] top-1.5 w-3 h-3 bg-teal-500 rounded-full border-2 border-white shadow-sm"></div>
                      <div className="bg-white/55 p-3.5 rounded-2xl border border-slate-200/60 shadow-sm">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="font-bold text-xs text-slate-800">{rec.date}</span>
                          <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-1.5 py-0.5 rounded">{rec.specialty}</span>
                        </div>
                        <div className="text-xs text-slate-500 font-semibold mb-2">
                          <span className="font-bold text-slate-400">BS:</span> {rec.doctor}
                        </div>
                        <div className="text-xs text-slate-700 font-semibold bg-slate-50 p-2.5 rounded-xl">
                          <div className="mb-1.5"><span className="text-teal-600 font-bold">CĐ:</span> {rec.diagnosis}</div>
                          <div><span className="text-sky-650 font-bold">Lời dặn:</span> {rec.prescription}</div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400 italic">Bệnh nhân mới, chưa có lịch sử điều trị.</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
