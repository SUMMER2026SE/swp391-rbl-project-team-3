import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  User,
  Calendar,
  Clock,
  Stethoscope,
  Brain,
  ClipboardList,
  Pill,
  Activity,
  Image,
  RefreshCw,
  FileText,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  MessageSquare,
  Wrench,
  Shield,
} from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calculateAge(dob) {
  if (!dob) return '—';
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

const SEVERITY_COLORS = {
  'Rất thấp': 'text-rose-700 bg-rose-50 border-rose-200',
  'Thấp': 'text-rose-600 bg-rose-50 border-rose-200',
  'Trung bình': 'text-amber-700 bg-amber-50 border-amber-200',
  'Bình thường': 'text-emerald-700 bg-emerald-50 border-emerald-200',
  'Cao': 'text-orange-700 bg-orange-50 border-orange-200',
  'Rất cao': 'text-red-700 bg-red-50 border-red-200',
};

const SCORE_BAR_COLORS = {
  rose: 'bg-rose-400',
  amber: 'bg-amber-400',
  yellow: 'bg-yellow-400',
  sky: 'bg-sky-400',
  emerald: 'bg-emerald-400',
};

const PAYMENT_BADGE = {
  'Đã thanh toán': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Chưa thanh toán': 'bg-amber-50 text-amber-700 border-amber-200',
  'Chờ xác nhận': 'bg-sky-50 text-sky-700 border-sky-200',
};

const FOLLOWUP_BADGE = {
  'Hoàn thành': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Sắp tới': 'bg-sky-50 text-sky-700 border-sky-200',
  'Đã hủy': 'bg-rose-50 text-rose-700 border-rose-200',
};

// ─── Section Wrapper ──────────────────────────────────────────────────────────

function Section({ icon, title, children, accent = 'emerald' }) {
  const accentMap = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    sky: 'bg-sky-50 text-sky-600 border-sky-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    violet: 'bg-violet-50 text-violet-600 border-violet-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    teal: 'bg-teal-50 text-teal-600 border-teal-100',
  };
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2.5 mb-3">
        <div className={`p-2 rounded-xl border ${accentMap[accent]}`}>
          {icon}
        </div>
        <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">{title}</h4>
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 py-2.5 border-b border-slate-100 last:border-0">
      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider w-40 shrink-0">{label}</span>
      <span className="text-sm font-semibold text-slate-700 flex-1">{value || '—'}</span>
    </div>
  );
}

// ─── Tab Navigation ───────────────────────────────────────────────────────────

const TABS = [
  { id: 'overview', label: 'Tổng quan', icon: <FileText className="w-3.5 h-3.5" /> },
  { id: 'ai', label: 'AI Analysis', icon: <Brain className="w-3.5 h-3.5" /> },
  { id: 'treatment', label: 'Điều trị', icon: <Activity className="w-3.5 h-3.5" /> },
  { id: 'prescription', label: 'Đơn thuốc', icon: <Pill className="w-3.5 h-3.5" /> },
  { id: 'images', label: 'Hình ảnh', icon: <Image className="w-3.5 h-3.5" /> },
  { id: 'followup', label: 'Tái khám', icon: <RefreshCw className="w-3.5 h-3.5" /> },
];

// ─── Tab: Tổng quan ───────────────────────────────────────────────────────────

