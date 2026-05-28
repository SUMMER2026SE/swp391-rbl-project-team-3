import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import BookingModal from '../components/BookingModal';
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
  MapPin
} from 'lucide-react';

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

const MOCK_MEDICAL_RECORDS = [
  {
    id: 1,
    date: '15/10/2026',
    doctor: 'BS. Nguyễn Thanh Hùng',
    specialty: 'Da liễu',
    diagnosis: 'Viêm da cơ địa (Eczema)',
    prescription: 'Hydrocortisone 1%, Cetirizine 10mg',
    status: 'completed',
  },
  {
    id: 2,
    date: '02/09/2026',
    doctor: 'BS. Trần Minh Châu',
    specialty: 'Laser & Thẩm mỹ',
    diagnosis: 'Nám da hỗn hợp',
    prescription: 'Tretinoin 0.05%, SPF 50+',
    status: 'completed',
  },
];

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
    gender: 'Nam',
    address: '123 Đường Ba Tháng Hai, Quận 10, TP. Hồ Chí Minh',
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

function MedicalRecordsTab() {
  const records = MOCK_MEDICAL_RECORDS || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100">
          <ClipboardList className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">Lịch sử khám & Bệnh án điện tử</h3>
          <p className="text-xs text-slate-400 mt-0.5">Tổng hợp toàn bộ hồ sơ y tế của bạn</p>
        </div>
      </div>

      {/* Wrapping Card */}
      <div className="bg-slate-50/90 border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        {records.map((record, idx) => (
          <motion.div
            key={record.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 hover:shadow-md hover:border-slate-300 transition-all group cursor-pointer"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="flex-1 space-y-3">
                {/* Date & Status Row */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {record.date}
                  </span>
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                    Hoàn thành
                  </span>
                </div>

                {/* Doctor Info */}
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-bold text-slate-800">{record.doctor}</span>
                  <span className="text-xs text-slate-400">• {record.specialty}</span>
                </div>

                {/* Diagnosis */}
                <div className="pl-6">
                  <p className="text-sm text-slate-600">
                    <span className="font-semibold text-slate-700">Chẩn đoán:</span> {record.diagnosis}
                  </p>
                </div>

                {/* Prescription */}
                <div className="pl-6 flex items-center gap-2">
                  <Pill className="w-3.5 h-3.5 text-sky-500" />
                  <p className="text-xs text-slate-500">{record.prescription}</p>
                </div>
              </div>

              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-colors shrink-0 self-center" />
            </div>
          </motion.div>
        ))}

        {/* Empty state note */}
        {records.length === 0 && (
          <div className="text-center py-8 border border-dashed border-slate-200 rounded-2xl bg-white/60">
            <FileText className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500 font-semibold">Chưa có dữ liệu bệnh án.</p>
            <p className="text-xs text-slate-400 mt-1">Bệnh án điện tử sẽ được cập nhật sau mỗi lần khám. Liên hệ lễ tân nếu cần bổ sung hồ sơ cũ.</p>
          </div>
        )}
      </div>

      {/* Secondary note if records exist */}
      {records.length > 0 && (
        <div className="text-center py-6 border border-dashed border-emerald-200 rounded-2xl bg-emerald-50/30">
          <FileText className="w-8 h-8 text-emerald-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500 font-medium">Bệnh án điện tử sẽ được cập nhật sau mỗi lần khám.</p>
          <p className="text-xs text-slate-400 mt-1">Liên hệ lễ tân nếu cần bổ sung hồ sơ cũ.</p>
        </div>
      )}
    </div>
  );
}

// ─── Tab 4: Appointments (Patient Only) ──────────────────────────────────────

