// Receptionist » Walk-in booking + patient-record modal. Extracted verbatim
// from ReceptionistDashboard.jsx (M1 god-component split, Phase 1). Pure
// presentation: all booking state + handlers arrive via props from the parent,
// which still owns the logic, validation and Realtime. Rendered through a portal
// so the parent's stacking context can't clip it.
import React from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Plus, X, AlertCircle, Users, ClipboardList, Clock, AlertTriangle } from 'lucide-react';
import GlassDatePicker from '../../common/GlassDatePicker';
import GlassSelect from '../../common/GlassSelect';

export default function WalkInBookingModal({
  isAddOpen,
  setIsAddOpen,
  handleSubmitBooking,
  errorMessage,
  selectedDate,
  setSelectedDate,
  setSelectedTime,
  minDate,
  selectedDoctor,
  setSelectedDoctor,
  selectedTime,
  doctors,
  newApt,
  setNewApt,
  handleEmailBlur,
  isExistingPatient,
  isCheckingEmail,
  filteredSlots,
  isSubmittingRef,
}) {
  if (!isAddOpen) return null;

  return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddOpen(false)}
              className="absolute inset-0 z-0 bg-transparent cursor-pointer"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25 }}
              className="relative z-[10000] w-full max-w-5xl bg-white/60 backdrop-blur-2xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-3xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex justify-between items-center px-8 py-4 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#0d473b] flex items-center justify-center text-white font-extrabold shadow-sm">
                    <Plus className="w-4 h-4" />
                  </div>
                  <h3 className="font-extrabold text-lg text-[#0d473b] tracking-tight">Đặt lịch hẹn trực tiếp & Tạo hồ sơ</h3>
                </div>
                <button type="button" onClick={() => setIsAddOpen(false)} className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer border-none transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSubmitBooking} noValidate className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden text-xs font-semibold text-slate-700">

                {/* LEFT COLUMN: Scrollable Form Inputs */}
                <div className="flex-1 overflow-y-auto p-8 space-y-5">
                  {errorMessage && (
                    <div className="relative z-50 bg-red-100 text-red-600 p-3 rounded-xl border border-red-200 text-xs font-bold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* Date Input */}
                  <div className="relative z-[60]">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-500">Ngày khám <span className="text-rose-500">*</span></label>
                      <GlassDatePicker
                        value={selectedDate}
                        onChange={(d) => { setSelectedDate(d); setSelectedTime(''); }}
                        min={minDate}
                        placeholder="mm/dd/yyyy"
                      />
                    </div>
                  </div>

                  {/* Step 2: Choose Doctor */}
                  <div className="relative z-[50]">
                    <div className="flex flex-col gap-1.5">
                      <label className="flex items-center gap-1.5 text-[11px] font-black text-[#855e42] uppercase tracking-wider mb-1">
                        <Users className="w-3.5 h-3.5 text-teal-600" />
                        BƯỚC 2: CHỌN BÁC SĨ
                      </label>
                      <GlassSelect
                        value={selectedDoctor}
                        onChange={(v) => { setSelectedDoctor(v); setSelectedTime(''); }}
                        placeholder="Tự động chọn bác sĩ phù hợp"
                        buttonClassName="p-4 text-base text-slate-900 font-semibold"
                        options={[
                          { value: '', label: 'Không chọn – Hệ thống tự động sắp xếp' },
                          ...(doctors || []).map(doc => ({
                            value: doc.user_id || doc.id,
                            label: `${/^(BS|ThS|TS|PGS|GS|CN|KTV)/i.test((doc.name || '').trim()) ? '' : 'BS. '}${doc.name}${doc.specialties && doc.specialties.length > 0 ? ` (${doc.specialties.join(', ')})` : ''}`,
                          }))
                        ]}
                      />
                    </div>
                  </div>

                  <div className="border-b border-slate-200/60 my-4" />

                  {/* Remaining Patient Details */}
                  <div className="relative z-[40]">
                    {/* Patient Record Title */}
                    <div className="flex items-center gap-1.5 text-[11px] font-black text-[#855e42] uppercase tracking-wider mb-3">
                      <ClipboardList className="w-3.5 h-3.5 text-[#0d473b]" />
                      HỒ SƠ BỆNH ÁN BỆNH NHÂN
                    </div>

                    {/* Patient Profile Fields */}
                    <div className="space-y-4">
                      {/* Email */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-500">Email (Gmail) <span className="text-rose-500">*</span></label>
                        <input
                          type="email"
                          value={newApt.email}
                          onChange={(e) => setNewApt({ ...newApt, email: e.target.value })}
                          onBlur={handleEmailBlur}
                          className="w-full p-4 rounded-xl bg-white/70 backdrop-blur-xl border border-white/80 text-slate-900 font-semibold placeholder-slate-500 outline-none focus:ring-2 focus:ring-teal-500/50 transition-all text-sm shadow-sm"
                          placeholder="example@gmail.com"
                          required
                        />
                      </div>

                      {/* Name & Phone */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-slate-500">Họ và tên <span className="text-rose-500">*</span></label>
                          <input
                            type="text"
                            value={newApt.patientName}
                            onChange={(e) => setNewApt({ ...newApt, patientName: e.target.value })}
                            className="w-full p-4 rounded-xl bg-white/70 backdrop-blur-xl border border-white/80 text-slate-900 font-semibold placeholder-slate-500 outline-none focus:ring-2 focus:ring-teal-500/50 transition-all text-sm shadow-sm disabled:text-slate-400 disabled:opacity-70"
                            placeholder="Nguyễn Văn A"
                            disabled={isExistingPatient || isCheckingEmail}
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-slate-500">Số điện thoại <span className="text-rose-500">*</span></label>
                          <input
                            type="tel"
                            value={newApt.phone}
                            onChange={(e) => setNewApt({ ...newApt, phone: e.target.value })}
                            className="w-full p-4 rounded-xl bg-white/70 backdrop-blur-xl border border-white/80 text-slate-900 font-semibold placeholder-slate-500 outline-none focus:ring-2 focus:ring-teal-500/50 transition-all text-sm shadow-sm disabled:text-slate-400 disabled:opacity-70"
                            placeholder="09xx xxx xxx"
                            disabled={isExistingPatient || isCheckingEmail}
                            required
                          />
                        </div>
                      </div>

                      {/* DOB & Gender */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-slate-500">Ngày sinh <span className="text-rose-500">*</span></label>
                          <GlassDatePicker
                            value={newApt.dob}
                            onChange={(d) => setNewApt({ ...newApt, dob: d })}
                            disabled={isExistingPatient || isCheckingEmail}
                            placeholder="Ngày sinh"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-slate-500">Giới tính <span className="text-rose-500">*</span></label>
                          <GlassSelect
                            value={newApt.gender}
                            onChange={(v) => setNewApt({ ...newApt, gender: v })}
                            options={[
                              { value: 'Nam', label: 'Nam' },
                              { value: 'Nữ', label: 'Nữ' }
                            ]}
                            disabled={isExistingPatient || isCheckingEmail}
                            buttonClassName="p-4 text-base text-slate-900 font-semibold"
                          />
                        </div>
                      </div>

                      {/* District & Province */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-slate-500">Quận / Huyện <span className="text-rose-500">*</span></label>
                          <input
                            type="text"
                            value={newApt.district}
                            onChange={(e) => setNewApt({ ...newApt, district: e.target.value })}
                            className="w-full p-4 rounded-xl bg-white/70 backdrop-blur-xl border border-white/80 text-slate-900 font-semibold placeholder-slate-500 outline-none focus:ring-2 focus:ring-teal-500/50 transition-all text-sm shadow-sm disabled:text-slate-400 disabled:opacity-70"
                            placeholder="Quận 1, Quận Bình Thạnh..."
                            disabled={isExistingPatient || isCheckingEmail}
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-slate-500">Tỉnh / Thành phố <span className="text-rose-500">*</span></label>
                          <input
                            type="text"
                            value={newApt.province}
                            onChange={(e) => setNewApt({ ...newApt, province: e.target.value })}
                            className="w-full p-4 rounded-xl bg-white/70 backdrop-blur-xl border border-white/80 text-slate-900 font-semibold placeholder-slate-500 outline-none focus:ring-2 focus:ring-teal-500/50 transition-all text-sm shadow-sm disabled:text-slate-400 disabled:opacity-70"
                            placeholder="TP. Hồ Chí Minh"
                            disabled={isExistingPatient || isCheckingEmail}
                            required
                          />
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: Slots, Warnings, Pricing & Actions */}
                <div className="w-full lg:w-[420px] bg-white/40 rounded-2xl border border-white/50 p-6 flex flex-col max-h-full lg:max-h-[85vh] shrink-0 overflow-y-auto justify-between gap-6">

                  {/* Slots container or empty calendar message card */}
                  <div className="bg-white/50 backdrop-blur-md border border-white/60 rounded-2xl p-6 shadow-sm flex flex-col flex-1 min-h-[320px] justify-center">
                    {!selectedDate ? (
                      <div className="text-center py-8 px-4 flex flex-col items-center justify-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-[#ecf7f5] text-teal-600 flex items-center justify-center shadow-inner">
                          <Clock className="w-6 h-6" />
                        </div>
                        <h4 className="font-bold text-sm text-slate-800">Lịch trống hiển thị tại đây</h4>
                        <p className="text-[11px] text-slate-400 font-medium max-w-[240px] leading-relaxed">
                          Chọn ngày khám ở cột bên trái để xem các khung giờ còn trống của bác sĩ.
                        </p>
                      </div>
                    ) : filteredSlots.length === 0 ? (
                      <div className="text-center py-8 px-4 flex flex-col items-center justify-center gap-2">
                        <Clock className="w-7 h-7 text-rose-500" />
                        <h4 className="font-bold text-sm text-rose-500">Hết khung giờ trống</h4>
                        <p className="text-[11px] text-slate-400 font-medium">
                          Bác sĩ không có ca trực hoặc đã hết slot khám trống trong ngày này. Vui lòng chọn ngày khác.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4 h-full flex flex-col justify-start">
                        <h4 className="font-extrabold text-sm text-slate-500 uppercase tracking-wider text-left">Khung giờ còn trống</h4>
                        <div className="grid grid-cols-4 gap-3 mt-4 max-h-64 overflow-y-auto pr-1 flex-1 custom-scrollbar">
                          {filteredSlots.map((slot) => (
                            <button
                              key={slot.time}
                              type="button"
                              disabled={slot.isBooked}
                              onClick={() => setSelectedTime(slot.time)}
                              className={`py-2 text-sm font-semibold rounded-xl text-center border transition-all ${
                                slot.isBooked
                                  ? 'bg-slate-100/50 border-white/40 text-slate-400 cursor-not-allowed line-through'
                                  : selectedTime === slot.time
                                  ? 'bg-[#0d473b] border-[#0d473b] text-white shadow-md shadow-emerald-800/10'
                                  : 'bg-white/50 border-white/60 text-slate-700 hover:border-teal-500 hover:text-teal-600 hover:bg-white/80 cursor-pointer'
                              }`}
                            >
                              {slot.time}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Warning message card */}
                  <div className="bg-[#fffbeb] border border-[#fef08a] rounded-2xl p-4 flex gap-3 text-left shadow-sm shrink-0">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-[11px] font-semibold text-amber-800 leading-relaxed">
                      <span className="font-black">Lưu ý quan trọng:</span> Bệnh nhân cần đến trễ không quá 30 phút so với giờ hẹn, nếu trễ quá lịch khám sẽ tự động hủy trên hệ thống.
                    </div>
                  </div>

                  {/* Bottom details and buttons */}
                  <div className="space-y-4 shrink-0 mt-auto">
                    {errorMessage && (
                      <div className="relative z-50 bg-red-100 text-red-600 p-3 rounded-xl border border-red-200 text-xs font-bold flex items-center gap-2 mb-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{errorMessage}</span>
                      </div>
                    )}
                    <div className="border-t border-slate-200/60 pt-4 flex items-center justify-between gap-4">
                      <div className="text-left">
                        <div className="text-[10px] font-black text-slate-400 tracking-wider">GIÁ DỊCH VỤ DỰ KIẾN</div>
                        <div className="text-[9px] text-slate-400 italic font-medium mt-0.5">(Được xác định theo chỉ định bác sĩ)</div>
                      </div>
                      <div className="flex gap-2.5">
                        <button
                          type="button"
                          onClick={() => setIsAddOpen(false)}
                          className="px-5 py-3 border border-slate-300 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-colors text-xs cursor-pointer bg-[#ffffff]"
                        >
                          Hủy bỏ
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmittingRef.current}
                          className="relative z-50 px-6 py-2 bg-[#0d473b] hover:bg-[#072d24] text-white font-bold rounded-xl text-xs leading-tight transition-all flex flex-col items-center justify-center min-h-[46px] min-w-[100px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-none shadow-sm"
                        >
                          <span>Xác nhận</span>
                          <span>lịch</span>
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              </form>
            </motion.div>
          </div>,
          document.body
  );
}