function OverviewTab({ record }) {
  const patient = record.patient || {};
  const age = calculateAge(patient.dob);

  return (
    <div className="space-y-5">
      {/* Thông tin bệnh nhân */}
      <Section icon={<User className="w-4 h-4" />} title="Thông tin bệnh nhân" accent="sky">
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <div className="flex items-center gap-4 mb-4">
            <img
              src={patient.avatar || `https://i.pravatar.cc/80?u=${patient.id}`}
              alt={patient.fullName}
              className="w-14 h-14 rounded-xl object-cover border border-slate-200 shadow-sm"
            />
            <div>
              <p className="text-base font-bold text-slate-800">{patient.fullName}</p>
              <p className="text-xs text-slate-500 mt-0.5">{age} tuổi • {patient.gender}</p>
            </div>
          </div>
          <div className="space-y-0 divide-y divide-slate-100">
            <InfoRow label="Ngày sinh" value={patient.dob ? new Date(patient.dob).toLocaleDateString('vi-VN') : '—'} />
            <InfoRow label="Giới tính" value={patient.gender} />
            <InfoRow label="Điện thoại" value={patient.phone} />
            <InfoRow label="Email" value={patient.email} />
            <InfoRow label="Địa chỉ" value={patient.address} />
          </div>
        </div>
      </Section>

      {/* Thông tin khám bệnh */}
      <Section icon={<Stethoscope className="w-4 h-4" />} title="Thông tin khám bệnh" accent="emerald">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-0 divide-y divide-slate-100">
          <InfoRow label="Ngày khám" value={record.date} />
          <InfoRow label="Giờ khám" value={record.time} />
          <InfoRow label="Bác sĩ phụ trách" value={record.doctor} />
          <InfoRow label="Chuyên khoa" value={record.specialty} />
          <InfoRow label="Dịch vụ" value={record.service} />
          <InfoRow label="Phí dịch vụ" value={record.fee} />
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 py-2.5">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider w-40 shrink-0">Thanh toán</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${PAYMENT_BADGE[record.paymentStatus] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
              {record.paymentStatus}
            </span>
          </div>
        </div>
      </Section>

      {/* Triệu chứng */}
      <Section icon={<AlertCircle className="w-4 h-4" />} title="Triệu chứng lâm sàng" accent="amber">
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <p className="text-sm text-slate-700 leading-relaxed">{record.symptoms || '—'}</p>
        </div>
      </Section>

      {/* Sinh hiệu */}
      {record.vitalSigns && (
        <Section icon={<Activity className="w-4 h-4" />} title="Sinh hiệu" accent="rose">
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: 'Cân nặng', value: record.vitalSigns.weight },
                { label: 'Chiều cao', value: record.vitalSigns.height },
                { label: 'Huyết áp', value: record.vitalSigns.bloodPressure },
                { label: 'Nhịp tim', value: record.vitalSigns.pulse },
                { label: 'Nhiệt độ', value: record.vitalSigns.temperature },
                { label: 'SpO2', value: record.vitalSigns.spo2 },
              ].map((v) => (
                <div key={v.label} className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{v.label}</p>
                  <p className="text-sm font-bold text-slate-800 mt-1">{v.value || '—'}</p>
                </div>
              ))}
            </div>
          </div>
        </Section>
      )}

      {/* Chẩn đoán */}
      <Section icon={<ClipboardList className="w-4 h-4" />} title="Chẩn đoán" accent="violet">
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-800">{record.diagnosis}</p>
              {record.diagnosisCode && record.diagnosisCode !== '—' && (
                <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-violet-50 text-violet-700 border border-violet-200 text-[10px] font-bold">
                  ICD-10: {record.diagnosisCode}
                </span>
              )}
            </div>
          </div>
          {record.diagnosisDetail && (
            <p className="text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
              {record.diagnosisDetail}
            </p>
          )}
        </div>
      </Section>

      {/* Ghi chú */}
      {(record.notes || record.technicianNotes) && (
        <Section icon={<MessageSquare className="w-4 h-4" />} title="Ghi chú" accent="teal">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
            {record.notes && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Bác sĩ
                </p>
                <p className="text-sm text-slate-700 leading-relaxed">{record.notes}</p>
              </div>
            )}
            {record.technicianNotes && (
              <div className={record.notes ? 'border-t border-slate-100 pt-3' : ''}>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Wrench className="w-3 h-3" /> Kỹ thuật viên
                </p>
                <p className="text-sm text-slate-700 leading-relaxed">{record.technicianNotes}</p>
              </div>
            )}
          </div>
        </Section>
      )}
    </div>
  );
}

// ─── Tab: AI Skin Analysis ────────────────────────────────────────────────────

