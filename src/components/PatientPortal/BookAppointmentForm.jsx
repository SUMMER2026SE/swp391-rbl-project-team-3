import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, User, Stethoscope, CheckCircle2, ChevronDown, Star } from 'lucide-react';
import { doctors, mockServices, mockTimeSlots } from '../../mockData';

export default function BookAppointmentForm({ isOpen, onClose }) {
  const [selectedService, setSelectedService] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedService('');
      setSelectedDoctor('');
      setSelectedDate('');
      setSelectedTime('');
      setIsSubmitted(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isFormComplete = selectedService && selectedDoctor && selectedDate && selectedTime;
  const selectedDoctorData = doctors.find((d) => d.id === selectedDoctor);

  // Get tomorrow's date as min date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const handleSubmit = () => {
    if (!isFormComplete) return;
    setIsSubmitted(true);
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/30 backdrop-blur-sm font-sans"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-full max-w-lg backdrop-blur-3xl bg-white/75 border border-white/80 shadow-[0_20px_60px_rgba(14,165,233,0.12)] rounded-[2rem] p-8 relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-transparent border-none text-slate-400 hover:text-slate-700 hover:bg-slate-100/50 p-2 rounded-full flex items-center justify-center transition-all cursor-pointer"
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
              <h3 className="text-xl font-bold text-slate-800 mb-2">Đặt lịch thành công!</h3>
              <p className="text-sm text-slate-500 text-center">
                Vui lòng chờ xác nhận từ phòng khám. <br />
                Chúng tôi sẽ thông báo cho bạn sớm nhất.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form Content */}
        {!isSubmitted && (
          <>
            {/* Header */}
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold text-slate-800 mb-2 tracking-tight">
                Đặt lịch khám mới
              </h2>
              <p className="text-slate-500 text-sm">
                Chọn dịch vụ, bác sĩ và thời gian phù hợp
              </p>
            </div>

            <div className="space-y-5">
              {/* 1. Service Selection */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 mb-2">
                  <Stethoscope className="w-4 h-4 text-emerald-500" />
                  Chọn dịch vụ
                </label>
                <div className="relative">
                  <select
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-emerald-500 text-slate-800 transition-colors appearance-none cursor-pointer text-sm pr-10"
                  >
                    <option value="">-- Chọn dịch vụ --</option>
                    {mockServices.map((svc) => (
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
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 mb-2">
                  <User className="w-4 h-4 text-sky-500" />
                  Chọn bác sĩ
                </label>
                <div className="relative">
                  <select
                    value={selectedDoctor}
                    onChange={(e) => setSelectedDoctor(e.target.value)}
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
                              {selectedDoctorData.schedule.map((s) => s.day).join(', ')}
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
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 mb-2">
                  <Calendar className="w-4 h-4 text-teal-500" />
                  Chọn ngày khám
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  min={minDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-emerald-500 text-slate-800 transition-colors cursor-pointer text-sm"
                />
              </div>

              {/* 4. Time Slot Selection */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 mb-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  Chọn khung giờ
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {mockTimeSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedTime(slot)}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold text-center cursor-pointer border transition-all ${
                        selectedTime === slot
                          ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={!isFormComplete}
              className={`w-full mt-8 p-4 rounded-xl text-white text-base font-semibold border-none transition-all duration-200 cursor-pointer ${
                isFormComplete
                  ? 'bg-gradient-to-r from-emerald-500 to-sky-500 shadow-[0_8px_20px_rgba(20,184,166,0.3)] hover:shadow-[0_12px_25px_rgba(20,184,166,0.4)] hover:-translate-y-0.5'
                  : 'bg-slate-300 cursor-not-allowed shadow-none'
              }`}
            >
              Xác nhận đặt lịch
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}