function AppointmentsTab() {
  const { user } = useAuth();
  const { getPatientAppointments, cancelAppointment } = useAppointmentController();
  const [selectedAptForEdit, setSelectedAptForEdit] = useState(null);
  const [selectedAptForPay, setSelectedAptForPay] = useState(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const triggerRefresh = () => setRefreshTrigger(prev => prev + 1);

  const patientId = user?.id || 'mock-patient-123';
  const appointments = getPatientAppointments(patientId);

  const handleCancel = (id) => {
    if (window.confirm('Bạn có chắc chắn muốn hủy lịch hẹn này không?')) {
      cancelAppointment(id);
      setSuccessMsg('Hủy lịch hẹn thành công!');
      triggerRefresh();
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending':
        return <span className="bg-sky-100 text-sky-700 border border-sky-200 px-2.5 py-1 rounded-full text-xs font-bold">Chờ duyệt</span>;
      case 'Paid':
        return <span className="bg-emerald-100 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-xs font-bold">Đã thanh toán</span>;
      case 'Cancelled':
        return <span className="bg-slate-100 text-slate-500 border border-slate-200 px-2.5 py-1 rounded-full text-xs font-bold">Đã hủy</span>;
      case 'Completed':
        return <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-2.5 py-1 rounded-full text-xs font-bold">Hoàn thành</span>;
      default:
        return <span className="bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl p-3.5 text-sm font-semibold flex items-center gap-2 animate-bounce"
          >
            <CheckCircle2 className="w-4 h-4" /> {successMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-teal-50 rounded-xl text-teal-600 border border-teal-100">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Lịch hẹn của tôi</h3>
            <p className="text-xs text-slate-400 mt-0.5">Theo dõi lịch khám và thanh toán hóa đơn trực tuyến</p>
          </div>
        </div>
        <button
          onClick={() => { setSelectedAptForEdit(null); setIsBookingOpen(true); }}
          className="bg-gradient-to-r from-teal-500 to-sky-500 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-md shadow-teal-500/10 hover:shadow-lg hover:shadow-teal-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer border-none"
        >
          Đặt lịch mới
        </button>
      </div>

      {/* List */}
      <div className="bg-slate-50/90 border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        {appointments.map((apt) => (
          <div key={apt.appointment_id} className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 hover:shadow-md hover:border-slate-300 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-[fadeIn_0.5s_ease-out]">
            <div className="flex items-start gap-4 min-w-0 flex-1">
              <img
                src={apt.doctor_image}
                alt={apt.doctor_name}
                className="w-16 h-16 rounded-2xl object-cover object-top border border-slate-200 shrink-0 shadow-sm"
              />
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-bold text-slate-800 text-sm">{apt.doctor_name}</h4>
                  <span className="text-[10px] text-slate-400 font-semibold">• {apt.doctor_title}</span>
                </div>
                <p className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-slate-400">calendar_month</span> {apt.appointment_date} 
                  <span className="material-symbols-outlined text-[14px] text-slate-400 ml-1">schedule</span> {apt.start_time} - {apt.end_time}
                </p>
                <p className="text-[11px] text-slate-500 truncate font-medium">
                  <span className="font-bold text-slate-600">Dịch vụ:</span> {apt.service_name}
                </p>
                {apt.reason && (
                  <p className="text-[11px] text-slate-400 italic truncate max-w-md">
                    "{apt.reason}"
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:items-end gap-3 w-full sm:w-auto shrink-0">
              <div className="flex justify-between items-center sm:justify-end gap-3 w-full sm:w-auto">
                <span className="text-xs font-bold text-slate-500 sm:hidden">Trạng thái:</span>
                {getStatusBadge(apt.status)}
              </div>

              {/* Action buttons */}
              {apt.status === 'Pending' && (
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => { setSelectedAptForPay(apt); setIsPaymentOpen(true); }}
                    className="flex-1 sm:flex-none py-2 px-4 rounded-xl bg-teal-600 text-white font-bold text-xs hover:bg-teal-500 shadow-sm transition-all border-none cursor-pointer text-center"
                  >
                    Thanh toán
                  </button>
                  <button
                    onClick={() => { setSelectedAptForEdit(apt); setIsBookingOpen(true); }}
                    className="flex-1 sm:flex-none py-2 px-3 rounded-xl bg-white border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-100 transition-all cursor-pointer text-center"
                  >
                    Đổi lịch
                  </button>
                  <button
                    onClick={() => handleCancel(apt.appointment_id)}
                    className="py-2 px-3 rounded-xl bg-white border border-slate-200 text-rose-600 hover:text-rose-700 hover:bg-rose-50/50 font-semibold text-xs transition-all cursor-pointer text-center border-none"
                  >
                    Hủy lịch
                  </button>
                </div>
              )}
              {apt.status === 'Paid' && (
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                  Chờ bác sĩ gọi khám
                </span>
              )}
            </div>
          </div>
        ))}

        {appointments.length === 0 && (
          <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl bg-white/60">
            <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500 font-bold">Không có lịch hẹn nào.</p>
            <p className="text-xs text-slate-400 mt-1">Lịch khám của bạn sẽ được hiển thị ở đây sau khi đăng ký thành công.</p>
          </div>
        )}
      </div>

      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        appointmentToEdit={selectedAptForEdit}
        onSuccess={() => {
          setSuccessMsg(selectedAptForEdit ? 'Thay đổi lịch khám thành công!' : 'Đặt lịch khám thành công!');
          triggerRefresh();
          setTimeout(() => setSuccessMsg(''), 3000);
        }}
      />

      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        appointment={selectedAptForPay}
        onSuccess={() => {
          setSuccessMsg('Thanh toán lịch hẹn thành công!');
          triggerRefresh();
          setTimeout(() => setSuccessMsg(''), 3000);
        }}
      />
    </div>
  );
}

// ─── Main UserProfilePage Component ──────────────────────────────────────────

export default function UserProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('personal');

  const role = user?.role || 'PATIENT';

  // Build tabs based on role
  const tabs = [
    { id: 'personal', label: 'Thông tin cá nhân', icon: <User className="w-4 h-4" /> },
    { id: 'settings', label: 'Cài đặt tài khoản', icon: <Settings className="w-4 h-4" /> },
    ...(role === 'PATIENT'
      ? [
          { id: 'appointments', label: 'Lịch hẹn của tôi', icon: <Calendar className="w-4 h-4" /> },
          { id: 'records', label: 'Hồ sơ bệnh án', icon: <FileText className="w-4 h-4" /> }
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
      <div className="relative z-10 px-6 py-5 flex items-center gap-4">
        <button
          onClick={handleBack}
          className="p-2.5 rounded-xl backdrop-blur-xl bg-white/60 border border-white/50 shadow-sm text-slate-500 hover:text-teal-600 hover:border-teal-200 transition-all active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-slate-900 tracking-tight">Hồ sơ cá nhân</h1>
      </div>

      {/* Main Profile Card */}
      <motion.div
        className="relative z-10 px-4 pb-12"
        variants={pageEnterVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="w-full max-w-4xl mx-auto backdrop-blur-3xl bg-white/80 border border-white shadow-2xl rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row min-h-[600px]">

          {/* Left Sidebar / Tab Menu */}
          <div className="md:w-56 shrink-0 backdrop-blur-xl bg-slate-50/40 border-b md:border-b-0 md:border-r border-slate-200/50 p-4 md:p-6 flex md:flex-col gap-2 overflow-x-auto md:overflow-visible">
            <div className="hidden md:block mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-sky-500 flex items-center justify-center text-white text-2xl font-bold shadow-md shadow-teal-500/15 mx-auto">
                {(user?.name || 'U').charAt(0).toUpperCase()}
              </div>
              <p className="text-center mt-3 text-sm font-bold text-slate-800 truncate">{user?.name || 'User'}</p>
              <p className="text-center text-[11px] text-slate-400 font-medium">{ROLE_DISPLAY_NAMES[role]}</p>
            </div>

            {tabs.map((tab) => (
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
                  <AppointmentsTab />
                </motion.div>
              )}
              {activeTab === 'records' && (
                <motion.div key="records" variants={tabContentVariants} initial="hidden" animate="visible" exit="exit">
                  <MedicalRecordsTab />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
