import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import PaymentModal from '../components/PaymentModal';
import { useAppointmentController } from '../controllers/useAppointmentController';
import {
  User,
  Settings,
  FileText,
  Edit3,
  Save,
  X,
  ArrowLeft,
  Mail,
  Phone,
  Shield,
  Camera,
  Lock,
  Bell,
  Eye,
  EyeOff,
  Calendar,
  Stethoscope,
  Pill,
  ClipboardList,
  ChevronRight,
  CheckCircle2,
  MapPin,
  CalendarCheck,
  Brain,
  Activity,
  Image,
  RefreshCw,
  Star,
} from 'lucide-react';
import AppointmentsTab from '../components/PatientPortal/AppointmentsTab';
import MedicalRecordDetailModal from '../components/PatientPortal/MedicalRecordDetailModal';
import { useMedicalRecordController } from '../controllers/useMedicalRecordController';
import PatientFeedbackTab from '../components/PatientPortal/PatientFeedbackTab';
import { NotificationModel } from '../models/NotificationModel';

import doctorBg from '../assets/doctor.png';
import patientBg from '../assets/patient.png';
import techBg from '../assets/tech.png';
import adminBg from '../assets/admin.png';
import receptionBg from '../assets/reception.png';


// ─── Constants ───────────────────────────────────────────────────────────────

const ROLE_DISPLAY_NAMES = {
  ADMIN: 'Quản trị viên',
  DOCTOR: 'Bác sĩ',
  RECEPTIONIST: 'Lễ tân',
  TECHNICIAN: 'Kỹ thuật viên',
  PATIENT: 'Bệnh nhân',
};

const ROLE_COLORS = {
  ADMIN: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
  DOCTOR: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
  RECEPTIONIST: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
  TECHNICIAN: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
  PATIENT: { bg: 'bg-sky-100', text: 'text-sky-700', border: 'border-sky-200' },
};

// ─── Animation Variants ──────────────────────────────────────────────────────

const tabContentVariants = {
  hidden: { opacity: 0, x: 20, scale: 0.98 },
  visible: { opacity: 1, x: 0, scale: 1, transition: { type: 'spring', damping: 30, stiffness: 200 } },
  exit: { opacity: 0, x: -20, scale: 0.98, transition: { duration: 0.15 } },
};

const pageEnterVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', damping: 25, stiffness: 100 } },
};

// ─── Tab 1: Personal Info ────────────────────────────────────────────────────

