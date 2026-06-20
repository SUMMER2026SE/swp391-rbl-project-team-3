import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Search,
  UserCheck,
  Plus,
  User,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { GLASS_INPUT } from '../common/GlassCard';

export default function CheckInPatientModal({
  isOpen,
  onClose,
  appointment,
  onCheckInSuccess,
  showToast,
}) {
  const [step, setStep] = useState('search'); // 'search', 'confirm', 'create'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states for confirming/creating patient profile
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    dob: '',
    gender: 'Nam',
    district: '',
    province: '',
  });

  // Load search query with appointment info when modal opens
  useEffect(() => {
    if (isOpen && appointment) {
      const initialQuery = appointment.phone || appointment.patientName || '';
      setSearchQuery(initialQuery);
      handleSearch(initialQuery);
      setStep('search');
      setSelectedPatient(null);
    }
  }, [isOpen, appointment]);

  const handleSearch = async (queryStr) => {
    if (!queryStr || !queryStr.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const cleanQuery = queryStr.trim();
      const { data, error } = await supabase
        .from('users')
        .select(`
          user_id,
          full_name,
          email,
          phone,
          gender,
          date_of_birth,
          patient_profiles (
            address
          )
        `)
        .eq('role_id', 5)
        .or(`full_name.ilike.%${cleanQuery}%,phone.ilike.%${cleanQuery}%`)
        .limit(8);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (err) {
      console.error('[CheckInModal] Search error:', err);
      showToast?.('Lỗi khi tìm kiếm bệnh nhân.', 'error');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    
    // Parse address into district and province if possible
    const fullAddress = patient.patient_profiles?.address || '';
    const parts = fullAddress.split(',').map((p) => p.trim());
    let district = '';
    let province = '';
    
    if (parts.length >= 2) {
      province = parts[parts.length - 1];
      district = parts.slice(0, parts.length - 1).join(', ');
    } else {
      province = fullAddress;
    }

    setFormData({
      name: patient.full_name || '',
      phone: patient.phone || '',
      dob: patient.date_of_birth || '',
      gender: patient.gender || 'Nam',
      district,
      province,
    });
    setStep('confirm');
  };

  const handleStartCreate = () => {
    // Attempt to guess if search query is a phone number or name
    const isNum = /^[0-9+ ]+$/.test(searchQuery);
    setFormData({
      name: isNum ? (appointment?.patientName || '') : searchQuery,
      phone: isNum ? searchQuery : (appointment?.phone || ''),
      dob: '',
      gender: 'Nam',
      district: '',
      province: '',
    });
    setStep('create');
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      showToast?.('Vui lòng nhập họ và tên.', 'error');
      return false;
    }
    
    const words = formData.name.trim().split(/\s+/);
    if (words.length < 2) {
      showToast?.('Họ và tên phải bao gồm ít nhất 2 từ (Họ và Tên).', 'error');
      return false;
    }

    if (!formData.phone.trim()) {
      showToast?.('Vui lòng nhập số điện thoại.', 'error');
      return false;
    }

    const cleanPhone = formData.phone.replace(/[\s.-]/g, '');
    const phoneRegex = /^(03|05|07|08|09)\d{8}$/;
    if (!phoneRegex.test(cleanPhone)) {
      showToast?.('Số điện thoại không hợp lệ (Phải gồm 10 chữ số di động VN).', 'error');
      return false;
    }

    if (!formData.dob) {
      showToast?.('Vui lòng chọn ngày sinh.', 'error');
      return false;
    }

    const birthDate = new Date(formData.dob);
    if (birthDate > new Date()) {
      showToast?.('Ngày sinh không thể ở tương lai.', 'error');
      return false;
    }

    if (!formData.district.trim() || !formData.province.trim()) {
      showToast?.('Vui lòng nhập đầy đủ Quận/Huyện và Tỉnh/Thành phố.', 'error');
      return false;
    }

    return true;
  };

  const handleConfirmSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);

    try {
      const fullAddress = `${formData.district.trim()}, ${formData.province.trim()}`;
      const cleanPhone = formData.phone.replace(/[\s.-]/g, '');

      // 1. Update user profile in Supabase
      const { error: userErr } = await supabase
        .from('users')
        .update({
          full_name: formData.name.trim(),
          phone: cleanPhone,
          gender: formData.gender,
          date_of_birth: formData.dob,
        })
        .eq('user_id', selectedPatient.user_id);

      if (userErr) throw userErr;

      // 2. Upsert patient profile details
      const { error: profileErr } = await supabase
        .from('patient_profiles')
        .upsert({
          patient_id: selectedPatient.user_id,
          address: fullAddress,
        }, { onConflict: 'patient_id' });

      if (profileErr) throw profileErr;

      // 3. Mark appointment checked-in and associate patient_id, patient_name, patient_phone
      await onCheckInSuccess(
        appointment.aptId,
        selectedPatient.user_id,
        formData.name.trim(),
        cleanPhone
      );

      showToast?.('Check-in thành công!', 'success');
      onClose();
    } catch (err) {
      console.error('[CheckInModal] Confirm error:', err);
      showToast?.(err.message || 'Lỗi khi cập nhật hồ sơ bệnh nhân.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);

    try {
      const fullAddress = `${formData.district.trim()}, ${formData.province.trim()}`;
      const cleanPhone = formData.phone.replace(/[\s.-]/g, '');

      // Check for duplicates in DB
      const { data: existingUser, error: checkErr } = await supabase
        .from('users')
        .select('user_id, full_name, phone')
        .eq('role_id', 5)
        .eq('phone', cleanPhone)
        .maybeSingle();

      if (checkErr) throw checkErr;

      if (existingUser) {
        showToast?.(`Số điện thoại này đã đăng ký cho bệnh nhân: ${existingUser.full_name}`, 'warning');
        // Let's redirect them to confirm step with this existing user
        handleSelectPatient({
          user_id: existingUser.user_id,
          full_name: existingUser.full_name,
          phone: existingUser.phone,
          patient_profiles: { address: fullAddress }
        });
        setIsSubmitting(false);
        return;
      }

      // Create new user profile (JIT record generation)
      const newUserId = window.crypto?.randomUUID ? window.crypto.randomUUID() : 'pat-' + Math.random().toString(36).substring(2, 15);
      
      // 1. Insert into users
      const { error: userErr } = await supabase
        .from('users')
        .insert({
          user_id: newUserId,
          role_id: 5,
          full_name: formData.name.trim(),
          phone: cleanPhone,
          gender: formData.gender,
          date_of_birth: formData.dob,
          status: 'ACTIVE',
        });

      if (userErr) throw userErr;

      // 2. Insert into patient_profiles
      const { error: profileErr } = await supabase
        .from('patient_profiles')
        .insert({
          patient_id: newUserId,
          address: fullAddress,
        });

      if (profileErr) throw profileErr;

      // 3. Update appointment
      await onCheckInSuccess(
        appointment.aptId,
        newUserId,
        formData.name.trim(),
        cleanPhone
      );

      showToast?.('Đã tạo hồ sơ bệnh án và check-in thành công!', 'success');
      onClose();
    } catch (err) {
      console.error('[CheckInModal] Create error:', err);
      showToast?.(err.message || 'Lỗi khi tạo hồ sơ bệnh án mới.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
        />

        {/* Modal content */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25 }}
          className="relative w-[92vw] max-w-xl bg-white/95 border border-white rounded-[2.5rem] shadow-2xl z-[101] p-6 md:p-8 flex flex-col gap-5 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex justify-between items-center pb-3 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-sky-50 rounded-xl text-sky-600">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base md:text-lg text-slate-900 tracking-tight">
                  Tiếp nhận bệnh nhân
                </h3>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                  Lịch hẹn: {appointment?.patientName} · {appointment?.time}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer border-none transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Step 1: Search Bệnh nhân cũ */}
          {step === 'search' && (
            <div className="space-y-4">
              <p className="text-xs font-semibold text-slate-500">
                Nhập số điện thoại hoặc họ tên để tìm kiếm Hồ sơ bệnh án sẵn có nhằm tránh trùng lặp dữ liệu.
              </p>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    handleSearch(e.target.value);
                  }}
                  className={`${GLASS_INPUT} w-full pl-10 pr-4 py-3 text-xs md:text-sm font-semibold`}
                  placeholder="Nhập số điện thoại hoặc tên bệnh nhân..."
                  autoFocus
                />
                <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              </div>

              {/* Search Results */}
              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                {isSearching ? (
                  <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin text-sky-500 mb-2" />
                    <p className="text-xs font-semibold">Đang tìm kiếm hồ sơ...</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((p) => (
                    <div
                      key={p.user_id}
                      onClick={() => handleSelectPatient(p)}
                      className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-sky-50/50 border border-slate-100 hover:border-sky-200 rounded-2xl cursor-pointer transition-all group"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center font-black text-sm shrink-0">
                          {p.full_name?.charAt(0).toUpperCase() || <User className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs md:text-sm text-slate-800 truncate group-hover:text-sky-700">
                            {p.full_name}
                          </h4>
                          <p className="text-[10px] text-slate-500 font-semibold flex items-center gap-1 mt-0.5">
                            <span className="text-slate-700 font-bold">{p.phone}</span>
                            <span>·</span>
                            <span>{p.date_of_birth || 'Chưa cập nhật NS'}</span>
                            <span>·</span>
                            <span className="truncate max-w-[150px]">{p.patient_profiles?.address || 'Chưa cập nhật địa chỉ'}</span>
                          </p>
                        </div>
                      </div>
                      <button
                        className="px-3.5 py-1.5 rounded-lg bg-sky-500 group-hover:bg-sky-600 text-white text-[10px] font-black uppercase tracking-wider border-none pointer-events-none transition-colors"
                      >
                        Chọn
                      </button>
                    </div>
                  ))
                ) : searchQuery.trim() ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-3xl">
                    <AlertTriangle className="w-7 h-7 text-amber-500 mb-2" />
                    <h4 className="font-extrabold text-xs text-slate-800">Không tìm thấy kết quả</h4>
                    <p className="text-[10px] text-slate-500 font-semibold px-6 mt-1">
                      Số điện thoại hoặc tên này chưa được đăng ký trong hệ thống.
                    </p>
                    <button
                      onClick={handleStartCreate}
                      className="mt-3.5 px-4 py-2 bg-gradient-to-r from-teal-600 to-sky-600 text-white text-[11px] font-black rounded-xl hover:shadow-md active:scale-95 transition-all border-none cursor-pointer flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" /> Tạo hồ sơ bệnh án
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-10 text-slate-300">
                    <Search className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                    <p className="text-[11px] font-semibold text-slate-500">Bắt đầu nhập để tìm kiếm bệnh nhân cũ</p>
                  </div>
                )}
              </div>

              {/* Force creation button even if results show, or if search is blank */}
              {(!searchResults.length || searchResults.length > 0) && (
                <div className="pt-2 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={handleStartCreate}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-black rounded-xl transition-all border-none cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Bệnh nhân hoàn toàn mới
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Confirm and Update Patient Profile */}
          {step === 'confirm' && (
            <form onSubmit={handleConfirmSubmit} className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex gap-3 text-emerald-800">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
                <div>
                  <h4 className="font-extrabold text-xs">Tìm thấy Hồ sơ bệnh án trùng khớp</h4>
                  <p className="text-[10px] font-semibold text-emerald-700/90 mt-0.5">
                    Kiểm tra và xác nhận thông tin SĐT / Địa chỉ dưới đây của bệnh nhân trước khi tiếp đón.
                  </p>
                </div>
              </div>

              <div className="space-y-3.5 text-xs font-semibold text-slate-700">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="flex flex-col gap-1">
                    <label className="text-slate-500">Họ và tên</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={`${GLASS_INPUT} px-3 py-2.5`}
                      placeholder="Họ và tên"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-slate-500">Số điện thoại <span className="text-rose-500">*</span></label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className={`${GLASS_INPUT} px-3 py-2.5`}
                      placeholder="09xx xxx xxx"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="flex flex-col gap-1">
                    <label className="text-slate-500">Ngày sinh</label>
                    <input
                      type="date"
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                      className={`${GLASS_INPUT} px-3 py-2.5`}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-slate-500">Giới tính</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className={`${GLASS_INPUT} px-3 py-2.5 bg-white`}
                    >
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="flex flex-col gap-1">
                    <label className="text-slate-500">Quận / Huyện <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      value={formData.district}
                      onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                      className={`${GLASS_INPUT} px-3 py-2.5`}
                      placeholder="Quận 1, Huyện Hóc Môn..."
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-slate-500">Tỉnh / Thành phố <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      value={formData.province}
                      onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                      className={`${GLASS_INPUT} px-3 py-2.5`}
                      placeholder="TP. Hồ Chí Minh, Hà Nội..."
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep('search')}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 active:scale-95 transition-all cursor-pointer bg-white"
                >
                  Quay lại
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold hover:shadow-lg hover:shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer border-none disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4" /> Xác nhận & Check-in
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Tạo hồ sơ bệnh án mới */}
          {step === 'create' && (
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="bg-sky-50 border border-sky-100 rounded-2xl p-4 flex gap-3 text-sky-800">
                <Plus className="w-5 h-5 shrink-0 text-sky-600" />
                <div>
                  <h4 className="font-extrabold text-xs">Tạo hồ sơ bệnh án mới</h4>
                  <p className="text-[10px] font-semibold text-sky-700/90 mt-0.5">
                    Bệnh nhân chưa có hồ sơ. Điền thông tin cơ bản để lưu trữ hành chính trước khi check-in.
                  </p>
                </div>
              </div>

              <div className="space-y-3.5 text-xs font-semibold text-slate-700">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="flex flex-col gap-1">
                    <label className="text-slate-500">Họ và tên <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={`${GLASS_INPUT} px-3 py-2.5`}
                      placeholder="Nguyễn Văn A"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-slate-500">Số điện thoại (ID đăng nhập / tra cứu) <span className="text-rose-500">*</span></label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className={`${GLASS_INPUT} px-3 py-2.5`}
                      placeholder="09xx xxx xxx"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="flex flex-col gap-1">
                    <label className="text-slate-500">Ngày sinh <span className="text-rose-500">*</span></label>
                    <input
                      type="date"
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                      className={`${GLASS_INPUT} px-3 py-2.5`}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-slate-500">Giới tính <span className="text-rose-500">*</span></label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className={`${GLASS_INPUT} px-3 py-2.5 bg-white`}
                    >
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="flex flex-col gap-1">
                    <label className="text-slate-500">Quận / Huyện <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      value={formData.district}
                      onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                      className={`${GLASS_INPUT} px-3 py-2.5`}
                      placeholder="Quận 1, Huyện Hóc Môn..."
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-slate-500">Tỉnh / Thành phố <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      value={formData.province}
                      onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                      className={`${GLASS_INPUT} px-3 py-2.5`}
                      placeholder="TP. Hồ Chí Minh, Hà Nội..."
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep('search')}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 active:scale-95 transition-all cursor-pointer bg-white"
                >
                  Quay lại
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-sky-600 text-white font-bold hover:shadow-lg hover:shadow-teal-500/20 active:scale-95 transition-all cursor-pointer border-none disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-4 h-4" /> Tạo hồ sơ & Check-in
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
