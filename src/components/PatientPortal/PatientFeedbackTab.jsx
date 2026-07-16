import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, MessageSquare, Edit3, CheckCircle2,
  Stethoscope, Calendar, Clock, Sparkles,
  Wrench, Building2, Eye, EyeOff, Image,
  ChevronDown, ChevronUp, Reply, ClipboardList,
  Receipt, RefreshCw
} from 'lucide-react';
import { useFeedbackController } from '../../controllers/useFeedbackController';
import { useAppointmentController } from '../../controllers/useAppointmentController';
import { AppointmentModel } from '../../models/AppointmentModel';
import { useTechnicians } from '../../hooks/useDoctors';
import { supabase } from '../../supabaseClient';
import FeedbackFormModal from './FeedbackFormModal';
import InvoiceDetailModal from './InvoiceDetailModal';
import GlassPagination from '../common/GlassPagination';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function StarDisplay({ value, size = 'md' }) {
  const sz = { lg: 'w-6 h-6', md: 'w-5 h-5', sm: 'w-4 h-4', xs: 'w-3.5 h-3.5' }[size];
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5]?.map?.(s => (
        <Star key={s} className={`${sz} ${s <= value ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}`} />
      ))}
    </span>
  );
}

const CRITERIA_META = [
  { key: 'treatmentEffect', label: 'Hiệu quả điều trị',  icon: Sparkles },
  { key: 'waitingTime',     label: 'Thời gian chờ',       icon: Clock },
  { key: 'facility',        label: 'Cơ sở vật chất',      icon: Building2 },
];

// Lists render exactly one page of PAGE_SIZE entries; older visits live on the
// next pages of the shared numbered pager (GlassPagination) below the list.
const PAGE_SIZE = 5;

const RATING_LABELS = { 1: 'Rất tệ', 2: 'Tệ', 3: 'Bình thường', 4: 'Tốt', 5: 'Xuất sắc' };
const RATING_COLORS = {
  1: 'text-rose-600 bg-rose-50 border-rose-200',
  2: 'text-orange-600 bg-orange-50 border-orange-200',
  3: 'text-amber-600 bg-amber-50 border-amber-200',
  4: 'text-sky-600 bg-sky-50 border-sky-200',
  5: 'text-emerald-600 bg-emerald-50 border-emerald-200',
};

