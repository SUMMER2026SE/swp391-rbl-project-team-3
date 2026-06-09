import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Stethoscope, User, MessageSquare, X } from 'lucide-react';
import { useDoctorController } from '../controllers/useDoctorController';
import { useAppointmentController } from '../controllers/useAppointmentController';
import { useAuth } from '../context/AuthContext';

const SERVICES = [
  { id: 'srv-01', name: 'Khám da liễu tổng quát' },
  { id: 'srv-02', name: 'Trị liệu Laser/Thẩm mỹ' },
  { id: 'srv-03', name: 'Phân tích da AI' }
];

const TIME_SLOTS = [
  { id: 'slot-01', label: '08:00 - 09:00', start: '08:00', end: '09:00' },
  { id: 'slot-02', label: '09:30 - 10:30', start: '09:30', end: '10:30' },
  { id: 'slot-03', label: '11:00 - 12:00', start: '11:00', end: '12:00' },
  { id: 'slot-04', label: '13:30 - 14:30', start: '13:30', end: '14:30' },
  { id: 'slot-05', label: '15:00 - 16:00', start: '15:00', end: '16:00' },
  { id: 'slot-06', label: '16:30 - 17:30', start: '16:30', end: '17:30' }
];

export default function BookingModal({ isOpen, onClose, preselectedDoctorId = null, appointmentToEdit = null, onSuccess }) {
  const { user } = useAuth();
  const { getDoctors } = useDoctorController();
  const doctors = getDoctors();
  const { bookAppointment, changeAppointment } = useAppointmentController();

  const [selectedDoctorId, setSelectedDoctorId] = useState(preselectedDoctorId || doctors[0]?.id || '');
  const [selectedServiceId, setSelectedServiceId] = useState('srv-01');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [selectedSlotId, setSelectedSlotId] = useState('slot-01');
  const [reason, setReason] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Handle load / prefill values (especially if editing)
  useEffect(() => {
    if (appointmentToEdit) {
      setSelectedDoctorId(appointmentToEdit.doctor_id);
      setSelectedServiceId(appointmentToEdit.service_id);
      setAppointmentDate(appointmentToEdit.appointment_date);
      
      const matchedSlot = TIME_SLOTS.find(
        slot => slot.start === appointmentToEdit.start_time && slot.end === appointmentToEdit.end_time
      );
      if (matchedSlot) {
        setSelectedSlotId(matchedSlot.id);
      }
      setReason(appointmentToEdit.reason || '');
    } else {
      setSelectedDoctorId(preselectedDoctorId || doctors[0]?.id || '');
      setSelectedServiceId('srv-01');
      // Set tomorrow as default date
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setAppointmentDate(tomorrow.toISOString().split('T')[0]);
      setSelectedSlotId('slot-01');
      setReason('');
    }
    setErrorMsg('');
  }, [appointmentToEdit, preselectedDoctorId, isOpen, doctors]);

  if (!isOpen) return null;

  const selectedDoctor = doctors.find(d => d.id === selectedDoctorId) || doctors[0];
  const selectedService = SERVICES.find(s => s.id === selectedServiceId) || SERVICES[0];
  const selectedSlot = TIME_SLOTS.find(slot => slot.id === selectedSlotId) || TIME_SLOTS[0];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!user) {
      setErrorMsg('Vui lòng đăng nhập để đặt lịch hẹn.');
      return;
    }
    if (!appointmentDate) {
      setErrorMsg('Vui lòng chọn ngày khám.');
      return;
    }

    const today = new Date();
    today.setHours(0,0,0,0);
    const chosenDate = new Date(appointmentDate);
    if (chosenDate < today) {
      setErrorMsg('Ngày chọn không được ở quá khứ.');
      return;
    }

    const payload = {
      patient_id: user.id || 'mock-patient-123',
      patient_name: user.name || 'Nguyễn Văn A',
      doctor_id: selectedDoctorId,
      doctor_name: selectedDoctor.name,
      doctor_title: selectedDoctor.title,
      doctor_image: selectedDoctor.image,
      service_id: selectedServiceId,
      service_name: selectedService.name,
      slot_id: selectedSlotId,
      appointment_date: appointmentDate,
      start_time: selectedSlot.start,
      end_time: selectedSlot.end,
      reason: reason,
      status: appointmentToEdit ? appointmentToEdit.status : 'Pending'
    };

    try {
      if (appointmentToEdit) {
        changeAppointment(appointmentToEdit.appointment_id, payload);
      } else {
        bookAppointment(payload);
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setErrorMsg(err?.message || 'Có lỗi xảy ra, vui lòng thử lại.');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 220 }}
          className="relative w-full max-w-2xl bg-white/80 backdrop-blur-2xl border border-white/60 shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-[2.5rem] overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-6 border-b border-slate-200/50">
            <div>
              <h2 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-sky-600 tracking-tight">
                {appointmentToEdit ? 'Thay đổi lịch khám' : 'Đặt lịch khám chuyên khoa'}
              </h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                {appointmentToEdit ? 'Vui lòng chọn thời gian mới phù hợp' : 'Khám nhanh chóng, bảo mật và chuẩn y khoa'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors border-none cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
            {errorMsg && (
              <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl p-3.5 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            {/* Doctor Picker */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <User size={14} className="text-teal-500" /> Chọn bác sĩ điều trị
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {doctors.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => !preselectedDoctorId && setSelectedDoctorId(doc.id)}
                    className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all cursor-pointer ${
                      selectedDoctorId === doc.id
                        ? 'bg-teal-50 border-teal-400 ring-2 ring-teal-500/10'
                        : 'bg-white/60 border-slate-200 hover:border-slate-300'
                    } ${preselectedDoctorId && preselectedDoctorId !== doc.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <img
                      src={doc.image}
                      alt={doc.name}
                      className="w-10 h-10 rounded-xl object-cover object-top shrink-0 border border-white shadow-sm"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-800 truncate">{doc.name}</h4>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{doc.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Service Selection */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Stethoscope size={14} className="text-sky-500" /> Chọn dịch vụ y tế
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {SERVICES.map((srv) => (
                  <div
                    key={srv.id}
                    onClick={() => setSelectedServiceId(srv.id)}
                    className={`p-4 rounded-2xl border text-center transition-all cursor-pointer font-bold text-xs ${
                      selectedServiceId === srv.id
                        ? 'bg-sky-50 border-sky-400 text-sky-700 ring-2 ring-sky-500/10'
                        : 'bg-white/60 border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {srv.name}
                  </div>
                ))}
              </div>
            </div>

            {/* Date and Time selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Date Input */}
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Calendar size={14} className="text-amber-500" /> Chọn ngày khám
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 text-slate-900 rounded-xl px-4 py-3 shadow-inner outline-none transition-all text-sm font-semibold"
                  />
                </div>
              </div>

              {/* Consultation Fee Card */}
              <div className="bg-slate-50/80 border border-slate-200/50 rounded-2xl p-4 flex flex-col justify-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Phí khám ban đầu</span>
                <span className="text-2xl font-black text-slate-800 mt-1">{selectedDoctor?.consultationFee || '500,000 VNĐ'}</span>
                <span className="text-[10px] text-slate-400 mt-0.5">Thanh toán trực tuyến hoặc trực tiếp tại quầy</span>
              </div>
            </div>

            {/* Time Slot Picker */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Clock size={14} className="text-purple-500" /> Chọn giờ khám
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {TIME_SLOTS.map((slot) => (
                  <div
                    key={slot.id}
                    onClick={() => setSelectedSlotId(slot.id)}
                    className={`py-3.5 rounded-xl border text-center transition-all cursor-pointer font-bold text-xs ${
                      selectedSlotId === slot.id
                        ? 'bg-teal-50 border-teal-400 text-teal-700 ring-2 ring-teal-500/15'
                        : 'bg-white/60 border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    {slot.start}
                  </div>
                ))}
              </div>
            </div>

            {/* Reason Notes */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <MessageSquare size={14} className="text-rose-500" /> Triệu chứng lâm sàng / Lý do khám
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ví dụ: Da mẩn đỏ, ngứa ngáy dữ dội sau khi dùng kem dưỡng mới..."
                rows={3}
                className="w-full bg-white border border-slate-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 text-slate-900 rounded-2xl px-4 py-3 shadow-inner outline-none transition-all text-sm font-semibold"
              />
            </div>
          </form>

          {/* Footer Submit Buttons */}
          <div className="px-8 py-5 border-t border-slate-200/50 bg-slate-50/50 flex gap-3">
            <button
              onClick={onClose}
              type="button"
              className="flex-1 py-3.5 rounded-xl bg-white border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-100 transition-all cursor-pointer text-center"
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleSubmit}
              type="submit"
              className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-sky-500 text-white font-bold text-sm shadow-md shadow-teal-500/20 hover:shadow-lg hover:shadow-teal-500/30 hover:-translate-y-0.5 transition-all border-none cursor-pointer text-center flex items-center justify-center gap-1.5"
            >
              {appointmentToEdit ? 'Xác nhận đổi lịch' : 'Xác nhận đặt lịch'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