function PersonalInfoTab({ user }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || `${(user?.name || 'user').toLowerCase().replace(/\s+/g, '.')}@dermasmart.vn`,
    phone: user?.phone || '0912 345 678',
    gender: user?.gender || 'Nam',
    dob: user?.dob ? new Date(user.dob).toLocaleDateString('vi-VN') : '—',
    address: user?.address || '123 Đường Ba Tháng Hai, Quận 10, TP. Hồ Chí Minh',
  });
  const [savedData, setSavedData] = useState({ ...formData });
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  const role = user?.role || 'PATIENT';
  const roleColor = ROLE_COLORS[role] || ROLE_COLORS.PATIENT;

  const handleSave = () => {
    setSavedData({ ...formData });
    setIsEditing(false);
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 2500);
  };

  const handleCancel = () => {
    setFormData({ ...savedData });
    setIsEditing(false);
  };

  return (
    <div className="space-y-8">
      {/* Success Toast */}
      <AnimatePresence>
        {showSaveSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl p-3.5 text-sm font-semibold flex items-center gap-2 shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span className="font-bold">Thành công:</span> Thông tin cá nhân đã được cập nhật!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Avatar & Identity Card */}
      <div className="bg-slate-50/90 border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-center gap-6">
        <div className="relative group">
          <div className="w-28 h-28 rounded-[1.5rem] bg-gradient-to-br from-teal-400 to-sky-500 flex items-center justify-center text-white text-4xl font-bold shadow-lg shadow-teal-500/20">
            {user?.avatar ? (
              <img src={user.avatar} alt="Avatar" className="w-full h-full rounded-[1.5rem] object-cover" />
            ) : (
              (user?.name || 'U').charAt(0).toUpperCase()
            )}
          </div>
          {isEditing && (
            <button className="absolute bottom-1 right-1 p-2 bg-white rounded-full shadow-md border border-slate-200 text-slate-500 hover:text-teal-600 hover:border-teal-300 transition-all cursor-pointer">
              <Camera className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="text-center sm:text-left">
          <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{formData.name}</h3>
          <span className={`inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs font-bold border ${roleColor.bg} ${roleColor.text} ${roleColor.border}`}>
            <Shield className="w-3 h-3" />
            {ROLE_DISPLAY_NAMES[role]}
          </span>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="ml-auto px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Edit3 className="w-4 h-4" />
            Chỉnh sửa hồ sơ
          </button>
        )}
      </div>

      {/* Info Fields Card */}
      <div className="bg-slate-50/90 border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
        <InfoField
          icon={<User className="w-4 h-4" />}
          label="Họ và tên"
          value={formData.name}
          isEditing={isEditing}
          onChange={(val) => setFormData(prev => ({ ...prev, name: val }))}
        />
        <InfoField
          icon={<Mail className="w-4 h-4" />}
          label="Email"
          value={formData.email}
          isEditing={isEditing}
          onChange={(val) => setFormData(prev => ({ ...prev, email: val }))}
          type="email"
        />
        <InfoField
          icon={<Phone className="w-4 h-4" />}
          label="Số điện thoại"
          value={formData.phone}
          isEditing={isEditing}
          onChange={(val) => setFormData(prev => ({ ...prev, phone: val }))}
          type="tel"
        />
        <InfoField
          icon={<User className="w-4 h-4" />}
          label="Giới tính"
          value={formData.gender}
          isEditing={isEditing}
          onChange={(val) => setFormData(prev => ({ ...prev, gender: val }))}
        />
        <InfoField
          icon={<Calendar className="w-4 h-4" />}
          label="Ngày sinh"
          value={formData.dob}
          isEditing={false}
          readOnly
        />
        <InfoField
          icon={<MapPin className="w-4 h-4" />}
          label="Địa chỉ"
          value={formData.address}
          isEditing={isEditing}
          onChange={(val) => setFormData(prev => ({ ...prev, address: val }))}
        />
        <InfoField
          icon={<Shield className="w-4 h-4" />}
          label="Vai trò"
          value={ROLE_DISPLAY_NAMES[role]}
          isEditing={false}
          readOnly
        />
      </div>

      {/* Edit Mode Actions */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex gap-3 pt-2"
          >
            <button
              onClick={handleSave}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-sky-500 text-white font-semibold text-sm shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 border-none cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Lưu thay đổi
            </button>
            <button
              onClick={handleCancel}
              className="px-6 py-3 rounded-xl bg-white border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <X className="w-4 h-4" />
              Hủy bỏ
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Reusable Field Component ────────────────────────────────────────────────

function InfoField({ icon, label, value, isEditing, onChange, type = 'text', readOnly = false }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0">
      <div className="flex items-center gap-3 w-full sm:w-48 shrink-0">
        <span className="text-slate-400">{icon}</span>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</span>
      </div>
      {isEditing && !readOnly ? (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-white border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 text-slate-900 rounded-xl px-4 py-3 shadow-inner text-sm transition-all outline-none"
        />
      ) : (
        <span className="flex-1 text-lg font-semibold text-slate-800 py-2.5 px-4 rounded-xl bg-white/60 border border-slate-100 shadow-sm">
          {value}
        </span>
      )}
    </div>
  );
}

// ─── Tab 2: Account Settings ─────────────────────────────────────────────────

function AccountSettingsTab() {
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  return (
    <div className="space-y-8">
      {/* Change Password Section */}
      <div className="bg-slate-50/90 border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-5">
          <Lock className="w-5 h-5 text-slate-400" />
          Đổi mật khẩu
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Mật khẩu hiện tại</label>
            <div className="relative">
              <input
                type={showCurrentPw ? 'text' : 'password'}
                placeholder="Nhập mật khẩu hiện tại"
                className="w-full bg-white border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 text-slate-900 rounded-xl px-4 py-3 shadow-inner outline-none transition-all text-sm"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPw(!showCurrentPw)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors bg-transparent border-none cursor-pointer p-0"
              >
                {showCurrentPw ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Mật khẩu mới</label>
            <div className="relative">
              <input
                type={showNewPw ? 'text' : 'password'}
                placeholder="Tối thiểu 8 ký tự"
                className="w-full bg-white border-2 border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 text-slate-900 rounded-xl px-4 py-3 shadow-inner outline-none transition-all text-sm"
              />
              <button
                type="button"
                onClick={() => setShowNewPw(!showNewPw)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors bg-transparent border-none cursor-pointer p-0"
              >
                {showNewPw ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <button className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-sky-500 text-white font-semibold text-sm shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-0.5 transition-all mt-2 border-none cursor-pointer">
            Lưu thay đổi
          </button>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-slate-50/90 border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-5">
          <Bell className="w-5 h-5 text-slate-400" />
          Thông báo
        </h3>
        <div className="space-y-4">
          <SettingsToggle label="Thông báo qua email" description="Nhận email khi có lịch hẹn mới hoặc thay đổi" defaultOn />
          <SettingsToggle label="Thông báo qua SMS" description="Nhận tin nhắn nhắc nhở trước lịch hẹn" />
          <SettingsToggle label="Thông báo trong ứng dụng" description="Hiện popup thông báo trong giao diện" defaultOn />
        </div>
      </div>
    </div>
  );
}

// ─── Toggle Switch Component ─────────────────────────────────────────────────

function SettingsToggle({ label, description, defaultOn = false }) {
  const [enabled, setEnabled] = useState(defaultOn);

  return (
    <div className="flex items-center justify-between py-3.5 px-4 rounded-xl bg-white border border-slate-200/60 hover:border-slate-300 transition-all shadow-sm">
      <div>
        <p className="text-sm font-semibold text-slate-700">{label}</p>
        <p className="text-xs text-slate-400 mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => setEnabled(!enabled)}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 border-none cursor-pointer ${enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${enabled ? 'translate-x-5' : 'translate-x-0'}`}
        />
      </button>
    </div>
  );
}

// ─── Tab 3: Medical Records (Patient Only) ───────────────────────────────────

function MedicalRecordsTab({ user }) {
  const patientId = user?.id || 'pat-01';
  const { getRecords, getRecordById } = useMedicalRecordController(patientId);
  const records = getRecords();
  const [selectedRecord, setSelectedRecord] = useState(null);

  const handleOpenRecord = (record) => {
    const full = getRecordById(record.id);
    setSelectedRecord(full || record);
  };

  // Map specialty → accent color
  const SPECIALTY_ACCENT = {
    'Da liễu lâm sàng': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
    'Phân tích da liễu AI': { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', dot: 'bg-violet-500' },
    'Laser & Thẩm mỹ da': { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', dot: 'bg-sky-500' },
    'Phân tích AI': { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', dot: 'bg-violet-500' },
    'Da liễu': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100">
          <ClipboardList className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">Lịch sử khám & Bệnh án điện tử</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {records.length > 0 ? `${records.length} hồ sơ bệnh án` : 'Tổng hợp toàn bộ hồ sơ y tế của bạn'}
          </p>
        </div>
      </div>
      {/* Stats row */}
      {records.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Tổng hồ sơ', value: records.length, icon: <FileText className="w-4 h-4" />, color: 'emerald' },
            { label: 'Tái khám', value: records.reduce((acc, r) => acc + (r.followUps?.filter(f => f.status === 'Hoàn thành').length || 0), 0), icon: <RefreshCw className="w-4 h-4" />, color: 'sky' },
            { label: 'Đơn thuốc', value: records.reduce((acc, r) => acc + (r.prescriptions?.length || 0), 0), icon: <Pill className="w-4 h-4" />, color: 'violet' },
          ]?.map?.((s) => (
            <div key={s.label} className={`bg-${s.color}-50 border border-${s.color}-100 rounded-2xl p-3 text-center`}>
              <div className={`text-${s.color}-500 flex justify-center mb-1`}>{s.icon}</div>
              <p className={`text-xl font-bold text-${s.color}-700`}>{s.value}</p>
              <p className="text-[10px] font-semibold text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}
      {/* Record List */}
      <div className="bg-slate-50/90 border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        {records.length > 0 ? (
          (Array.isArray(records) ? records : []).map((record, idx) => {
            const accent = SPECIALTY_ACCENT[record.specialty] || SPECIALTY_ACCENT['Da liễu'];
            const prescriptionCount = record.prescriptions?.length || 0;
            const followUpCount = record.followUps?.length || 0;
            const hasAI = !!record.aiAnalysis;
            const hasImages = (record.beforeAfterImages?.length || 0) > 0;

            return (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                onClick={() => handleOpenRecord(record)}
                className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 hover:shadow-md hover:border-emerald-300 transition-all group cursor-pointer"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 space-y-2.5">
                    {/* Date & Status */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {record.date}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${accent.bg} ${accent.text} ${accent.border}`}>
                        <span className={`inline-block w-1.5 h-1.5 rounded-full ${accent.dot} mr-1`} />
                        {record.specialty}
                      </span>
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                        Hoàn thành
                      </span>
                    </div>

                    {/* Doctor */}
                    <div className="flex items-center gap-2">
                      <Stethoscope className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="text-sm font-bold text-slate-800">{record.doctor}</span>
                      <span className="text-xs text-slate-400">• {record.service}</span>
                    </div>

                    {/* Diagnosis */}
                    <div className="flex items-start gap-2 pl-6">
                      <ClipboardList className="w-3.5 h-3.5 text-violet-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-600 leading-snug">
                        <span className="font-semibold text-slate-700">Chẩn đoán: </span>
                        {record.diagnosis}
                      </p>
                    </div>

                    {/* Prescriptions summary */}
                    {prescriptionCount > 0 && (
                      <div className="pl-6 flex items-center gap-2">
                        <Pill className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                        <p className="text-xs text-slate-500">
                          {(Array.isArray(record.prescriptions) ? record.prescriptions : []).slice(0, 2).map(p => p.name).join(', ')}
                          {prescriptionCount > 2 ? ` +${prescriptionCount - 2} thuốc` : ''}
                        </p>
                      </div>
                    )}

                    {/* Feature badges */}
                    <div className="pl-6 flex gap-1.5 flex-wrap">
                      {hasAI && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200 flex items-center gap-1">
                          <Brain className="w-2.5 h-2.5" /> AI Analysis
                        </span>
                      )}
                      {hasImages && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 flex items-center gap-1">
                          <Image className="w-2.5 h-2.5" /> Hình ảnh
                        </span>
                      )}
                      {followUpCount > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                          <RefreshCw className="w-2.5 h-2.5" /> {followUpCount} tái khám
                        </span>
                      )}
                      {record.treatmentPlan && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 flex items-center gap-1">
                          <Activity className="w-2.5 h-2.5" /> Kế hoạch điều trị
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:flex-col sm:items-end shrink-0">
                    <span className={`text-xs font-semibold px-3 py-1.5 rounded-xl border ${
                      record.paymentStatus === 'Đã thanh toán'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : record.paymentStatus === 'Chờ xác nhận'
                        ? 'bg-sky-50 text-sky-700 border-sky-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {record.fee}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-emerald-600 font-semibold group-hover:gap-2 transition-all">
                      <span className="hidden sm:inline">Xem chi tiết</span>
                      <ChevronRight className="w-4 h-4 group-hover:text-emerald-600 text-slate-300 transition-colors" />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl bg-white/60">
            <FileText className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500 font-semibold">Chưa có dữ liệu bệnh án.</p>
            <p className="text-xs text-slate-400 mt-1">Bệnh án điện tử sẽ được cập nhật sau mỗi lần khám.</p>
            <p className="text-xs text-slate-400">Liên hệ lễ tân nếu cần bổ sung hồ sơ cũ.</p>
          </div>
        )}
      </div>
      {records.length > 0 && (
        <div className="text-center py-4 border border-dashed border-emerald-200 rounded-2xl bg-emerald-50/30">
          <p className="text-xs text-slate-500 font-medium">Bệnh án điện tử được cập nhật sau mỗi lần khám.</p>
          <p className="text-xs text-slate-400 mt-0.5">Liên hệ lễ tân nếu cần bổ sung hồ sơ cũ.</p>
        </div>
      )}
      {/* Detail Modal */}
      <AnimatePresence>
        {selectedRecord && (
          <MedicalRecordDetailModal
            record={selectedRecord}
            onClose={() => setSelectedRecord(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}



// ─── Main UserProfilePage Component ──────────────────────────────────────────

const getProfileBackground = (role) => {
  if (!role) return patientBg;
  const normalizedRole = role.toLowerCase();
  if (normalizedRole.includes('doctor')) return doctorBg;
  if (normalizedRole.includes('tech')) return techBg;
  if (normalizedRole.includes('admin')) return adminBg;
  if (normalizedRole.includes('reception')) return receptionBg;
  return 'https://images.pexels.com/photos/7578803/pexels-photo-7578803.jpeg';
};

export default function UserProfilePage() {
  const { user } = useAuth();
  const role = user?.role || 'PATIENT';
  const profileBgImage = getProfileBackground(role);

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('personal');
  const [feedbackAptId, setFeedbackAptId] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await NotificationModel.getAll();
        setNotifications(Array.isArray(res) ? res : []);
      } catch (error) {
        console.error("Failed to fetch notifications", error);
        setNotifications([]);
      }
    };
    fetchNotifications();

    const handleUpdate = () => {
      fetchNotifications();
    };
    window.addEventListener('notifications-updated', handleUpdate);
    return () => window.removeEventListener('notifications-updated', handleUpdate);
  }, []);

  const myNotifications = notifications?.filter?.(n => 
    n.recipientRole === 'PATIENT' && (n.recipientId === user?.id || n.recipientId === 'all'));
  const unreadCount = myNotifications?.filter?.(n => !n.isRead).length;

  const handleMarkAllRead = () => {
    NotificationModel.markAllAsRead('PATIENT', user?.id);
  };

  // Build tabs based on role
  const tabs = [
    { id: 'personal', label: 'Thông tin cá nhân', icon: <User className="w-4 h-4" /> },
    { id: 'settings', label: 'Cài đặt tài khoản', icon: <Settings className="w-4 h-4" /> },
    ...(role === 'PATIENT'
      ? [
          { id: 'appointments', label: 'Lịch hẹn của tôi', icon: <Calendar className="w-4 h-4" /> },
          { id: 'records', label: 'Hồ sơ bệnh án', icon: <FileText className="w-4 h-4" /> },
          { id: 'feedback', label: 'Đánh giá của tôi', icon: <Star className="w-4 h-4" /> },
        ]
      : []),
  ];

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased relative">
      {/* Ambient Mesh Blobs */}
      <style>{`
        @keyframes profile-float {
          0%, 100% { transform: translateY(0) translateX(0) scale(1); }
          50% { transform: translateY(-25px) translateX(15px) scale(1.05); }
        }
        @keyframes profile-float-2 {
          0%, 100% { transform: translateY(0) translateX(0) scale(1); }
          50% { transform: translateY(20px) translateX(-10px) scale(0.95); }
        }
      `}</style>
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] left-[-5%] w-[45vw] h-[45vw] rounded-full bg-emerald-300/10 blur-[140px]" style={{ animation: 'profile-float 18s ease-in-out infinite' }} />
        <div className="absolute bottom-[-15%] right-[-5%] w-[55vw] h-[55vw] rounded-full bg-sky-300/10 blur-[140px]" style={{ animation: 'profile-float-2 22s ease-in-out infinite' }} />
      </div>
      {/* Top Bar with Back Button */}
      <div className="relative z-10 px-6 py-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="p-2.5 rounded-xl backdrop-blur-xl bg-white/60 border border-white/50 shadow-sm text-slate-500 hover:text-teal-600 hover:border-teal-200 transition-all active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Hồ sơ cá nhân</h1>
        </div>

        {/* Bell dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2.5 rounded-xl backdrop-blur-xl bg-white/60 border border-white/50 shadow-sm text-slate-500 hover:text-teal-600 hover:border-teal-200 transition-all active:scale-95 cursor-pointer relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] rounded-full w-4.5 h-4.5 flex items-center justify-center font-bold ring-2 ring-white">
                {unreadCount}
              </span>
            )}
          </button>
          
          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-80 bg-white/95 backdrop-blur-md border border-slate-200 shadow-2xl rounded-2xl p-4 z-50 max-h-[350px] overflow-y-auto"
              >
                <div className="flex justify-between items-center pb-2 border-b border-slate-100 mb-2">
                  <span className="text-sm font-extrabold text-slate-800">Thông báo của bạn</span>
                  {unreadCount > 0 && (
                    <button 
                      onClick={handleMarkAllRead}
                      className="text-[10px] text-teal-600 hover:text-teal-700 font-bold border-none bg-transparent cursor-pointer"
                    >
                      Đọc tất cả
                    </button>
                  )}
                </div>
                <div className="space-y-2.5">
                  {myNotifications.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-4">Chưa có thông báo nào.</p>
                  ) : (
                    (Array.isArray(myNotifications) ? myNotifications : []).map((notif) => (
                      <div 
                        key={notif.id}
                        onClick={() => {
                          NotificationModel.markAsRead(notif.id);
                        }}
                        className={`p-2.5 rounded-xl transition-all border cursor-pointer text-left ${
                          notif.isRead 
                            ? 'bg-transparent border-slate-100 hover:bg-slate-50' 
                            : 'bg-teal-50/50 border-teal-100/50 hover:bg-teal-50'
                        }`}
                      >
                        <p className="text-xs font-bold text-slate-800">{notif.title}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{notif.content}</p>
                        <span className="text-[8px] text-slate-400 block mt-1.5">{new Date(notif.timestamp).toLocaleString('vi-VN')}</span>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      {/* Main Profile Card */}
      <motion.div
        className="relative z-10 px-4 pb-12"
        variants={pageEnterVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="w-full max-w-4xl mx-auto backdrop-blur-3xl bg-white/80 border border-white shadow-2xl rounded-[2.5rem] overflow-hidden flex flex-col min-h-[600px]">

          {/* Profile Banner */}
          <div className="w-full h-48 sm:h-64 relative rounded-t-2xl overflow-hidden shadow-sm">
            {/* Layer 1: Background Image */}
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-500 ease-in-out will-change-transform z-0" 
              style={{ backgroundImage: profileBgImage ? `url("${profileBgImage}")` : 'none', backgroundColor: '#e2e8f0' }}
            />
            {/* Layer 2: Frosted glass overlay layer (bg-gradient-to-t) */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-slate-900/40 z-10"></div>
            
            {/* Layer 3: Elevate existing children (like Edit buttons or Back buttons) */}
            <div className="relative z-20 w-full h-full p-6 flex flex-col justify-end">
              <div className="bg-rose-600 text-white font-mono text-[10px] p-2 break-all mb-4 rounded-md shadow-lg border border-rose-400 z-50 relative">
                DEBUG URL: {typeof profileBgImage === 'object' ? JSON.stringify(profileBgImage) : String(profileBgImage)}
              </div>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-400 to-sky-500 flex items-center justify-center text-white text-3xl font-bold shadow-xl shadow-black/20 overflow-hidden border-2 border-white/20">
                  {user?.avatar
                    ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
                    : (user?.name || 'U').charAt(0).toUpperCase()
                  }
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold text-white tracking-tight">{user?.name || 'User'}</h2>
                  <p className="text-sm font-medium text-slate-200 mt-1">{ROLE_DISPLAY_NAMES[role]}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row flex-1">
            {/* Left Sidebar / Tab Menu */}
            <div className="md:w-56 shrink-0 backdrop-blur-xl bg-slate-50/40 border-b md:border-b-0 md:border-r border-slate-200/50 p-4 md:p-6 flex md:flex-col gap-2 overflow-x-auto md:overflow-visible">

            {(Array.isArray(tabs) ? tabs : []).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap border-none cursor-pointer w-full text-left ${
                  activeTab === tab.id
                    ? 'bg-white text-teal-700 shadow-sm border border-teal-100/50'
                    : 'bg-transparent text-slate-500 hover:bg-white/60 hover:text-slate-700'
                }`}
              >
                <span className={activeTab === tab.id ? 'text-teal-600' : 'text-slate-400'}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Right Content Area */}
          <div className="flex-1 p-6 md:p-10 overflow-y-auto">
            <AnimatePresence mode="wait">
              {activeTab === 'personal' && (
                <motion.div key="personal" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit">
                  <PersonalInfoTab user={user} />
                </motion.div>
              )}
              {activeTab === 'settings' && (
                <motion.div key="settings" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit">
                  <AccountSettingsTab />
                </motion.div>
              )}
              {activeTab === 'appointments' && (
                <motion.div key="appointments" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit">
                  <AppointmentsTab setActiveTab={setActiveTab} setFeedbackAptId={setFeedbackAptId} />
                </motion.div>
              )}
              {activeTab === 'records' && (
                <motion.div key="records" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit">
                  <MedicalRecordsTab user={user} />
                </motion.div>
              )}
              {activeTab === 'feedback' && (
                <motion.div key="feedback" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit">
                  <PatientFeedbackTab user={user} feedbackAptId={feedbackAptId} setFeedbackAptId={setFeedbackAptId} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