// ─── Feedback Card (Patient's own review) ─────────────────────────────────────
function MyFeedbackCard({ fb }) {
  const [expanded, setExpanded] = useState(false);
  const { technicians } = useTechnicians();

  const calcAvg = (criteria) => {
    if (!criteria) return fb?.overallRating || 0;
    const vals = Object.values(criteria).filter(v => v > 0);
    if (vals.length === 0) return fb.overallRating;
    const sum = vals.reduce((a, b) => a + b, 0);
    return Math.round((sum / vals.length) * 10) / 10;
  };
  
  const avgStar = calcAvg(fb.criteriaRatings);
  const techName = fb?.technicianId ? technicians?.find?.(t => String(t.id || t.user_id) === String(fb.technicianId))?.name : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all"
    >
      {/* Header stripe */}
      <div className="h-1 bg-gradient-to-r from-amber-400 to-orange-400" />
      <div className="p-5">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Stethoscope className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-bold text-slate-800">
                {fb.doctorName}
                {techName && <span className="text-slate-500 font-normal"> / {techName}</span>}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Calendar className="w-3 h-3" />
              <span>{fb.date}</span>
              <span className="text-slate-300">•</span>
              <span>{fb.service}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <StarDisplay value={Math.round(avgStar)} size="sm" />
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${RATING_COLORS[Math.round(avgStar)] || 'text-slate-500 bg-slate-50 border-slate-200'}`}>
              {RATING_LABELS[Math.round(avgStar)] || 'Chưa đánh giá'}
            </span>
          </div>
        </div>

        <div className="text-sm text-slate-700 leading-relaxed mb-3">
          {fb.isAnonymous && <span className="text-[10px] font-bold text-violet-600 bg-violet-50 border border-violet-200 rounded-full px-2 py-0.5 mr-2 inline-block mb-1">Ẩn danh</span>}
          
          <div className="space-y-2 not-italic text-left mt-2">
            {fb.doctorComment && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Nhận xét Bác sĩ:</span>
                <p className="text-sm text-slate-700 italic">"{fb.doctorComment}" {!fb.isDoctorPublic && <span className="text-[9px] text-slate-400 font-semibold">(Ẩn)</span>}</p>
              </div>
            )}
            {fb.technicianComment && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Nhận xét Kỹ thuật viên:</span>
                <p className="text-sm text-slate-700 italic">"{fb.technicianComment}" {!fb.isTechnicianPublic && <span className="text-[9px] text-slate-400 font-semibold">(Ẩn)</span>}</p>
              </div>
            )}
            {/* Fallback for old feedbacks that might still just use the 'comment' field as string */}
            {!fb.doctorComment && !fb.technicianComment && fb.comment && (
               <p>"{fb.comment}"</p>
            )}
          </div>
        </div>

        {/* Images */}
        {fb.images?.length > 0 && (
          <div className="flex gap-2 mb-3">
            {fb.images?.map?.((img, i) => (
              <img key={i} src={img} alt="" className="w-14 h-14 rounded-xl object-cover border border-slate-200" />
            ))}
          </div>
        )}

        {/* Admin reply */}
        {fb.adminReply && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-3">
            <p className="text-xs font-bold text-emerald-700 flex items-center gap-1 mb-1">
              <Reply className="w-3 h-3" /> Phản hồi từ phòng khám
            </p>
            <p className="text-xs text-emerald-800 leading-relaxed">{fb.adminReply.text}</p>
          </div>
        )}

        {/* Expand criteria */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors border-none bg-transparent cursor-pointer"
        >
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {expanded ? 'Ẩn' : 'Xem'} đánh giá chi tiết theo tiêu chí
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-3"
            >
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 bg-slate-50 border border-slate-100 rounded-xl p-3">
                {CRITERIA_META?.map?.(({ key, label, icon: Icon }) => {
                  const val = fb.criteriaRatings?.[key] || 0;
                  if (!val) return null;
                  return (
                    <div key={key} className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                        <Icon className="w-3 h-3" /> {label}
                      </span>
                      <div className="flex items-center gap-0.5">
                        {[1,2,3,4,5]?.map?.(s => (
                          <Star key={s} className={`w-3 h-3 ${s <= val ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}`} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Pending Review Card (chưa có feedback) ───────────────────────────────────
function PendingReviewCard({ apt, onWrite }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 flex items-center justify-between gap-4"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Stethoscope className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="text-sm font-bold text-slate-800 truncate">{apt.doctorName}</span>
        </div>
        <p className="text-xs text-slate-500">{apt.date} • {apt.service}</p>
        <p className="text-[10px] text-amber-600 font-semibold mt-1.5 flex items-center gap-1">
          <Star className="w-3 h-3" /> Chưa có đánh giá — chia sẻ trải nghiệm của bạn!
        </p>
      </div>
      <button
        onClick={() => onWrite(apt)}
        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-400 to-orange-400 text-white text-xs font-bold rounded-xl shadow-md shadow-amber-400/25 hover:shadow-lg hover:-translate-y-0.5 transition-all border-none cursor-pointer shrink-0"
      >
        <Edit3 className="w-3.5 h-3.5" />
        Viết đánh giá
      </button>
    </motion.div>
  );
}

// ─── Main PatientFeedbackTab ──────────────────────────────────────────────────
export default function PatientFeedbackTab({ user, feedbackAptId, setFeedbackAptId }) {
  const patientId = user?.id || 'pat-01';
  const { feedbacks, getFeedbackByAppointment, getStats } = useFeedbackController({ patientId });
  const { appointments } = useAppointmentController(patientId);
  const { technicians } = useTechnicians();
  const [writeTarget, setWriteTarget] = useState(null);

  const [expandedFeedbackAptId, setExpandedFeedbackAptId] = useState(null);
  const [invoiceRecord, setInvoiceRecord] = useState(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);

  // Scroll & expand effect when redirected from Appointments tab
  useEffect(() => {
    if (feedbackAptId) {
      setExpandedFeedbackAptId(feedbackAptId);

      // Jump to the page that contains the target review so it is rendered
      // before we try to scroll to it.
      const idx = completedApts.findIndex((a) => a.id === feedbackAptId);
      if (idx >= 0) {
        setHistoryPage(Math.floor(idx / PAGE_SIZE) + 1);
      }

      setTimeout(() => {
        const el = document.getElementById(`apt-feedback-${feedbackAptId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        if (typeof setFeedbackAptId === 'function') {
          setFeedbackAptId(null);
        }
      }, 500);
    }
  }, [feedbackAptId, setFeedbackAptId]);

  const handleViewInvoice = async (apt) => {
    setInvoiceLoading(true);
    try {
      const payment = await AppointmentModel.getPaymentByAppointment(apt.id);
      
      let voucherCode = null;
      if (payment && payment.voucher_id) {
        try {
          const { VoucherModel } = await import('../../models/VoucherModel');
          const v = await VoucherModel.getVoucherById(payment.voucher_id);
          voucherCode = v?.code || null;
        } catch (e) {
          console.warn("Failed to fetch voucher for invoice:", e);
        }
      }

      let usedServices = [];
      let servicesTotal = 0;
      try {
        const { data: stData } = await supabase
          .from('service_tickets')
          .select('id, service_name')
          .eq('appointment_id', apt.id);
          
        if (stData && stData.length > 0) {
           const { data: svcData } = await supabase.from('services').select('service_name, price');
           usedServices = stData.map(t => {
               const svc = (svcData || []).find(s => s.service_name === t.service_name);
               const priceStr = svc?.price || 0;
               let priceNum = 0;
               if (typeof priceStr === 'number') priceNum = priceStr;
               else if (typeof priceStr === 'string') priceNum = parseInt(priceStr.replace(/[^0-9]/g, ''), 10) || 0;
               servicesTotal += priceNum;
               return { id: t.id, name: t.service_name, price: priceNum };
           });
        }
      } catch (e) {
        console.warn("Failed to fetch used services:", e);
      }

      const parseFee = (fee, fallback = 0) => {
        if (fee === null || fee === undefined) return fallback;
        if (typeof fee === 'number') return Number.isFinite(fee) ? fee : fallback;
        const digits = String(fee).replace(/[^0-9]/g, '');
        const n = parseInt(digits, 10);
        return Number.isFinite(n) ? n : fallback;
      };

      const baseTotal = parseFee(apt.fee, 0) || 300000;
      const calcTotal = baseTotal + servicesTotal;

      const followUpFee = payment ? Math.max(0, (payment.final_amount + (payment.discount_amount || 0)) - calcTotal) : 0;
      const prior = 0;
      const discount = payment?.discount_amount ?? 0;
      const netPayable = payment ? payment.final_amount : Math.max(0, calcTotal + followUpFee - discount);

      const invoice = {
        aptId: apt.id,
        patientName: apt.patientName || apt.patient_name || 'Bệnh nhân',
        doctorName: apt.doctorName || apt.doctor_name || 'Bác sĩ',
        serviceName: apt.service || apt.service_name || 'Dịch vụ khám',
        paidAt: payment?.paid_at ? new Date(payment.paid_at) : new Date(apt.date + 'T' + (apt.time || '08:00')),
        method: payment?.payment_method || 'Tiền mặt',
        baseTotal,
        usedServices,
        followUpFee,
        total: calcTotal + followUpFee,
        prior,
        discount,
        netPayable,
        voucherCode: voucherCode || payment?.voucher_code || null,
        receptionistId: payment?.receptionist_id || 'staff',
        paymentStatus: payment?.payment_status || 'PAID',
      };
      setInvoiceRecord(invoice);
    } catch (err) {
      console.error('Failed to load invoice for patient:', err);
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { message: 'Không tải được hóa đơn. Vui lòng thử lại.', type: 'error' },
      }));
    } finally {
      setInvoiceLoading(false);
    }
  };

  // Completed appointments that don't have feedback yet — newest visit first,
  // so the paginated list surfaces recent history and hides the older tail.
  const completedApts = (appointments?.filter?.(a => a.status === 'Đã khám' || a.status === 'Reviewed' || a.status === 'Đã thanh toán') || [])
    .sort((a, b) => `${b.date || ''}T${b.time || ''}`.localeCompare(`${a.date || ''}T${a.time || ''}`));
  const pendingApts = completedApts?.filter?.(a => !getFeedbackByAppointment(a.id));
  const myFeedbacks = feedbacks?.filter?.(f => f.patientId === patientId);

  const stats = getStats(myFeedbacks);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-amber-50 rounded-xl text-amber-600 border border-amber-100">
          <Star className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">Đánh giá của tôi</h3>
          <p className="text-xs text-slate-400 mt-0.5">Quản lý tất cả đánh giá bạn đã gửi</p>
        </div>
      </div>
      {/* Summary stats */}
      {completedApts.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3 text-center">
            <p className="text-2xl font-black text-amber-600">{stats.avg > 0 ? stats.avg : '—'}</p>
            <StarDisplay value={Math.round(stats.avg)} size="xs" />
            <p className="text-[10px] text-slate-500 mt-1 font-semibold">Điểm TB</p>
          </div>
          <div className="bg-sky-50 border border-sky-100 rounded-2xl p-3 text-center">
            <p className="text-2xl font-black text-sky-600">{myFeedbacks.length}</p>
            <p className="text-[10px] text-slate-500 mt-1 font-semibold">Đã đánh giá</p>
          </div>
          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-3 text-center">
            <p className="text-2xl font-black text-orange-500">{pendingApts.length}</p>
            <p className="text-[10px] text-slate-500 mt-1 font-semibold">Chờ đánh giá</p>
          </div>
        </div>
      )}
      {/* Lịch sử khám bệnh (Examination History) */}
      <div>
        <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-teal-600" />
          Lịch sử khám bệnh
        </h4>
        
        {completedApts.length === 0 ? (
          <div className="text-center py-12 bg-white border border-dashed border-slate-200 rounded-2xl shadow-sm">
            <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500 font-semibold">Chưa có lịch sử khám bệnh nào.</p>
            <p className="text-xs text-slate-400 mt-1">Sau khi hoàn thành ca khám, lịch sử khám và tuỳ chọn đánh giá sẽ hiển thị tại đây.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {completedApts.slice((historyPage - 1) * PAGE_SIZE, historyPage * PAGE_SIZE).map(apt => {
              const fb = getFeedbackByAppointment(apt.id);
              const isHighlighted = feedbackAptId === apt.id;
              const isExpanded = expandedFeedbackAptId === apt.id;

              const calcAvg = (criteria) => {
                if (!criteria) return fb?.overallRating || 0;
                const vals = Object.values(criteria).filter(v => v > 0);
                if (vals.length === 0) return fb.overallRating;
                const sum = vals.reduce((a, b) => a + b, 0);
                return Math.round((sum / vals.length) * 10) / 10;
              };
              
              const avgStar = fb ? calcAvg(fb.criteriaRatings) : 0;
              const techName = fb?.technicianId ? technicians?.find?.(t => String(t.id || t.user_id) === String(fb.technicianId))?.name : null;

              return (
                <div 
                  key={apt.id} 
                  id={`apt-feedback-${apt.id}`}
                  className={`bg-white border rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-500 ${
                    isHighlighted 
                      ? 'border-amber-400 ring-2 ring-amber-400/20 bg-amber-50/10 scale-[1.01]' 
                      : 'border-slate-200'
                  }`}
                >
                  <div className={`h-1 bg-gradient-to-r ${fb ? 'from-emerald-400 to-teal-500' : 'from-amber-400 to-orange-400'}`} />
                  <div className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Stethoscope className="w-4 h-4 text-emerald-500" />
                          <span className="text-sm font-bold text-slate-800">
                            {apt.doctorName}
                            {techName && <span className="text-slate-500 font-normal"> / {techName}</span>}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <Calendar className="w-3 h-3" />
                          <span>{apt.date}</span>
                          <span className="text-slate-300">•</span>
                          <span>{apt.service}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        {fb ? (
                          <div className="text-right">
                            <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border text-emerald-600 bg-emerald-50 border-emerald-200">
                              Đã đánh giá
                            </span>
                            <div className="mt-1">
                              <StarDisplay value={Math.round(avgStar)} size="xs" />
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border text-amber-600 bg-amber-50 border-amber-200">
                            Chưa đánh giá
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {fb ? (
                      <div className="space-y-3">
                        {fb.isAnonymous && <span className="text-[10px] font-bold text-violet-600 bg-violet-50 border border-violet-200 rounded-full px-2 py-0.5 mb-2 inline-block">Ẩn danh</span>}
                        {(() => {
                          if (fb.doctorComment || fb.technicianComment) {
                            return (
                              <div className="space-y-2 text-left not-italic">
                                {fb.doctorComment && (
                                  <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nhận xét Bác sĩ:</span>
                                    <p className="text-sm text-slate-700 italic mt-0.5">
                                      "{fb.doctorComment}" <span className="text-[9px] text-slate-400 font-semibold">({(fb.isDoctorPublic ?? true) ? 'Công khai' : 'Ẩn'})</span>
                                    </p>
                                  </div>
                                )}
                                {fb.technicianComment && (
                                  <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nhận xét Kỹ thuật viên:</span>
                                    <p className="text-sm text-slate-700 italic mt-0.5">
                                      "{fb.technicianComment}" <span className="text-[9px] text-slate-400 font-semibold">({(fb.isTechnicianPublic ?? true) ? 'Công khai' : 'Ẩn'})</span>
                                    </p>
                                  </div>
                                )}
                              </div>
                            );
                          }
                          return (
                            <p className="text-sm text-slate-700 leading-relaxed italic">
                              {fb.comment ? `"${fb.comment}"` : <span className="text-slate-400">Chưa có nhận xét.</span>}
                            </p>
                          );
                        })()}
                        
                        {fb.images?.length > 0 && (
                          <div className="flex gap-2">
                            {fb.images?.map?.((img, i) => (
                              <img key={i} src={img} alt="" className="w-14 h-14 rounded-xl object-cover border border-slate-200" />
                            ))}
                          </div>
                        )}
                        
                        {fb.adminReply && (
                           <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mt-2">
                             <p className="text-xs font-bold text-emerald-700 flex items-center gap-1 mb-1">
                               <Reply className="w-3 h-3" /> Phản hồi từ phòng khám
                             </p>
                             <p className="text-xs text-emerald-800 leading-relaxed">{fb.adminReply.text}</p>
                           </div>
                         )}

                         {/* Detailed review criteria section */}
                         <AnimatePresence>
                           {isExpanded && (
                             <motion.div
                               initial={{ height: 0, opacity: 0 }}
                               animate={{ height: 'auto', opacity: 1 }}
                               exit={{ height: 0, opacity: 0 }}
                               className="overflow-hidden mt-3"
                             >
                               <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 bg-slate-50 border border-slate-100 rounded-xl p-4">
                                 {CRITERIA_META?.map?.(({ key, label, icon: Icon }) => {
                                   const val = fb.criteriaRatings?.[key] || 0;
                                   if (!val) return null;
                                   return (
                                     <div key={key} className="flex items-center justify-between gap-2 py-1 border-b border-slate-150/40 last:border-0 sm:border-0">
                                       <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                                         <Icon className="w-3.5 h-3.5 text-slate-400" /> {label}
                                       </span>
                                       <div className="flex items-center gap-0.5">
                                         {[1,2,3,4,5]?.map?.(s => (
                                           <Star key={s} className={`w-3.5 h-3.5 ${s <= val ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}`} />
                                         ))}
                                       </div>
                                     </div>
                                   );
                                 })}
                               </div>
                             </motion.div>
                           )}
                         </AnimatePresence>

                         {/* Action buttons for rated appointment */}
                         <div className="flex flex-wrap items-center justify-between gap-3 pt-4 mt-4 border-t border-slate-100">
                           <button
                             onClick={() => setExpandedFeedbackAptId(isExpanded ? null : apt.id)}
                             className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors border-none bg-transparent cursor-pointer"
                           >
                             {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                             {isExpanded ? 'Ẩn chi tiết đánh giá' : 'Xem chi tiết đánh giá'}
                           </button>

                           <button
                             onClick={() => handleViewInvoice(apt)}
                             className="flex items-center gap-1.5 px-4 py-2 border border-sky-200 text-sky-600 hover:bg-sky-50 text-xs font-bold rounded-xl transition-all cursor-pointer bg-white"
                           >
                             <Receipt className="w-3.5 h-3.5" />
                             Hóa đơn
                           </button>
                         </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-100">
                        <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> Hãy chia sẻ trải nghiệm khám bệnh của bạn để giúp phòng khám cải thiện dịch vụ.
                        </p>
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                          <button
                            onClick={() => handleViewInvoice(apt)}
                            className="flex items-center gap-1.5 px-4 py-2.5 border border-sky-200 text-sky-600 hover:bg-sky-50 text-xs font-bold rounded-xl transition-all cursor-pointer bg-white"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            Hóa đơn
                          </button>
                          <button
                            onClick={() => setWriteTarget(apt)}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold rounded-xl shadow-md shadow-amber-400/25 hover:shadow-lg hover:-translate-y-0.5 transition-all border-none cursor-pointer shrink-0"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Viết đánh giá
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Numbered pagination — older visits live on the next pages */}
            <GlassPagination
              total={completedApts.length}
              page={historyPage}
              pageSize={PAGE_SIZE}
              onPageChange={setHistoryPage}
              className="pt-1"
            />
          </div>
        )}
      </div>
         {/* Write feedback modal */}
         <AnimatePresence>
           {writeTarget && (
             <FeedbackFormModal
               apt={writeTarget}
               onClose={() => setWriteTarget(null)}
               onSubmitted={() => setWriteTarget(null)}
             />
           )}
         </AnimatePresence>

         {/* Invoice Detail Modal */}
         <AnimatePresence>
           {invoiceRecord && (
             <InvoiceDetailModal
               invoice={invoiceRecord}
               onClose={() => setInvoiceRecord(null)}
             />
           )}
         </AnimatePresence>

         {/* Lightweight loading veil while the invoice is being fetched */}
         {invoiceLoading && createPortal(
           <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-slate-900/30 backdrop-blur-sm">
             <div className="flex items-center gap-3 bg-white/90 px-5 py-3 rounded-2xl shadow-xl border border-white">
               <RefreshCw className="w-4 h-4 text-teal-600 animate-spin" />
               <span className="text-sm font-semibold text-slate-700">Đang tải hóa đơn...</span>
             </div>
           </div>,
           document.body
         )}
       </div>
     );
   }
