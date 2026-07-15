import { useState, useRef, useMemo, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { DoctorScheduleModel } from '../models/DoctorScheduleModel';

// Blank walk-in patient record — reset every time the modal (re)opens.
const BLANK_NEW_APT = {
  patientName: '',
  phone: '',
  email: '',
  dob: '1990-01-01',
  gender: 'Nam',
  district: '',
  province: '',
  existingPatientId: null,
  service: 'Khám Da Liễu Tổng Quát',
  notes: '',
};

/**
 * useWalkInBooking — the entire walk-in booking state machine, lifted out of
 * ReceptionistDashboard (M1/M4). Owns all form state, the doctor-shift fetch,
 * async email lookup, slot-availability derivation and the submit flow. The
 * dashboard just calls it and spreads the result onto <WalkInBookingModal/>.
 *
 * Dependencies are injected (not re-derived) so the parent keeps a SINGLE
 * appointment-controller instance — the transactional booking path
 * (validateBooking → bookAppointment → book_guest_appointment RPC) is unchanged.
 *
 * @param {object}   deps
 * @param {Array}    deps.doctors            public doctor list (from useDoctors)
 * @param {string}   deps.currentAnchorId    guest anchor uuid (reserved)
 * @param {Function} deps.getAvailableSlots  controller slot generator
 * @param {Function} deps.isSlotBooked       controller occupancy check
 * @param {Function} deps.validateBooking    controller pre-book validation
 * @param {Function} deps.bookAppointment    controller commit (RPC-backed)
 * @param {Function} deps.addPatient         legacy local patient registry add
 * @param {Function} deps.showToast          parent toast (success/info/error)
 */
export function useWalkInBooking({
  doctors = [],
  currentAnchorId,
  getAvailableSlots,
  isSlotBooked,
  validateBooking,
  bookAppointment,
  addPatient,
  showToast,
}) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [servicesList, setServicesList] = useState([]);
  const [newApt, setNewApt] = useState(BLANK_NEW_APT);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isExistingPatient, setIsExistingPatient] = useState(false);

  const minDate = useMemo(() => {
    const todayDate = new Date();
    return `${todayDate.getFullYear()}-${(todayDate.getMonth() + 1).toString().padStart(2, '0')}-${todayDate.getDate().toString().padStart(2, '0')}`;
  }, []);

  const [selectedDate, setSelectedDate] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [step, setStep] = useState('form'); // 'form', 'payment', 'success'
  const isSubmittingRef = useRef(false);
  const [paymentPayload, setPaymentPayload] = useState(null);
  const [adminSchedules, setAdminSchedules] = useState([]);

  // Reset the whole form + refetch doctor shifts each time the modal opens.
  useEffect(() => {
    if (isAddOpen) {
      setSelectedDate('');
      setSelectedDoctor('');
      setSelectedTime('');
      setErrorMessage('');
      setStep('form');
      setPaymentPayload(null);

      const saved = localStorage.getItem('admin-services');
      let parsed = [];
      if (saved) {
        try {
          const raw = JSON.parse(saved);
          parsed = (Array.isArray(raw) ? raw : [])
            .filter((s) => s.status === 'Hoạt động')
            .map((s) => ({ id: s.id, name: s.name }));
        } catch { parsed = []; }
      }
      setServicesList(parsed);

      setNewApt({
        ...BLANK_NEW_APT,
        service: parsed[0]?.name || 'Khám Da Liễu Tổng Quát',
      });
      setIsExistingPatient(false);
      setIsCheckingEmail(false);

      // Fetch doctor shift schedules
      DoctorScheduleModel.getAllShifts().then((data) => setAdminSchedules(data || []));
    }
  }, [isAddOpen]);

  // ─── Working Doctors for the selected date ───
  const workingDocs = useMemo(() => {
    if (!selectedDate) return [];
    return (doctors || []).filter((doc) => {
      return (adminSchedules || []).some((s) =>
        String(s.doctor_id || s.doctorId) === String(doc.user_id || doc.id) &&
        (s.work_date === selectedDate || s.date === selectedDate) &&
        (s.status === 'Đã xác nhận' || s.status === 'Đã phân công')
      );
    });
  }, [selectedDate, doctors, adminSchedules]);

  const handleEmailBlur = async () => {
    const emailVal = newApt.email.trim().toLowerCase();
    if (!emailVal || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      return;
    }
    setIsCheckingEmail(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          user_id,
          full_name,
          phone,
          email,
          date_of_birth,
          gender,
          patient_profiles (
            address
          )
        `)
        .eq('role_id', 5)
        .eq('email', emailVal)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setIsExistingPatient(true);
        const fullAddress = data.patient_profiles?.address || '';
        const parts = fullAddress.split(',').map((p) => p.trim());
        let district = '';
        let province = '';
        if (parts.length >= 2) {
          province = parts[parts.length - 1];
          district = parts.slice(0, parts.length - 1).join(', ');
        } else {
          province = fullAddress;
        }

        setNewApt((prev) => ({
          ...prev,
          patientName: data.full_name || prev.patientName,
          phone: data.phone || prev.phone,
          dob: data.date_of_birth || prev.dob,
          gender: data.gender || prev.gender,
          district: district || prev.district,
          province: province || prev.province,
          existingPatientId: data.user_id,
        }));
        showToast('Tìm thấy tài khoản đã đăng ký! Thông tin hồ sơ được tự động điền.', 'info');
      } else {
        setIsExistingPatient(false);
        setNewApt((prev) => ({ ...prev, existingPatientId: null }));
      }
    } catch (err) {
      console.error('Error checking email:', err);
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const handleSubmitBooking = async (e) => {
    if (e) e.preventDefault();

    const nameTrim = newApt.patientName.trim();
    const phoneClean = newApt.phone.replace(/[\s.-]/g, '');
    const emailTrim = newApt.email.trim().toLowerCase();

    if (!selectedDate) {
      alert('Lỗi: Chưa chọn ngày khám!');
      setErrorMessage('Vui lòng chọn ngày khám.');
      return;
    }

    if (!selectedTime) {
      alert('Lỗi: Chưa chọn khung giờ khám!');
      setErrorMessage('Vui lòng chọn khung giờ khám.');
      return;
    }

    if (!emailTrim || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      alert('Lỗi: Email không hợp lệ! ' + (emailTrim || '(trống)'));
      setErrorMessage('Vui lòng nhập Email (Gmail) hợp lệ.');
      return;
    }

    if (!isExistingPatient) {
      if (nameTrim.length < 4) {
        alert('Lỗi: Họ và tên ngắn hơn 4 ký tự! ' + nameTrim);
        setErrorMessage('Họ và tên phải từ 4 ký tự trở lên.');
        return;
      }
      const nameRegex = /^[a-zA-Z\sàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]+$/;
      if (!nameRegex.test(nameTrim)) {
        alert('Lỗi: Họ và tên chứa ký tự không hợp lệ! ' + nameTrim);
        setErrorMessage('Họ và tên chỉ được chứa chữ cái tiếng Việt và khoảng trắng.');
        return;
      }
      if (nameTrim.split(/\s+/).length < 2) {
        alert('Lỗi: Họ và tên phải có ít nhất 2 từ! ' + nameTrim);
        setErrorMessage('Họ và tên phải bao gồm ít nhất Họ và Tên (2 từ).');
        return;
      }

      const phoneRegex = /^(03|05|07|08|09)\d{8}$/;
      if (!phoneRegex.test(phoneClean)) {
        alert('Lỗi: Số điện thoại không hợp lệ! ' + phoneClean);
        setErrorMessage('Số điện thoại không hợp lệ (gồm 10 chữ số, bắt đầu bằng 03, 05, 07, 08, 09).');
        return;
      }

      if (!newApt.dob) {
        alert('Lỗi: Chưa chọn ngày sinh!');
        setErrorMessage('Vui lòng chọn ngày sinh.');
        return;
      }
      const birthDate = new Date(newApt.dob);
      if (birthDate > new Date()) {
        alert('Lỗi: Ngày sinh ở tương lai! ' + newApt.dob);
        setErrorMessage('Ngày sinh không thể ở tương lai.');
        return;
      }

      if (!newApt.district.trim() || !newApt.province.trim()) {
        alert('Lỗi: Chưa nhập Quận/Huyện hoặc Tỉnh/Thành phố!');
        setErrorMessage('Vui lòng nhập Quận/Huyện và Tỉnh/Thành phố.');
        return;
      }
    }

    // Determine final doctor ID
    const finalDocId = selectedDoctor || (workingDocs.find((doc) => !isSlotBooked(doc.user_id || doc.id, selectedDate, selectedTime))?.user_id) || (workingDocs.find((doc) => !isSlotBooked(doc.user_id || doc.id, selectedDate, selectedTime))?.id);
    if (!finalDocId) {
      alert('Lỗi: Không tìm thấy bác sĩ khả dụng cho ngày và giờ đã chọn!');
      setErrorMessage('Không tìm thấy bác sĩ khả dụng cho ngày và giờ đã chọn.');
      return;
    }

    const finalDocData = finalDocId ? doctors.find((d) => String(d.user_id || d.id) === String(finalDocId)) : null;
    const finalFeeVal = finalDocData?.consultationFee || '300,000 VNĐ';

    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setErrorMessage('');

    if (!isExistingPatient) {
      // Check if phone already registered in public users
      const { data: phoneUser, error: phoneCheckErr } = await supabase
        .from('users')
        .select('user_id, full_name, email')
        .eq('role_id', 5)
        .eq('phone', phoneClean)
        .maybeSingle();

      if (phoneCheckErr) {
        console.error('Phone check error:', phoneCheckErr);
      }

      if (phoneUser) {
        alert('Lỗi: Số điện thoại đã được đăng ký cho bệnh nhân: ' + phoneUser.full_name);
        setErrorMessage(`Số điện thoại này đã được đăng ký cho bệnh nhân: ${phoneUser.full_name} (${phoneUser.email}).`);
        isSubmittingRef.current = false;
        return;
      }
    }

    let patientId = newApt.existingPatientId;

    if (!isExistingPatient) {
      try {
        // Create new user profile via RPC (SECURITY DEFINER bypasses RLS on users table)
        const newUserId = window.crypto?.randomUUID ? window.crypto.randomUUID() : 'pat-' + Math.random().toString(36).substring(2, 15);
        const fullAddress = `${newApt.district.trim()}, ${newApt.province.trim()}`;

        const { data: rpcResult, error: rpcErr } = await supabase.rpc('create_walk_in_patient', {
          p_user_id:   newUserId,
          p_full_name: nameTrim,
          p_phone:     phoneClean,
          p_email:     emailTrim,
          p_gender:    newApt.gender,
          p_dob:       newApt.dob,
          p_address:   fullAddress,
        });

        if (rpcErr) throw rpcErr;
        if (rpcResult && rpcResult.success === false) {
          throw new Error(rpcResult.error || 'Lỗi tạo hồ sơ bệnh nhân.');
        }

        // Also add patient locally for legacy compatibility
        try {
          addPatient({
            id: newUserId,
            fullName: nameTrim,
            phone: newApt.phone,
            dob: newApt.dob,
            email: emailTrim,
            gender: newApt.gender,
            address: fullAddress,
            medicalHistory: [],
          });
        } catch (e) {
          console.warn('Legacy local addPatient warning:', e);
        }

        patientId = newUserId;
      } catch (err) {
        alert('Lỗi tạo hồ sơ bệnh nhân mới: ' + err.message);
        setErrorMessage(err.message || 'Lỗi khi tạo hồ sơ bệnh nhân mới.');
        isSubmittingRef.current = false;
        return;
      }
    }

    const bookingPayload = {
      doctorId: finalDocId,
      patientId: patientId,
      patientName: nameTrim,
      patientPhone: phoneClean,
      patientEmail: emailTrim,
      date: selectedDate,
      time: selectedTime,
      service: newApt.service || 'Khám Da Liễu Tổng Quát',
      fee: finalFeeVal,
      originalFee: finalFeeVal,
      notes: newApt.notes || 'Khám trực tiếp tại quầy',
      bookingFee: 50000,
      paymentStatus: 'Đã thanh toán',
      status: 'Đã xác nhận',
    };

    // Validate booking
    const validation = await validateBooking(bookingPayload);
    if (!validation.valid) {
      alert('Lỗi validateBooking từ controller: ' + validation.error);
      setErrorMessage(validation.error);
      isSubmittingRef.current = false;
      return;
    }

    try {
      const result = await bookAppointment(bookingPayload);
      if (result.success) {
        showToast('Đặt lịch và tạo hồ sơ bệnh án thành công!', 'success');
        setTimeout(() => {
          isSubmittingRef.current = false;
          setIsAddOpen(false);
        }, 1500);
      } else {
        alert('Lỗi bookAppointment từ controller: ' + result.error);
        isSubmittingRef.current = false;
        setErrorMessage(result.error || 'Có lỗi xảy ra khi xác nhận đặt lịch.');
      }
    } catch (err) {
      alert('Lỗi catch bookAppointment: ' + err.message);
      console.error('Booking submit error:', err);
      setErrorMessage(err.message || 'Có lỗi xảy ra khi đặt lịch.');
      isSubmittingRef.current = false;
    }
  };

  // ─── Filtered Slots (synchronous derivation) ───
  const filteredSlots = (() => {
    const todayDate = new Date();
    const localMinDate = `${todayDate.getFullYear()}-${(todayDate.getMonth() + 1).toString().padStart(2, '0')}-${todayDate.getDate().toString().padStart(2, '0')}`;

    const lockedListStr = localStorage.getItem('dermasmart_locked_slots') || '[]';
    let lockedList = [];
    try { lockedList = JSON.parse(lockedListStr); } catch (e) {}
    const activeLocks = lockedList.filter((l) => l.lockedUntil > Date.now());

    const isSlotActuallyBooked = (dId, dDate, dTime) => {
      // Past check
      if (dDate < localMinDate) return true;
      if (dDate === localMinDate) {
        const now = new Date();
        const currentMins = now.getHours() * 60 + now.getMinutes();
        const [h, m] = dTime.split(':').map(Number);
        if ((h * 60 + m) <= currentMins) return true;
      }

      // Check bookings
      const booked = isSlotBooked(dId, dDate, dTime);
      // Check locks
      const locked = activeLocks.some((l) => String(l.doctorId) === String(dId) && l.date === dDate && l.time === dTime);

      // Check if it fits the doctor's shift
      let outsideShift = true;
      const docShifts = (adminSchedules || []).filter((s) => String(s.doctor_id || s.doctorId) === String(dId) && (s.work_date === dDate || s.date === dDate));
      if (docShifts.length > 0) {
        const fitsAnyShift = docShifts.some((shift) => {
          const shiftStart = (shift.start_time || shift.startTime || '').slice(0, 5);
          const shiftEnd = (shift.end_time || shift.endTime || '').slice(0, 5);
          return dTime >= shiftStart && dTime < shiftEnd;
        });
        if (fitsAnyShift) {
          outsideShift = false;
        }
      }

      return booked || locked || outsideShift;
    };

    let slotsToDisplay = [];
    if (selectedDoctor) {
      const slots = getAvailableSlots(selectedDoctor, selectedDate, adminSchedules);
      slotsToDisplay = (slots || []).map((s) => ({
        ...s,
        isBooked: isSlotActuallyBooked(selectedDoctor, selectedDate, s.time),
      }));
    } else {
      const allSlotsMap = new Map();
      workingDocs.forEach((doc) => {
        const docId = doc.user_id || doc.id;
        const docSlots = getAvailableSlots(docId, selectedDate, adminSchedules);
        (docSlots || []).forEach((s) => {
          if (!allSlotsMap.has(s.time)) {
            allSlotsMap.set(s.time, { time: s.time, isBooked: true });
          }
          if (!isSlotActuallyBooked(docId, selectedDate, s.time)) {
            allSlotsMap.get(s.time).isBooked = false;
          }
        });
      });
      slotsToDisplay = Array.from(allSlotsMap.values());
      slotsToDisplay.sort((a, b) => a.time.localeCompare(b.time));
    }

    return slotsToDisplay.filter((slot) => {
      const t = slot.time.trim();
      return t !== '11:00' && t !== '11:30' && t !== '11:00 AM' && t !== '11:30 AM';
    });
  })();

  return {
    // ── Props consumed by <WalkInBookingModal {...walkInBooking} /> ──
    isAddOpen,
    setIsAddOpen,
    handleSubmitBooking,
    errorMessage,
    selectedDate,
    setSelectedDate,
    selectedTime,
    setSelectedTime,
    minDate,
    selectedDoctor,
    setSelectedDoctor,
    doctors,
    newApt,
    setNewApt,
    handleEmailBlur,
    isExistingPatient,
    isCheckingEmail,
    filteredSlots,
    isSubmittingRef,
    // ── Toggle controls for the parent dashboard ──
    open: () => setIsAddOpen(true),
    close: () => setIsAddOpen(false),
  };
}