function AIAnalysisTab({ record }) {
  const ai = record.aiAnalysis;
  if (!ai) {
    return (
      <div className="text-center py-16">
        <Brain className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-sm text-slate-500 font-semibold">Không có dữ liệu AI Skin Analysis cho hồ sơ này.</p>
      </div>
    );
  }

  const scoreColor =
    ai.overallScore >= 80 ? 'text-emerald-600' :
    ai.overallScore >= 60 ? 'text-amber-600' : 'text-rose-600';

  const scoreRingColor =
    ai.overallScore >= 80 ? 'stroke-emerald-500' :
    ai.overallScore >= 60 ? 'stroke-amber-500' : 'stroke-rose-500';

  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (ai.overallScore / 100) * circumference;

  return (
    <div className="space-y-5">
      {/* Overall Score */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-6">
        <div className="relative w-28 h-28 shrink-0">
          <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="10" />
            <circle
              cx="50" cy="50" r="40" fill="none"
              className={scoreRingColor}
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-2xl font-bold ${scoreColor}`}>{ai.overallScore}</span>
            <span className="text-[10px] text-slate-400 font-semibold">/ 100</span>
          </div>
        </div>
        <div className="text-center sm:text-left">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Điểm sức khỏe da tổng thể</p>
          <p className="text-xl font-bold text-slate-800">{ai.skinType}</p>
          <p className="text-xs text-slate-500 mt-1">Ngày phân tích: {ai.analysisDate} • {ai.analyzedBy}</p>
        </div>
      </div>

      {/* Metrics */}
      <Section icon={<Brain className="w-4 h-4" />} title="Chỉ số da chi tiết" accent="violet">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4">
          {ai.metrics.map((m) => (
            <div key={m.label}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-700">{m.label}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${SEVERITY_COLORS[m.severity] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                    {m.severity}
                  </span>
                </div>
                <span className="text-sm font-bold text-slate-800">{m.score}/{m.maxScore}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(m.score / m.maxScore) * 100}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={`h-full rounded-full ${SCORE_BAR_COLORS[m.color] || 'bg-slate-400'}`}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{m.description}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Recommendation */}
      {ai.recommendation && (
        <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4">
          <p className="text-xs font-bold text-violet-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Brain className="w-3.5 h-3.5" /> Khuyến nghị từ AI
          </p>
          <p className="text-sm text-violet-800 leading-relaxed">{ai.recommendation}</p>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Kế hoạch điều trị ───────────────────────────────────────────────────

function TreatmentTab({ record }) {
  const plan = record.treatmentPlan;
  const history = record.treatmentHistory || [];

  return (
    <div className="space-y-5">
      {/* Kế hoạch điều trị */}
      {plan && (
        <Section icon={<Activity className="w-4 h-4" />} title="Kế hoạch điều trị" accent="emerald">
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <div className="flex items-start justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <p className="text-sm font-bold text-slate-800">{plan.title}</p>
                <p className="text-xs text-slate-500 mt-1">Thời gian: {plan.duration}</p>
              </div>
              <div className="text-center shrink-0">
                <p className="text-2xl font-bold text-emerald-600">{plan.sessions}</p>
                <p className="text-[10px] text-slate-400">/ {plan.totalSessions} buổi</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                <span>Tiến độ liệu trình</span>
                <span className="font-bold text-emerald-600">{Math.round((plan.sessions / plan.totalSessions) * 100)}%</span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(plan.sessions / plan.totalSessions) * 100}%` }}
                  transition={{ duration: 0.9, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full"
                />
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-2.5 mb-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Các bước thực hiện</p>
              {plan.steps.map((s) => (
                <div key={s.step} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {s.step}
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{s.description}</p>
                </div>
              ))}
            </div>

            {/* Restrictions */}
            {plan.restrictions && plan.restrictions.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> Lưu ý & Hạn chế
                </p>
                <ul className="space-y-1">
                  {plan.restrictions.map((r, i) => (
                    <li key={i} className="text-xs text-amber-800 flex items-start gap-1.5">
                      <span className="text-amber-500 mt-0.5 shrink-0">•</span> {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Doctor notes */}
            {plan.doctorNotes && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" /> Ghi chú bác sĩ
                </p>
                <p className="text-sm text-slate-700 leading-relaxed">{plan.doctorNotes}</p>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Lịch sử thủ thuật */}
      {history.length > 0 && (
        <Section icon={<Wrench className="w-4 h-4" />} title="Thủ thuật đã thực hiện" accent="sky">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
            {history.map((h, i) => (
              <div key={h.id} className={`flex gap-3 ${i < history.length - 1 ? 'pb-3 border-b border-slate-100' : ''}`}>
                <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                  <Wrench className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-slate-800">{h.procedure}</p>
                    <span className="text-[10px] text-slate-400 shrink-0 font-medium">{h.duration}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{h.performedBy} • {h.role}</p>
                  <div className="mt-1.5 bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5">
                    <p className="text-xs text-slate-600 leading-relaxed">
                      <span className="font-semibold text-slate-700">Kết quả: </span>{h.result}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

// ─── Tab: Đơn thuốc ───────────────────────────────────────────────────────────

function PrescriptionTab({ record }) {
  const prescriptions = record.prescriptions || [];

  if (prescriptions.length === 0) {
    return (
      <div className="text-center py-16">
        <Pill className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-sm text-slate-500 font-semibold">Không có đơn thuốc cho hồ sơ này.</p>
      </div>
    );
  }

  const TYPE_COLORS = {
    'Thuốc bôi': 'bg-teal-50 text-teal-700 border-teal-200',
    'Thuốc uống': 'bg-sky-50 text-sky-700 border-sky-200',
    'Kem dưỡng ẩm': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Serum dưỡng da': 'bg-violet-50 text-violet-700 border-violet-200',
    'Kem bảo vệ': 'bg-amber-50 text-amber-700 border-amber-200',
    'Chống nắng': 'bg-orange-50 text-orange-700 border-orange-200',
  };

  return (
    <div className="space-y-4">
      {prescriptions.map((p, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3 pb-3 border-b border-slate-100">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                <Pill className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">{p.name}</p>
                <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${TYPE_COLORS[p.type] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                  {p.type}
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-bold text-slate-800">{p.duration}</p>
              <p className="text-[10px] text-slate-400">Thời gian dùng</p>
            </div>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-slate-50 rounded-xl p-2.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Liều lượng</p>
              <p className="text-xs font-semibold text-slate-700 mt-0.5">{p.dosage}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-2.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tần suất</p>
              <p className="text-xs font-semibold text-slate-700 mt-0.5">{p.frequency}</p>
            </div>
            {p.quantity && (
              <div className="bg-slate-50 rounded-xl p-2.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Số lượng</p>
                <p className="text-xs font-semibold text-slate-700 mt-0.5">{p.quantity}</p>
              </div>
            )}
          </div>

          {/* Instructions */}
          {p.instructions && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 mb-2">
              <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-1">Cách dùng</p>
              <p className="text-xs text-emerald-900 leading-relaxed">{p.instructions}</p>
            </div>
          )}

          {/* Side effects */}
          {p.sideEffects && p.sideEffects !== 'Không ghi nhận.' && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
              <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Tác dụng phụ
              </p>
              <p className="text-xs text-amber-900 leading-relaxed">{p.sideEffects}</p>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

// ─── Tab: Hình ảnh trước – sau ────────────────────────────────────────────────

function ImagesTab({ record }) {
  const images = record.beforeAfterImages || [];
  const [activeImg, setActiveImg] = useState(null);
  const [viewMode, setViewMode] = useState({});  // { [id]: 'before' | 'after' }

  if (images.length === 0) {
    return (
      <div className="text-center py-16">
        <Image className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-sm text-slate-500 font-semibold">Chưa có hình ảnh trước – sau cho hồ sơ này.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-xs text-slate-500 bg-sky-50 border border-sky-100 rounded-xl px-4 py-2.5 flex items-center gap-2">
        <Image className="w-3.5 h-3.5 text-sky-500 shrink-0" />
        Click vào "Trước" / "Sau" để chuyển đổi ảnh từng vùng điều trị.
      </p>

      {images.map((img) => {
        const mode = viewMode[img.id] || 'before';
        return (
          <div key={img.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            {/* Label */}
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <p className="text-sm font-bold text-slate-800">{img.label}</p>
              {/* Toggle */}
              <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode(prev => ({ ...prev, [img.id]: 'before' }))}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border-none cursor-pointer ${mode === 'before' ? 'bg-white text-rose-600 shadow-sm' : 'bg-transparent text-slate-500'}`}
                >
                  Trước
                </button>
                <button
                  onClick={() => setViewMode(prev => ({ ...prev, [img.id]: 'after' }))}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border-none cursor-pointer ${mode === 'after' ? 'bg-white text-emerald-600 shadow-sm' : 'bg-transparent text-slate-500'}`}
                >
                  Sau
                </button>
              </div>
            </div>

            {/* Image */}
            <div className="relative">
              <AnimatePresence mode="wait">
                <motion.img
                  key={mode}
                  src={mode === 'before' ? img.beforeUrl : img.afterUrl}
                  alt={`${img.label} — ${mode === 'before' ? 'trước' : 'sau'} điều trị`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-52 object-cover cursor-pointer"
                  onClick={() => setActiveImg({ img, mode })}
                  onError={(e) => {
                    e.target.src = `https://placehold.co/400x300/e2e8f0/94a3b8?text=${mode === 'before' ? 'Trước+điều+trị' : 'Sau+điều+trị'}`;
                  }}
                />
              </AnimatePresence>
              <div className={`absolute top-2 left-2 px-2 py-1 rounded-lg text-[10px] font-bold ${mode === 'before' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'}`}>
                {mode === 'before' ? `📷 Trước — ${img.beforeDate}` : `✅ Sau — ${img.afterDate}`}
              </div>
            </div>

            {/* Note */}
            {img.note && (
              <div className="px-4 py-3 bg-slate-50 border-t border-slate-100">
                <p className="text-xs text-slate-600 leading-relaxed">{img.note}</p>
              </div>
            )}
          </div>
        );
      })}

      {/* Split compare view */}
      <div className="text-center">
        <p className="text-xs text-slate-400 italic">* Hình ảnh minh họa từ hồ sơ điều trị của phòng khám.</p>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {activeImg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] bg-black/80 flex items-center justify-center p-4"
            onClick={() => setActiveImg(null)}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="relative max-w-2xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setActiveImg(null)}
                className="absolute -top-10 right-0 text-white/70 hover:text-white bg-transparent border-none cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
              <img
                src={activeImg.mode === 'before' ? activeImg.img.beforeUrl : activeImg.img.afterUrl}
                alt="Phóng to"
                className="w-full rounded-2xl object-cover"
                onError={(e) => {
                  e.target.src = `https://placehold.co/600x400/1e293b/94a3b8?text=Không+tải+được+ảnh`;
                }}
              />
              <p className="text-center text-white/70 text-sm mt-3">{activeImg.img.label} — {activeImg.mode === 'before' ? 'Trước điều trị' : 'Sau điều trị'}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Tab: Lịch sử tái khám ────────────────────────────────────────────────────

function FollowUpTab({ record }) {
  const followUps = record.followUps || [];

  if (followUps.length === 0) {
    return (
      <div className="text-center py-16">
        <RefreshCw className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-sm text-slate-500 font-semibold">Chưa có lịch tái khám nào.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-5 top-6 bottom-6 w-0.5 bg-slate-200" />

        {followUps.map((fu, i) => (
          <motion.div
            key={fu.id}
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="relative flex gap-4 mb-4 last:mb-0"
          >
            {/* Node */}
            <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 z-10 ${fu.status === 'Hoàn thành' ? 'bg-emerald-50 border-emerald-400' : fu.status === 'Sắp tới' ? 'bg-sky-50 border-sky-400' : 'bg-rose-50 border-rose-400'}`}>
              {fu.status === 'Hoàn thành' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : fu.status === 'Sắp tới' ? (
                <Clock className="w-4 h-4 text-sky-600" />
              ) : (
                <X className="w-4 h-4 text-rose-600" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="text-sm font-bold text-slate-800">{fu.type}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    <Calendar className="w-3 h-3 inline mr-1" />{fu.date} • {fu.doctor}
                  </p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${FOLLOWUP_BADGE[fu.status] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                  {fu.status}
                </span>
              </div>

              {/* Progress bar */}
              {fu.progressLevel > 0 && (
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500 font-medium">{fu.progress}</span>
                    <span className="font-bold text-emerald-600">{fu.progressLevel}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${fu.progressLevel}%` }}
                      transition={{ duration: 0.8, delay: i * 0.1 + 0.2 }}
                      className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full"
                    />
                  </div>
                </div>
              )}

              {fu.notes && (
                <p className="text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 leading-relaxed">
                  {fu.notes}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Modal Component ─────────────────────────────────────────────────────

export default function MedicalRecordDetailModal({ record, onClose }) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!record) return null;

  const tabContent = {
    overview: <OverviewTab record={record} />,
    ai: <AIAnalysisTab record={record} />,
    treatment: <TreatmentTab record={record} />,
    prescription: <PrescriptionTab record={record} />,
    images: <ImagesTab record={record} />,
    followup: <FollowUpTab record={record} />,
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 font-sans"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 26, stiffness: 200 }}
          className="w-full max-w-2xl bg-white/95 backdrop-blur-xl border border-white shadow-2xl rounded-[2rem] flex flex-col max-h-[92vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Header ── */}
          <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-slate-100 shrink-0">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
                <FileText className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 leading-tight">Hồ sơ bệnh án chi tiết</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {record.date} • {record.doctor} • {record.service}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all border-none bg-transparent cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ── Tab Bar ── */}
          <div className="flex gap-1 px-4 pt-3 pb-1 overflow-x-auto shrink-0 border-b border-slate-100">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border-none cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20'
                    : 'bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Tab Content ── */}
          <div className="flex-1 overflow-y-auto px-5 py-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.18 }}
              >
                {tabContent[activeTab]}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* ── Footer ── */}
          <div className="px-5 py-4 border-t border-slate-100 shrink-0">
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-sm shadow-md shadow-emerald-500/20 hover:shadow-lg hover:-translate-y-0.5 transition-all border-none cursor-pointer"
            >
              Đóng hồ sơ
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
