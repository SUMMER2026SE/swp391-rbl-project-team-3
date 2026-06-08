import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, User, Stethoscope, CheckCircle2, ChevronDown, Star, AlertTriangle, Mail, Phone } from 'lucide-react';
import { doctors, mockServices } from '../../mockData';
import { useAppointmentController } from '../../controllers/useAppointmentController';
import { useAuth } from '../../context/AuthContext';

export default function BookAppointmentForm({ isOpen, onClose }) {
  const { user } = useAuth();
  const { bookAppointment, getAvailableSlots } = useAppointmentController(user?.id);

  const [selectedService, setSelectedService] = useState('');
  const [servicesList, setServicesList] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  
  // Guest contact info state
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedService('');
      setSelectedDoctor('');
      setSelectedDate('');
      setSelectedTime('');
      setGuestName('');
      setGuestPhone('');
      setGuestEmail('');
      setErrorMessage('');
      setIsSubmitted(false);

      // Load services dynamically from Admin's localStorage
      const saved = localStorage.getItem('admin-services');
      if (saved) {
        const parsed = JSON.parse(saved).map(s => ({
          id: s.id,
          name: s.name,
          price: typeof s.price === 'number' ? `${s.price.toLocaleString('vi-VN')} VNĐ` : s.price,
          description: s.description,
          status: s.status
        })).filter(s => s.status === 'Hoạt động');
        setServicesList(parsed);
      } else {
        setServicesList(mockServices);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedDoctorData = doctors.find((d) => d.id === selectedDoctor);
  const selectedServiceData = servicesList.find((s) => s.id === selectedService);

  // Get tomorrow's date as min date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  // Check if doctor works on selected day
  let isDoctorWorkingOnDay = true;
  let doctorScheduleText = '';
  if (selectedDoctorData && selectedDate) {
    const parts = selectedDate.split('-');
    const selectDateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    const dayOfWeek = selectDateObj.getDay();

    const DAY_MAP = {
      'Chủ Nhật': 0,
      'Thứ Hai': 1,
      'Thứ Ba': 2,
      'Thứ Tư': 3,
      'Thứ Năm': 4,
      'Thứ Sáu': 5,
      'Thứ Bảy': 6,
    };

    const workingDays = selectedDoctorData.schedule.map(s => DAY_MAP[s.day] !== undefined ? DAY_MAP[s.day] : -1).filter(d => d !== -1);
    isDoctorWorkingOnDay = workingDays.includes(dayOfWeek);
    doctorScheduleText = selectedDoctorData.schedule.map(s => s.day).join(', ');
  }

  // Get available slots for the selected date
  const slots = (selectedDoctor && selectedDate && isDoctorWorkingOnDay)
    ? getAvailableSlots(selectedDoctor, selectedDate)
    : [];

  const isContactInfoComplete = user 
    ? true 
    : (guestName.trim() && guestPhone.trim() && guestEmail.trim());

  const isFormComplete = selectedService && selectedDoctor && selectedDate && selectedTime && isDoctorWorkingOnDay && isContactInfoComplete;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isFormComplete) return;

    setErrorMessage('');

    const bookingPayload = {
      doctorId: selectedDoctor,
      patientId: user ? user.id : null,
      patientName: user ? user.name : guestName,
      patientPhone: user ? (user.phone || guestPhone) : guestPhone,
      patientEmail: user ? (user.email || guestEmail) : guestEmail,
      date: selectedDate,
      time: selectedTime,
      service: selectedServiceData ? selectedServiceData.name : 'Khám Da Liễu Tổng Quát',
      fee: selectedServiceData ? selectedServiceData.price : '300,000 VNĐ',
      notes: user ? `Khách hàng đặt lịch khám qua cổng Portal.` : `Khách vãng lai đăng ký qua website.`,
    };

    const result = bookAppointment(bookingPayload);
    if (result.success) {
      setIsSubmitted(true);
      setTimeout(() => {
        onClose();
      }, 2500);
    } else {
      setErrorMessage(result.error);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm font-sans"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-full max-w-xl backdrop-blur-3xl bg-white/85 border border-white/80 shadow-[0_20px_60px_rgba(14,165,233,0.15)] rounded-[2.5rem] p-8 relative max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 bg-transparent border-none text-slate-400 hover:text-slate-700 hover:bg-slate-100/50 p-2 rounded-full flex items-center justify-center transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success State */}
        <AnimatePresence>
          {isSubmitted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-12"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.1 }}
              >
                <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4" />
              </motion.div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Đặt lịch thành công!</h3>
              <p className="text-sm text-slate-500 text-center max-w-sm leading-relaxed">
                Yêu cầu đặt lịch khám đã được gửi tới Lễ tân phòng khám để phê duyệt. <br />
                {user 
                  ? 'Bạn có thể xem và quản lý lịch khám này tại trang cá nhân.' 
                  : 'Hệ thống đã ghi nhận thông tin liên hệ của bạn, lễ tân sẽ gọi điện xác nhận sớm nhất.'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form Content */}
        {!isSubmitted && (
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-slate-800 mb-1 tracking-tight">
                Đặt lịch khám mới
              </h2>
              <p className="text-slate-500 text-sm">
                Điền đầy đủ thông tin để đặt chỗ khám tại DermaSmart
              </p>
            </div>

            {/* Business Rules Error Alert */}
            {errorMessage && (
              <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-700 font-medium">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Lỗi đặt lịch:</span> {errorMessage}
                </div>
              </div>
            )}

            <div className="space-y-4">
              {/* 1. Service Selection */}
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  <Stethoscope className="w-4 h-4 text-emerald-500" />
                  Chọn dịch vụ
                </label>
                <div className="relative">
                  <select
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                    required
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-emerald-500 text-slate-800 transition-colors appearance-none cursor-pointer text-sm pr-10"
                  >
                    <option value="">-- Chọn dịch vụ --</option>
                    {servicesList.map((svc) => (
                      <option key={svc.id} value={svc.id}>
                        {svc.name} — {svc.price}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* 2. Doctor Selection */}
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  <User className="w-4 h-4 text-sky-500" />
                  Chọn bác sĩ
                </label>
                <div className="relative">
                  <select
                    value={selectedDoctor}
                    onChange={(e) => {
                      setSelectedDoctor(e.target.value);
                      setSelectedTime(''); // Reset time when doctor changes
                    }}
                    required
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-emerald-500 text-slate-800 transition-colors appearance-none cursor-pointer text-sm pr-10"
                  >
                    <option value="">-- Chọn bác sĩ --</option>
                    {doctors.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.name} — {doc.title}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>

                {/* Doctor Info Card */}
                <AnimatePresence>
                  {selectedDoctorData && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 bg-emerald-50/60 border border-emerald-100 rounded-xl p-3 overflow-hidden"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={selectedDoctorData.image}
                          alt={selectedDoctorData.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-700 truncate">{selectedDoctorData.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                              <Star className="w-3 h-3 fill-emerald-500 text-emerald-500" />
                              {selectedDoctorData.rating}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Lịch trực: {selectedDoctorData.schedule.map((s) => s.day).join(', ')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 3. Date Selection */}
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  <Calendar className="w-4 h-4 text-teal-500" />
                  Chọn ngày khám
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  min={minDate}
                  required
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedTime(''); // Reset time when date changes
                  }}
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-emerald-500 text-slate-800 transition-colors cursor-pointer text-sm"
                />

                {/* Doctor Availability Warning */}
                {selectedDoctorData && selectedDate && !isDoctorWorkingOnDay && (
                  <div className="mt-2 text-xs text-rose-500 font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    Bác sĩ không có lịch trực ngày này. Vui lòng chọn ngày khác ({doctorScheduleText}).
                  </div>
                )}
              </div>

              {/* 4. Time Slot Selection */}
              {selectedDoctor && selectedDate && isDoctorWorkingOnDay && (
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    <Clock className="w-4 h-4 text-amber-500" />
                    Chọn khung giờ
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {slots.map((slot) => (
                      <button
                        key={slot.time}
                        type="button"
                        disabled={slot.isBooked}
                        onClick={() => setSelectedTime(slot.time)}
                        className={`px-2 py-2.5 rounded-xl text-xs font-bold text-center cursor-pointer border transition-all ${
                          slot.isBooked
                            ? 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed line-through'
                            : selectedTime === slot.time
                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50'
                        }`}
                      >
                        {slot.time}
                        {slot.isBooked && <span className="block text-[8px] font-normal leading-none mt-0.5 text-slate-400">Đã đặt</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. Contact Info Section */}
              <div className="border-t border-slate-150 pt-4">
                {user ? (
                  <div className="bg-sky-50/50 border border-sky-100/50 rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-sm">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Đang đặt với tài khoản</p>
                      <p className="text-sm font-bold text-slate-800">{user.name}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Thông tin liên hệ (Khách vãng lai)</p>
                    
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Họ và tên bệnh nhân"
                        required
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-emerald-500 text-slate-800 text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative">
                        <input
                          type="tel"
                          placeholder="Số điện thoại"
                          required
                          value={guestPhone}
                          onChange={(e) => setGuestPhone(e.target.value)}
                          className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-emerald-500 text-slate-800 text-sm"
                        />
                      </div>
                      <div className="relative">
                        <input
                          type="email"
                          placeholder="Địa chỉ Email"
                          required
                          value={guestEmail}
                          onChange={(e) => setGuestEmail(e.target.value)}
                          className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-emerald-500 text-slate-800 text-sm"
                        />
                      </div>
                    </div>
                    
                    <p className="text-[10px] text-slate-400 italic">
                      * Lưu ý: Tài khoản bệnh nhân sẽ được tạo tự động dựa trên thông tin trên để bạn tra cứu lịch sử khám.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isFormComplete}
              className={`w-full mt-6 p-4 rounded-2xl text-white text-base font-semibold border-none transition-all duration-200 cursor-pointer ${
                isFormComplete
                  ? 'bg-gradient-to-r from-emerald-500 to-sky-500 shadow-[0_8px_20px_rgba(20,184,166,0.3)] hover:shadow-[0_12px_25px_rgba(20,184,166,0.4)] hover:-translate-y-0.5'
                  : 'bg-slate-300 cursor-not-allowed shadow-none'
              }`}
            >
              Xác nhận đặt lịch
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
