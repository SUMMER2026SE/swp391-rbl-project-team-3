// Receptionist portal — refactored to the shared "Liquid Glass" baseline.
// Scope is strictly front-desk: dispatch queue, cashier desk, and patient live
// chat. Clinical surfaces (medical records, vitals, diagnoses, prescriptions)
// have been pruned — receptionists do not practice medicine.
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GLASS_INPUT } from '../components/common/GlassCard';
import GlassSelect from '../components/common/GlassSelect';
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useSpring,
  useMotionTemplate,
} from 'framer-motion';
import {
  LayoutDashboard,
  ClipboardList,
  CreditCard,
  MessageSquare,
  Star,
  HelpCircle,
  LogOut,
  Bell,
  Settings,
  Plus,
  Users,
  Wallet,
  CalendarClock,
  CheckSquare,
  Inbox,
  Clock,
  UserCheck,
  X,
  User,
  Sparkles,
  AlertCircle,
  ArrowRight,
  PanelLeftClose,
  PanelLeftOpen,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { useAppointmentController } from '../controllers/useAppointmentController';
import { useMedicalRecordController } from '../controllers/useMedicalRecordController';
import { useVoucherController } from '../controllers/useVoucherController';
import { useDoctors } from '../hooks/useDoctors';
import { AppointmentModel } from '../models/AppointmentModel';
import { NotificationModel } from '../models/NotificationModel';
import { DoctorScheduleModel } from '../models/DoctorScheduleModel';
import { supabase } from '../supabaseClient';
import { ReceptionistChatModel, subscribeToMessages, unsubscribe } from '../models/ChatModel';
import LiquidSidebarMenu from '../components/ui/LiquidSidebarMenu';
import LiveChatDrawer from '../components/Receptionist/LiveChatDrawer';
import ReceptionistChatTab from '../components/Receptionist/ReceptionistChatTab';
import ReceptionistFeedbackView from '../components/Receptionist/ReceptionistFeedbackView';
import TodayQueueBoard from '../components/Receptionist/TodayQueueBoard';
import BillingCheckout from '../components/Receptionist/BillingCheckout';
import CheckInPatientModal from '../components/Receptionist/CheckInPatientModal';
import GlassDatePicker from '../components/common/GlassDatePicker';
import { normalizeApt, APT_STATUS, TODAY_STR } from '../components/Receptionist/receptionistData';
import logo from '../assets/logo.png';

const navItems = [
  { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
  { id: 'queue', label: 'Bàn Điều Phối', icon: ClipboardList },
  { id: 'billing', label: 'Quầy Thu Ngân', icon: CreditCard },
  { id: 'chat', label: 'Chăm Sóc Khách Hàng', icon: MessageSquare },
  { id: 'feedback', label: 'Đánh giá', icon: Star },
];

const PAGE_TITLES = {
  overview: 'Tổng quan',
  queue: 'Bàn Điều Phối',
  billing: 'Quầy Thu Ngân',
  chat: 'Chăm Sóc Khách Hàng',
  feedback: 'Đánh giá bệnh nhân',
};

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', damping: 25, stiffness: 110 } },
};
const stagger = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };

export default function ReceptionistDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { doctors } = useDoctors();

  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [toast, setToast] = useState(null);
  const [selectedCheckInApt, setSelectedCheckInApt] = useState(null);

  const {
    appointments,
    payments,
    bookAppointment,
    getAvailableSlots,
    isSlotBooked,
    lockSlot,
    holdSlot,
    validateBooking,
    refreshState,
  } = useAppointmentController();

  // Patient registry is front-desk (names/contact only); clinical records are gone.
  const { patients, addPatient } = useMedicalRecordController();

  const {
    vouchers,
    getAutoApplicable,
    incrementUsage,
  } = useVoucherController();

  const receptionistId = user?.id || 'staff-01';

  // ─── Realtime: keep the dispatch queue / KPIs live ────────────────────────
  // Replaces event-driven-only refreshes. Any INSERT (new booking), UPDATE
  // (check-in, approve, examine, pay) or DELETE on `appointments` re-pulls state
  // so the Kanban reflects another actor's action the instant it happens.
  useEffect(() => {
    const channel = supabase
      .channel('receptionist-appointments')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        () => { refreshState(); }
      )
      .subscribe();
    // CRITICAL: drop the channel on unmount to avoid leaking subscriptions.
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshState]);

  // ─── Toast ──────────────────────────────────────────────────────────────
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3200);
  };

  // ─── Notifications ────────────────────────────────────────────────────────
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const myNotifications = useMemo(
    () =>
      (notifications || []).filter(
        (n) =>
          n.recipientRole === 'RECEPTIONIST' &&
          (n.recipientId === receptionistId || n.recipientId === 'all')
      ),
    [notifications, receptionistId]
  );
  const unreadCount = myNotifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await NotificationModel.getAll();
        setNotifications(Array.isArray(res) ? res : []);
      } catch {
        setNotifications([]);
      }
    };
    fetchNotifications();
    window.addEventListener('notifications-updated', fetchNotifications);
    return () => window.removeEventListener('notifications-updated', fetchNotifications);
  }, []);

  // ─── Live chat drawer + messages ──────────────────────────────────────────
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeChatPatient, setActiveChatPatient] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [hasUnreadChat, setHasUnreadChat] = useState(false);

  useEffect(() => {
    if (activeTab === 'chat' || isChatOpen) {
      setHasUnreadChat(false);
    }
  }, [activeTab, isChatOpen]);

  useEffect(() => {
    let active = true;
    const fetchMsgs = async () => {
      try {
        const msgs = await ReceptionistChatModel.getAllMessages();
        if (active) setChatMessages(msgs || []);
      } catch (err) {
        console.error('Error fetching receptionist messages:', err);
      }
    };
    fetchMsgs();

    // Realtime: surface the unread badge the instant a patient message lands
    // while the receptionist is on another tab / drawer closed.
    const channel = subscribeToMessages({
      onEvent: (type, msg) => {
        if (!active) return;
        if (type === 'INSERT') {
          setChatMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
          if (msg.senderRole === 'PATIENT' && activeTab !== 'chat' && !isChatOpen) {
            setHasUnreadChat(true);
          }
        } else {
          setChatMessages((prev) => prev.map((m) => (m.id === msg.id ? msg : m)));
        }
      },
    });

    // Safety net for the localStorage-fallback path.
    const interval = setInterval(fetchMsgs, 5000);
    return () => {
      active = false;
      clearInterval(interval);
      unsubscribe(channel);
    };
  }, [activeTab, isChatOpen]);

  const handleOpenChat = (patientId, patientName) => {
    const found = (patients || []).find((p) => p.id === patientId);
    setActiveChatPatient(
      found || {
        id: patientId,
        fullName: patientName || 'Bệnh nhân',
        phone: 'Chưa có',
        email: 'Chưa có',
        avatar: `https://i.pravatar.cc/150?u=${patientId}`,
        medicalHistory: [],
      }
    );
    setIsChatOpen(true);
  };

  const handleSendMessage = async (patientId, text) => {
    try {
      const newMsg = await ReceptionistChatModel.addMessage({
        senderId: receptionistId,
        senderName: user?.name || 'Lễ tân',
        senderRole: 'RECEPTIONIST',
        text,
        mode: 'Live',
        patientId,
      });
      if (newMsg) setChatMessages((prev) => [...prev, newMsg]);
    } catch (err) {
      console.error('Failed to send message:', err);
      showToast('Không gửi được tin nhắn.', 'error');
    }
  };

  // ─── Queue / appointment actions (awaited → reliable refresh) ─────────────
  const handleQueueStatusChange = async (aptId, status, extraFields = {}) => {
    await AppointmentModel.updateAppointment(aptId, { status, ...extraFields });
    await refreshState();
  };

  const handleCheckInSuccess = async (aptId, patientId, patientName, patientPhone) => {
    await handleQueueStatusChange(aptId, APT_STATUS.CHECKED_IN, {
      patient_id: patientId,
      patient_name: patientName,
      patient_phone: patientPhone
    });
  };

  const handleApproveRequest = async (aptId) => {
    const apt = (appointments || []).find((a) => (a.appointment_id ?? a.id) === aptId);
    await AppointmentModel.updateAppointment(aptId, { status: APT_STATUS.CONFIRMED });
    if (apt) {
      try {
        NotificationModel.sendNotification(
          'PATIENT',
          apt.patient_id,
          'Lịch hẹn đã được xác nhận',
          `Lịch hẹn ${apt.service || apt.service_name || ''} của bạn đã được lễ tân xác nhận. Vui lòng đến đúng giờ.`
        );
      } catch { /* non-fatal */ }
    }
    await refreshState();
  };

  const handleDeclineRequest = async (aptId) => {
    await AppointmentModel.updateAppointment(aptId, { status: APT_STATUS.CANCELLED });
    await refreshState();
  };

  // Cross-module jump: Queue "Thu ngân" → Billing pre-selected to that patient.
  const [billingFocusPatientId, setBillingFocusPatientId] = useState(null);
  const goBilling = async (apt) => {
    // Mark examined-but-unpaid so it lands in the cashier "Chờ thu" list, then jump.
    if (apt?.status !== APT_STATUS.EXAMINED && apt?.status !== APT_STATUS.PAID) {
      await handleQueueStatusChange(apt.aptId, APT_STATUS.EXAMINED);
    }
    setBillingFocusPatientId(apt?.patientId || null);
    setActiveTab('billing');
  };

  // ─── Manual walk-in appointment ───────────────────────────────────────────
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [servicesList, setServicesList] = useState([]);
  const [newApt, setNewApt] = useState({
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
  });
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isExistingPatient, setIsExistingPatient] = useState(false);

  // States mirroring BookAppointmentForm.jsx for walk-in flow
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
        patientName: '',
        phone: '',
        email: '',
        dob: '1990-01-01',
        gender: 'Nam',
        district: '',
        province: '',
        existingPatientId: null,
        service: parsed[0]?.name || 'Khám Da Liễu Tổng Quát',
        notes: '',
      });
      setIsExistingPatient(false);
      setIsCheckingEmail(false);

      // Fetch doctor shift schedules
      DoctorScheduleModel.getAllShifts().then(data => setAdminSchedules(data || []));
    }
  }, [isAddOpen]);

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

        setNewApt(prev => ({
          ...prev,
          patientName: data.full_name || prev.patientName,
          phone: data.phone || prev.phone,
          dob: data.date_of_birth || prev.dob,
          gender: data.gender || prev.gender,
          district: district || prev.district,
          province: province || prev.province,
          existingPatientId: data.user_id
        }));
        showToast('Tìm thấy tài khoản đã đăng ký! Thông tin hồ sơ được tự động điền.', 'info');
      } else {
        setIsExistingPatient(false);
        setNewApt(prev => ({ ...prev, existingPatientId: null }));
      }
    } catch (err) {
      console.error("Error checking email:", err);
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const handleSubmitBooking = async (e) => {
    if (e) e.preventDefault();
    console.log('--- SUBMIT TRIGGERED ---', {
      selectedDate,
      selectedDoctor,
      selectedTime,
      errorMessage,
      isExistingPatient,
      isCheckingEmail,
      newApt
    });
    
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
    const finalDocId = selectedDoctor || (workingDocs.find(doc => !isSlotBooked(doc.user_id || doc.id, selectedDate, selectedTime))?.user_id) || (workingDocs.find(doc => !isSlotBooked(doc.user_id || doc.id, selectedDate, selectedTime))?.id);
    if (!finalDocId) {
      alert('Lỗi: Không tìm thấy bác sĩ khả dụng cho ngày và giờ đã chọn!');
      setErrorMessage('Không tìm thấy bác sĩ khả dụng cho ngày và giờ đã chọn.');
      return;
    }

    const finalDocData = finalDocId ? doctors.find(d => String(d.user_id || d.id) === String(finalDocId)) : null;
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
        console.error("Phone check error:", phoneCheckErr);
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
        // Create new user profile (JIT record generation)
        const newUserId = window.crypto?.randomUUID ? window.crypto.randomUUID() : 'pat-' + Math.random().toString(36).substring(2, 15);
        
        // 1. Insert into users
        const { error: userErr } = await supabase
          .from('users')
          .insert({
            user_id: newUserId,
            role_id: 5,
            full_name: nameTrim,
            phone: phoneClean,
            email: emailTrim,
            gender: newApt.gender,
            date_of_birth: newApt.dob,
            status: 'ACTIVE',
          });

        if (userErr) throw userErr;

        // 2. Insert into patient_profiles
        const fullAddress = `${newApt.district.trim()}, ${newApt.province.trim()}`;
        const { error: profileErr } = await supabase
          .from('patient_profiles')
          .insert({
            patient_id: newUserId,
            address: fullAddress,
          });

        if (profileErr) throw profileErr;

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
          console.warn("Legacy local addPatient warning:", e);
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
      status: 'Đã xác nhận'
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
      console.error("Booking submit error:", err);
      setErrorMessage(err.message || 'Có lỗi xảy ra khi đặt lịch.');
      isSubmittingRef.current = false;
    }
  };

  // Helper functions for online-synced pricing layout
  function parsePriceToNumber(priceStr) {
    if (!priceStr) return 0;
    if (typeof priceStr === 'number') return priceStr;
    return parseInt(priceStr.replace(/[^0-9]/g, ''), 10) || 0;
  }

  function formatVND(n) {
    return n.toLocaleString('vi-VN') + ' VNĐ';
  }

  function PriceSummary({ originalAmount }) {
    if (!originalAmount) {
      return (
        <div className="bg-white/30 border border-white/40 rounded-2xl p-3.5 space-y-2 text-left">
          <div className="flex justify-between text-xs font-semibold text-slate-600">
            <span>Giá dịch vụ</span>
            <span className="italic text-slate-400 text-[11px]">(Được xác định theo bác sĩ)</span>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white/30 border border-white/40 rounded-2xl p-3.5 space-y-2 text-left">
        <div className="flex justify-between text-xs font-semibold text-slate-600">
          <span>Giá dịch vụ</span>
          <span>{formatVND(originalAmount)}</span>
        </div>
      </div>
    );
  }

  // ─── Working Doctors for selected date ───
  const workingDocs = useMemo(() => {
    if (!selectedDate) return [];
    return (doctors || []).filter(doc => {
      return (adminSchedules || []).some(s => 
        String(s.doctor_id || s.doctorId) === String(doc.user_id || doc.id) && 
        (s.work_date === selectedDate || s.date === selectedDate) && 
        (s.status === 'Đã xác nhận' || s.status === 'Đã phân công')
      );
    });
  }, [selectedDate, doctors, adminSchedules]);

  // ─── Filtered Slots ───
  const filteredSlots = (() => {
    const todayDate = new Date();
    const minDate = `${todayDate.getFullYear()}-${(todayDate.getMonth() + 1).toString().padStart(2, '0')}-${todayDate.getDate().toString().padStart(2, '0')}`;

    const lockedListStr = localStorage.getItem('dermasmart_locked_slots') || '[]';
    let lockedList = [];
    try { lockedList = JSON.parse(lockedListStr); } catch (e) {}
    const activeLocks = lockedList.filter(l => l.lockedUntil > Date.now());

    const isSlotActuallyBooked = (dId, dDate, dTime) => {
      // Past check
      if (dDate < minDate) return true;
      if (dDate === minDate) {
        const now = new Date();
        const currentMins = now.getHours() * 60 + now.getMinutes();
        const [h, m] = dTime.split(':').map(Number);
        if ((h * 60 + m) <= currentMins) return true;
      }

      // Check bookings
      const booked = isSlotBooked(dId, dDate, dTime);
      // Check locks
      const locked = activeLocks.some(l => String(l.doctorId) === String(dId) && l.date === dDate && l.time === dTime);
      
      // Check if it fits the doctor's shift
      let outsideShift = true;
      const docShift = (adminSchedules || []).find(s => String(s.doctor_id || s.doctorId) === String(dId) && (s.work_date === dDate || s.date === dDate));
      if (docShift) {
         const shiftStart = (docShift.start_time || docShift.startTime || '').slice(0, 5);
         const shiftEnd = (docShift.end_time || docShift.endTime || '').slice(0, 5);
         if (dTime >= shiftStart && dTime < shiftEnd) {
             outsideShift = false;
         }
      }

      return booked || locked || outsideShift;
    };

    let slotsToDisplay = [];
    if (selectedDoctor) {
      const slots = getAvailableSlots(selectedDoctor, selectedDate, adminSchedules);
      slotsToDisplay = (slots || []).map(s => ({
        ...s,
        isBooked: isSlotActuallyBooked(selectedDoctor, selectedDate, s.time)
      }));
    } else {
      const allSlotsMap = new Map();
      workingDocs.forEach(doc => {
         const docId = doc.user_id || doc.id;
         const docSlots = getAvailableSlots(docId, selectedDate, adminSchedules);
         (docSlots || []).forEach(s => {
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
    
    return slotsToDisplay.filter(slot => {
      const t = slot.time.trim();
      return t !== '11:00' && t !== '11:30' && t !== '11:00 AM' && t !== '11:30 AM';
    });
  })();

  const finalDoctorId = selectedDoctor || (workingDocs.find(doc => !isSlotBooked(doc.user_id || doc.id, selectedDate, selectedTime))?.user_id) || (workingDocs.find(doc => !isSlotBooked(doc.user_id || doc.id, selectedDate, selectedTime))?.id);
  const finalDoctorData = finalDoctorId ? doctors.find(d => String(d.user_id || d.id) === String(finalDoctorId)) : null;

  const originalAmount = finalDoctorData ? parsePriceToNumber(finalDoctorData.consultationFee) : 0;
  const finalFee = finalDoctorData?.consultationFee || '300,000 VNĐ';

  const isContactInfoComplete = newApt.patientName.trim() && newApt.phone.trim() && newApt.email.trim();
  const isFormComplete = selectedDate && selectedTime && isContactInfoComplete && finalDoctorId;

  // ─── Derived KPI counts ───────────────────────────────────────────────────
  const todays = useMemo(
    () => (appointments || []).map((a, i) => normalizeApt(a, i)).filter((a) => a.date === TODAY_STR),
    [appointments]
  );
  const kpi = useMemo(
    () => ({
      checkedIn: todays.filter((a) => a.status === APT_STATUS.CHECKED_IN).length,
      todayTotal: todays.filter((a) => a.status !== APT_STATUS.CANCELLED).length,
      toCollect: todays.filter((a) => a.status === APT_STATUS.EXAMINED).length,
      requests: (appointments || [])
        .map((a, i) => normalizeApt(a, i))
        .filter((a) => a.status === APT_STATUS.REQUEST).length,
    }),
    [todays, appointments]
  );

  // ─── Morphing pill topbar (shared baseline) ───────────────────────────────
  const scrollRef = useRef(null);
  const { scrollY } = useScroll({ container: scrollRef });
  const cfg = { stiffness: 220, damping: 32, mass: 0.9 };
  const widthMV = useSpring(useTransform(scrollY, [0, 120], [100, 90]), cfg);
  const maxWMV = useSpring(useTransform(scrollY, [0, 120], [1600, 1140]), cfg);
  const radiusMV = useSpring(useTransform(scrollY, [0, 120], [0, 32]), cfg);
  const topMV = useSpring(useTransform(scrollY, [0, 120], [0, 16]), cfg);
  const pxMV = useSpring(useTransform(scrollY, [0, 120], [32, 30]), cfg);
  const bgMV = useSpring(useTransform(scrollY, [0, 120], [0, 0.72]), cfg);
  const shadowMV = useSpring(useTransform(scrollY, [0, 120], [0, 0.12]), cfg);
  const ringMV = useSpring(useTransform(scrollY, [0, 120], [0, 0.7]), cfg);
  const navWidth = useMotionTemplate`${widthMV}%`;
  const navMaxWidth = useMotionTemplate`${maxWMV}px`;
  const navBorderRadius = useMotionTemplate`${radiusMV}px`;
  const navTop = useMotionTemplate`${topMV}px`;
  const navPaddingX = useMotionTemplate`${pxMV}px`;
  const navBg = useMotionTemplate`rgba(255, 255, 255, ${bgMV})`;
  const navShadow = useMotionTemplate`0 14px 40px rgba(2, 32, 29, ${shadowMV}), inset 0 1px 2px rgba(255,255,255,0.9), inset 0 0 0 1px rgba(255,255,255,${ringMV})`;

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-teal-50 via-emerald-100 to-cyan-50 overflow-hidden font-sans text-slate-800">
      {/* Animated mesh blobs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full bg-emerald-400/30 blur-3xl" style={{ animation: 'float 18s ease-in-out infinite' }} />
        <div className="absolute -bottom-40 -right-40 w-[480px] h-[480px] rounded-full bg-cyan-400/30 blur-3xl" style={{ animation: 'float-reverse 20s ease-in-out infinite' }} />
      </div>
      <style>{`
        @keyframes float { 0%,100%{transform:translate(0,0) scale(1);} 33%{transform:translate(30px,-40px) scale(1.05);} 66%{transform:translate(-20px,20px) scale(0.97);} }
        @keyframes float-reverse { 0%,100%{transform:translate(0,0) scale(1);} 33%{transform:translate(-30px,30px) scale(0.95);} 66%{transform:translate(25px,-25px) scale(1.04);} }
      `}</style>

      {/* Sidebar */}
      <motion.aside
        animate={{ width: isSidebarExpanded ? 256 : 80 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="hidden md:flex backdrop-blur-2xl bg-teal-900/10 border-r border-teal-900/10 fixed h-full z-40 flex-col py-8 px-3 justify-between shadow-[4px_0_24px_rgba(0,0,0,0.03),inset_-1px_0_2px_rgba(255,255,255,0.7)] overflow-hidden"
      >
        <div className="flex flex-col gap-6">
          <div className={`flex items-center ${isSidebarExpanded ? 'justify-between px-1' : 'justify-center'} min-h-[64px]`}>
            {isSidebarExpanded ? (
              <>
                <div className="flex flex-col items-start gap-1">
                  <img src={logo} alt="DermaSmart Logo" className="h-14 w-auto object-contain" />
                  <span className="text-[10px] text-gray-500 whitespace-nowrap">Reception Portal</span>
                </div>
                <button onClick={() => setIsSidebarExpanded(false)} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-emerald-600 transition-colors cursor-pointer" title="Thu gọn">
                  <PanelLeftClose className="w-5 h-5" />
                </button>
              </>
            ) : (
              <button onClick={() => setIsSidebarExpanded(true)} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-emerald-600 transition-colors cursor-pointer" title="Mở rộng">
                <PanelLeftOpen className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Walk-in appointment */}
          <div className="relative group">
            <button
              onClick={() => setIsAddOpen(true)}
              className={`w-full bg-gradient-to-r from-teal-600 to-sky-600 text-white rounded-xl font-semibold shadow-md shadow-teal-600/10 hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 text-sm border-none cursor-pointer ${isSidebarExpanded ? 'py-3 px-4' : 'py-3 px-0'}`}
            >
              <Plus className="w-4 h-4 flex-shrink-0" />
              {isSidebarExpanded && <span className="whitespace-nowrap">Đặt lịch hẹn</span>}
            </button>
            {!isSidebarExpanded && (
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                Đặt lịch hẹn
              </div>
            )}
          </div>

          <LiquidSidebarMenu items={navItems} activeId={activeTab} onChange={setActiveTab} isSidebarExpanded={isSidebarExpanded} />
        </div>

        <div className="border-t border-slate-100/40 pt-4 space-y-1">
          <div className="relative group">
            <a href="#" className={`flex items-center gap-3 rounded-xl font-medium text-slate-600 hover:text-emerald-600 hover:bg-emerald-50/40 transition-all ${isSidebarExpanded ? 'px-4 py-3' : 'px-0 py-3 justify-center'}`}>
              <HelpCircle className="w-5 h-5 text-slate-400 flex-shrink-0" />
              {isSidebarExpanded && <span className="text-sm whitespace-nowrap">Hỗ trợ kỹ thuật</span>}
            </a>
          </div>
          <div className="relative group">
            <button
              onClick={async () => { await logout(); navigate('/login'); }}
              className={`w-full flex items-center gap-3 rounded-xl font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50/40 transition-all border-none cursor-pointer bg-transparent text-left ${isSidebarExpanded ? 'px-4 py-3' : 'px-0 py-3 justify-center'}`}
            >
              <LogOut className="w-5 h-5 text-slate-400 flex-shrink-0" />
              {isSidebarExpanded && <span className="text-sm whitespace-nowrap">Đăng xuất</span>}
            </button>
            {!isSidebarExpanded && (
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                Đăng xuất
              </div>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Main */}
      <div className={`transition-all duration-300 ${isSidebarExpanded ? 'md:ml-64' : 'md:ml-20'}`}>
        <div ref={scrollRef} className="h-screen overflow-y-auto relative">
          {/* Morphing topbar */}
          <motion.header
            style={{
              width: navWidth, maxWidth: navMaxWidth, borderRadius: navBorderRadius,
              top: navTop, paddingLeft: navPaddingX, paddingRight: navPaddingX,
              backgroundColor: navBg, boxShadow: navShadow,
            }}
            className="sticky mx-auto z-30 py-4 backdrop-blur-2xl"
          >
            <div className="relative flex items-center justify-between gap-4 w-full">
              <div className="flex items-center gap-4 flex-1">
                <span className="font-black text-2xl text-emerald-600 md:hidden tracking-tight">DermaSmart</span>
              </div>
              <h1 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xl md:text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-800 to-emerald-700 tracking-tight whitespace-nowrap pointer-events-none">
                {PAGE_TITLES[activeTab] || 'Tổng quan'}
              </h1>

              <div className="flex items-center gap-3">
                <span className="hidden sm:inline-block font-semibold text-xs text-teal-700 py-1 px-3 bg-teal-50 border border-teal-200/40 rounded-full">
                  Cổng lễ tân
                </span>

                {/* Live chat shortcut */}
                <motion.button
                  whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab('chat')}
                  className="relative w-10 h-10 rounded-2xl bg-white/50 border border-white/60 backdrop-blur-md flex items-center justify-center text-slate-500 hover:text-emerald-600 shadow-sm transition-colors"
                  title="Chăm sóc khách hàng"
                >
                  <MessageSquare size={18} />
                  {hasUnreadChat && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-white animate-pulse" />}
                </motion.button>

                {/* Notifications */}
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
                    onClick={() => setShowNotifications((s) => !s)}
                    className="relative w-10 h-10 rounded-2xl bg-white/50 border border-white/60 backdrop-blur-md flex items-center justify-center text-slate-500 hover:text-emerald-600 shadow-sm transition-colors"
                  >
                    <Bell size={18} />
                    {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-white" />}
                  </motion.button>
                  <AnimatePresence>
                    {showNotifications && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute right-0 mt-2 w-80 bg-white/95 backdrop-blur-md border border-slate-200 shadow-2xl rounded-2xl p-4 z-50 max-h-[350px] overflow-y-auto"
                        >
                          <div className="flex justify-between items-center pb-2 border-b border-slate-100 mb-2">
                            <span className="text-sm font-extrabold text-slate-800">Thông báo</span>
                            {unreadCount > 0 && (
                              <button onClick={() => NotificationModel.markAllAsRead('RECEPTIONIST', receptionistId)} className="text-[10px] text-emerald-600 hover:text-emerald-700 font-bold border-none bg-transparent cursor-pointer">
                                Đọc tất cả
                              </button>
                            )}
                          </div>
                          <div className="space-y-2.5">
                            {myNotifications.length === 0 ? (
                              <p className="text-xs text-slate-400 italic text-center py-4">Chưa có thông báo nào.</p>
                            ) : (
                              myNotifications.map((notif, i) => (
                                <div
                                  key={notif.id ?? `notif-${i}`}
                                  onClick={() => NotificationModel.markAsRead(notif.id)}
                                  className={`p-2.5 rounded-xl transition-all border cursor-pointer text-left ${notif.isRead ? 'bg-transparent border-slate-100 hover:bg-slate-50' : 'bg-emerald-50/50 border-emerald-100/50 hover:bg-emerald-50'}`}
                                >
                                  <p className="text-xs font-bold text-slate-800">{notif.title}</p>
                                  <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{notif.content}</p>
                                  <span className="text-[8px] text-slate-400 block mt-1.5">{notif.timestamp ? new Date(notif.timestamp).toLocaleString('vi-VN') : ''}</span>
                                </div>
                              ))
                            )}
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }} className="w-10 h-10 rounded-2xl bg-white/50 border border-white/60 backdrop-blur-md flex items-center justify-center text-slate-500 hover:text-emerald-600 shadow-sm transition-colors">
                  <Settings size={18} />
                </motion.button>

                {/* Profile */}
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
                    onClick={() => setShowProfileMenu((s) => !s)}
                    className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 cursor-pointer ring-2 ring-transparent hover:ring-emerald-500/50 overflow-hidden"
                  >
                    {user?.avatar ? <img src={user.avatar} alt={user?.name || 'avatar'} className="w-full h-full object-cover" /> : <User size={18} className="text-white" />}
                  </motion.button>
                  <AnimatePresence>
                    {showProfileMenu && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute right-0 mt-2 w-56 bg-white/90 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-2xl p-2 z-50 origin-top-right text-left"
                        >
                          <div className="px-3 py-2.5 border-b border-slate-100 mb-1">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tài khoản</p>
                            <p className="text-sm font-bold text-slate-800 truncate mt-0.5">{user?.name || 'Lễ tân'}</p>
                            <p className="text-[11px] text-emerald-600 font-medium truncate">{user?.email || ''}</p>
                          </div>
                          <button onClick={() => { setShowProfileMenu(false); navigate('/profile'); }} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:text-emerald-600 hover:bg-emerald-50/50 transition-colors border-none bg-transparent cursor-pointer text-left">
                            <User className="w-4 h-4 text-slate-400" /> Xem hồ sơ cá nhân
                          </button>
                          <button onClick={async () => { setShowProfileMenu(false); await logout(); navigate('/login'); }} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50/50 transition-colors border-none bg-transparent cursor-pointer text-left">
                            <LogOut className="w-4 h-4 text-rose-400" /> Đăng xuất
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.header>

          {/* Page content — keyed remount per tab */}
          <main className="relative z-10 px-4 md:px-8 py-8 max-w-[1600px] mx-auto">
            <motion.div key={`tab-${activeTab}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: 'easeOut' }}>
              {activeTab === 'overview' && (
                <OverviewTab
                  user={user}
                  kpi={kpi}
                  todays={todays}
                  requests={(appointments || []).map((a, i) => normalizeApt(a, i)).filter((a) => a.status === APT_STATUS.REQUEST)}
                  onGoTab={setActiveTab}
                  onApprove={handleApproveRequest}
                  onArrive={(apt) => setSelectedCheckInApt(apt)}
                  onOpenChat={handleOpenChat}
                  onAdd={() => setIsAddOpen(true)}
                  showToast={showToast}
                />
              )}

              {activeTab === 'queue' && (
                <TodayQueueBoard
                  appointments={appointments}
                  doctors={doctors}
                  onChangeStatus={handleQueueStatusChange}
                  onApprove={handleApproveRequest}
                  onDecline={handleDeclineRequest}
                  onOpenChat={handleOpenChat}
                  onGoBilling={goBilling}
                  onArrive={(apt) => setSelectedCheckInApt(apt)}
                  showToast={showToast}
                />
              )}

              {activeTab === 'billing' && (
                <BillingCheckout
                  appointments={appointments}
                  payments={payments}
                  doctors={doctors}
                  vouchers={vouchers}
                  getAutoApplicable={getAutoApplicable}
                  incrementUsage={incrementUsage}
                  receptionistId={receptionistId}
                  onRefresh={refreshState}
                  showToast={showToast}
                  focusPatientId={billingFocusPatientId}
                  onConsumeFocus={() => setBillingFocusPatientId(null)}
                />
              )}

              {activeTab === 'chat' && <ReceptionistChatTab />}

              {activeTab === 'feedback' && <ReceptionistFeedbackView />}
            </motion.div>
          </main>
        </div>
      </div>

      {/* Live chat drawer (quick per-patient chat from queue/overview) */}
      <LiveChatDrawer
        patient={activeChatPatient}
        isOpen={isChatOpen}
        onClose={() => { setIsChatOpen(false); setActiveChatPatient(null); }}
        messages={chatMessages}
        onSendMessage={handleSendMessage}
      />

      {/* Check-in Lookup & Medical Record Modal */}
      <CheckInPatientModal
        isOpen={!!selectedCheckInApt}
        onClose={() => setSelectedCheckInApt(null)}
        appointment={selectedCheckInApt}
        onCheckInSuccess={handleCheckInSuccess}
        showToast={showToast}
      />

      {/* Walk-in appointment modal */}
      {isAddOpen && createPortal(
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
                <div className="w-full lg:w-[420px] bg-white/40 rounded-2xl border border-white/50 p-6 flex flex-col h-full shrink-0 overflow-y-auto justify-between gap-6">
                  
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
                        <div className="grid grid-cols-4 gap-3 mt-4 overflow-y-auto pr-1 flex-1">
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
        )}

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-6 left-1/2 z-[110] p-4 rounded-2xl shadow-xl backdrop-blur-xl flex items-center gap-3 border ${
              toast.type === 'success' ? 'bg-emerald-600/90 border-emerald-500 text-white' : toast.type === 'info' ? 'bg-sky-600/90 border-sky-500 text-white' : 'bg-rose-600/90 border-rose-500 text-white'
            }`}
            style={{ transform: 'translateX(-50%)' }}
          >
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              {toast.type === 'success' ? <CheckSquare className="w-3.5 h-3.5" /> : toast.type === 'info' ? <Sparkles className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
            </div>
            <p className="text-xs font-bold whitespace-nowrap">{toast.message}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Overview — KPIs + a light glance at the queue & new requests (front-desk only).
// ─────────────────────────────────────────────────────────────────────────────
function OverviewTab({ user, kpi, todays, requests, onGoTab, onApprove, onArrive, onOpenChat, onAdd, showToast }) {
  const now = new Date();
  const nextUp = todays
    .filter((a) => a.status === APT_STATUS.CONFIRMED || a.status === APT_STATUS.CHECKED_IN)
    .filter((a) => {
      // Hide confirmed (not yet checked-in) appointments whose time has passed
      if (a.status === APT_STATUS.CONFIRMED && a.time) {
        const [h, m] = a.time.split(':').map(Number);
        const aptDate = new Date();
        aptDate.setHours(h, m, 0, 0);
        if (now > aptDate) return false;
      }
      return true;
    })
    .sort((a, b) => a.time.localeCompare(b.time))
    .slice(0, 6);

  const cards = [
    { label: 'Đang chờ khám', value: kpi.checkedIn, hint: 'người', icon: Users, tone: 'sky', tab: 'queue' },
    { label: 'Lịch hôm nay', value: kpi.todayTotal, hint: 'ca khám', icon: CheckSquare, tone: 'emerald', tab: 'queue' },
    { label: 'Chờ thanh toán', value: kpi.toCollect, hint: 'hóa đơn', icon: Wallet, tone: 'amber', tab: 'billing' },
    { label: 'Yêu cầu mới', value: kpi.requests, hint: 'cần duyệt', icon: Inbox, tone: 'rose', tab: 'queue' },
  ];
  const tones = {
    sky: 'bg-sky-50 text-sky-600 border-sky-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-8">
      <motion.div variants={fadeInUp} className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h2 className="font-black text-2xl md:text-3xl text-gray-900 tracking-tight">Chào, {user?.name || 'Lễ tân'} 👋</h2>
        </div>
        <p className="text-sm text-slate-500 font-medium">Tổng quan hoạt động quầy lễ tân hôm nay ({TODAY_STR})</p>
      </motion.div>

      <motion.section variants={fadeInUp} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <button
              key={c.label}
              onClick={() => onGoTab(c.tab)}
              className="text-left backdrop-blur-md bg-white/40 border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-[2rem] p-6 relative overflow-hidden group hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 cursor-pointer"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl border shadow-inner ${tones[c.tone]}`}><Icon className="w-6 h-6" /></div>
              </div>
              <h3 className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">{c.label}</h3>
              <div className="flex items-baseline gap-1.5">
                <span className="font-black text-4xl text-slate-900">{c.value}</span>
                <span className="text-xs text-slate-400 font-medium">{c.hint}</span>
              </div>
            </button>
          );
        })}
      </motion.section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next up in queue */}
        <motion.div variants={fadeInUp} className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-lg text-slate-900">Sắp tới trong hàng chờ</h3>
            <button onClick={() => onGoTab('queue')} className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-transparent border-none cursor-pointer flex items-center gap-1">
              Mở Bàn Điều Phối <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="backdrop-blur-md bg-white/40 border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-[2rem] overflow-hidden">
            {nextUp.length === 0 ? (
              <div className="p-10 text-center text-slate-400">
                <Clock className="w-7 h-7 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-semibold">Chưa có bệnh nhân nào trong hàng chờ hôm nay.</p>
              </div>
            ) : (
              nextUp.map((apt) => {
                const arrived = apt.status === APT_STATUS.CHECKED_IN;
                return (
                  <div key={apt.key} className="p-4 border-b border-slate-200/40 last:border-0 flex items-center justify-between gap-3 hover:bg-white/50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-50 to-teal-50 border border-sky-100 flex items-center justify-center font-black text-sm text-teal-700 shrink-0">
                        {apt.patientName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-slate-800 truncate">{apt.patientName}</h4>
                        <p className="text-[11px] text-slate-400 font-medium truncate">
                          <span className="font-bold text-slate-500">{apt.time}</span> · {apt.serviceName} · <span className="text-teal-600">{apt.doctorName}</span>
                        </p>
                      </div>
                    </div>
                    {arrived ? (
                      <span className="px-3 py-1.5 text-[11px] text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl font-bold shrink-0">Đã đến</span>
                    ) : (
                      <button
                        onClick={() => onArrive(apt)}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-teal-600 text-white text-[11px] font-bold hover:shadow-md active:scale-95 transition-all cursor-pointer border-none shrink-0 flex items-center gap-1.5"
                      >
                        <UserCheck className="w-3.5 h-3.5" /> Đã đến
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </motion.div>

        {/* New requests */}
        <motion.div variants={fadeInUp} className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-lg text-slate-900">Yêu cầu đặt lịch</h3>
            {requests.length > 0 && <span className="bg-rose-50 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-200/40 animate-pulse">{requests.length} MỚI</span>}
          </div>
          <div className="space-y-3">
            {requests.length === 0 ? (
              <div className="backdrop-blur-md bg-white/40 border border-white/60 rounded-[2rem] p-8 text-center text-slate-400">
                <CalendarClock className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                <p className="text-[11px] font-semibold">Không có yêu cầu mới.</p>
              </div>
            ) : (
              requests.slice(0, 4).map((apt) => (
                <div key={apt.key} className="backdrop-blur-md bg-white/50 border border-white/70 rounded-2xl p-4 border-l-4 border-l-sky-500">
                  <h4 className="font-bold text-slate-800 text-sm">{apt.patientName}</h4>
                  <p className="text-[11px] text-slate-400 font-medium mt-1">{apt.date} · <span className="font-bold text-teal-600">{apt.time}</span> · {apt.serviceName}</p>
                  <div className="flex gap-2 mt-3">
                    <button onClick={async () => { await onApprove(apt.aptId); showToast(`Đã phê duyệt ${apt.patientName}.`, 'success'); }} className="flex-1 py-2 rounded-xl bg-teal-50 text-teal-700 text-[11px] font-bold hover:bg-teal-100/60 border border-teal-200/20 transition-colors cursor-pointer">Phê duyệt</button>
                    <button onClick={() => onOpenChat(apt.patientId, apt.patientName)} className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-600 text-[11px] font-bold hover:bg-slate-200/60 border border-slate-200/20 transition-colors cursor-pointer">Liên hệ</button>
                  </div>
                </div>
              ))
            )}
          </div>
          <button onClick={onAdd} className="w-full py-3 rounded-2xl border border-dashed border-slate-300 text-slate-400 hover:bg-white/40 hover:text-emerald-600 hover:border-emerald-300 transition-all text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer bg-transparent">
            <Plus className="w-4 h-4" /> Tự thêm lịch hẹn trực tiếp
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
