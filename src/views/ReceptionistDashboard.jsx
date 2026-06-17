// Receptionist portal — refactored to the shared "Liquid Glass" baseline.
// Scope is strictly front-desk: dispatch queue, cashier desk, and patient live
// chat. Clinical surfaces (medical records, vitals, diagnoses, prescriptions)
// have been pruned — receptionists do not practice medicine.
import React, { useState, useEffect, useRef, useMemo } from 'react';
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
} from 'lucide-react';
import { useAppointmentController } from '../controllers/useAppointmentController';
import { useMedicalRecordController } from '../controllers/useMedicalRecordController';
import { useVoucherController } from '../controllers/useVoucherController';
import { useDoctors } from '../hooks/useDoctors';
import { AppointmentModel } from '../models/AppointmentModel';
import { NotificationModel } from '../models/NotificationModel';
import { ReceptionistChatModel } from '../models/ChatModel';
import LiquidSidebarMenu from '../components/ui/LiquidSidebarMenu';
import LiveChatDrawer from '../components/Receptionist/LiveChatDrawer';
import ReceptionistChatTab from '../components/Receptionist/ReceptionistChatTab';
import ReceptionistFeedbackView from '../components/Receptionist/ReceptionistFeedbackView';
import TodayQueueBoard from '../components/Receptionist/TodayQueueBoard';
import BillingCheckout from '../components/Receptionist/BillingCheckout';
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

  const {
    appointments,
    payments,
    bookAppointment,
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
    const interval = setInterval(fetchMsgs, 2500);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

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
  const handleQueueStatusChange = async (aptId, status) => {
    await AppointmentModel.updateAppointment(aptId, { status });
    await refreshState();
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
    date: TODAY_STR,
    time: '09:00',
    service: 'Khám Da Liễu Tổng Quát',
    doctorName: '',
    notes: '',
  });

  useEffect(() => {
    if (!isAddOpen) return;
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
    setNewApt((prev) => ({
      ...prev,
      service: parsed[0]?.name || prev.service,
      doctorName: doctors[0]?.name || prev.doctorName,
    }));
  }, [isAddOpen, doctors]);

  const handleAddApt = async (e) => {
    e.preventDefault();
    if (!newApt.patientName.trim() || !newApt.phone.trim()) {
      showToast('Vui lòng nhập họ tên và số điện thoại.', 'error');
      return;
    }
    const doctor = doctors.find((d) => d.name === newApt.doctorName) || doctors[0];
    if (!doctor) {
      showToast('Chưa có bác sĩ trong hệ thống.', 'error');
      return;
    }

    // Find-or-create a lightweight patient record (name + phone only — no clinical data).
    const cleanPhone = newApt.phone.replace(/[\s.-]/g, '');
    let target = (patients || []).find((p) => p.phone && p.phone.replace(/[\s.-]/g, '') === cleanPhone);
    let patientId = target?.id;
    if (!target) {
      try {
        const created = addPatient({
          fullName: newApt.patientName,
          phone: newApt.phone,
          dob: '1990-01-01',
          address: 'Chưa cập nhật',
          medicalHistory: [],
        });
        patientId = created?.id;
      } catch (err) {
        showToast(err.message || 'Lỗi khi tạo hồ sơ bệnh nhân.', 'error');
        return;
      }
    }

    try {
      const res = await bookAppointment({
        patient_id: patientId,
        patient_name: newApt.patientName,
        doctor_id: doctor.id,
        doctor_name: doctor.name,
        service_name: newApt.service,
        appointment_date: newApt.date,
        start_time: newApt.time,
        reason: newApt.notes || 'Khám trực tiếp tại quầy',
        status: APT_STATUS.CONFIRMED,
      });
      if (res && res.success === false) {
        showToast(res.error || 'Không thể tạo lịch hẹn.', 'error');
        return;
      }
      setIsAddOpen(false);
      setNewApt({
        patientName: '',
        phone: '',
        date: TODAY_STR,
        time: '09:00',
        service: servicesList[0]?.name || 'Khám Da Liễu Tổng Quát',
        doctorName: doctors[0]?.name || '',
        notes: '',
      });
      await refreshState();
      showToast(`Đã tạo lịch khám trực tiếp cho ${newApt.patientName}.`, 'success');
    } catch (err) {
      showToast(err.message || 'Có lỗi xảy ra.', 'error');
    }
  };

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
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white animate-pulse" />
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
                  onArrive={(aptId) => handleQueueStatusChange(aptId, APT_STATUS.CHECKED_IN)}
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

      {/* Walk-in appointment modal */}
      <AnimatePresence>
        {isAddOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} onClick={() => setIsAddOpen(false)} className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-[100]" />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} transition={{ type: 'spring', damping: 25 }}
              className="fixed inset-0 m-auto w-[92vw] max-w-lg h-fit max-h-[90vh] overflow-y-auto backdrop-blur-3xl bg-white/90 border border-white rounded-[2.5rem] shadow-2xl z-[101] p-8 flex flex-col gap-6"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-teal-50 rounded-xl text-teal-600"><Plus className="w-5 h-5" /></div>
                  <h3 className="font-extrabold text-lg text-slate-900 tracking-tight">Đặt lịch hẹn trực tiếp</h3>
                </div>
                <button onClick={() => setIsAddOpen(false)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer border-none"><X className="w-4 h-4" /></button>
              </div>

              <form onSubmit={handleAddApt} className="space-y-4 text-xs font-semibold text-slate-700">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label>Họ và tên <span className="text-rose-500">*</span></label>
                    <input type="text" value={newApt.patientName} onChange={(e) => setNewApt({ ...newApt, patientName: e.target.value })} className={`${GLASS_INPUT} px-3 py-2.5`} placeholder="Nguyễn Văn A" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label>Số điện thoại <span className="text-rose-500">*</span></label>
                    <input type="tel" value={newApt.phone} onChange={(e) => setNewApt({ ...newApt, phone: e.target.value })} className={`${GLASS_INPUT} px-3 py-2.5`} placeholder="09xx xxx xxx" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label>Ngày khám</label>
                    <input type="date" value={newApt.date} onChange={(e) => setNewApt({ ...newApt, date: e.target.value })} className={`${GLASS_INPUT} px-3 py-2.5`} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label>Giờ khám</label>
                    <input type="time" value={newApt.time} onChange={(e) => setNewApt({ ...newApt, time: e.target.value })} className={`${GLASS_INPUT} px-3 py-2.5`} />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label>Dịch vụ</label>
                  <GlassSelect
                    value={newApt.service}
                    onChange={(v) => setNewApt({ ...newApt, service: v })}
                    options={servicesList.length === 0
                      ? [{ value: 'Khám Da Liễu Tổng Quát', label: 'Khám Da Liễu Tổng Quát' }]
                      : servicesList.map((s) => ({ value: s.name, label: s.name }))}
                    buttonClassName="px-3 py-2.5 text-xs"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label>Bác sĩ phụ trách</label>
                  <GlassSelect
                    value={newApt.doctorName}
                    onChange={(v) => setNewApt({ ...newApt, doctorName: v })}
                    options={(doctors || []).map((d) => ({ value: d.name, label: d.name }))}
                    placeholder="Chưa có bác sĩ"
                    buttonClassName="px-3 py-2.5 text-xs"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label>Ghi chú</label>
                  <textarea value={newApt.notes} onChange={(e) => setNewApt({ ...newApt, notes: e.target.value })} rows={2} className={`${GLASS_INPUT} px-3 py-2.5 resize-none`} placeholder="Lý do khám / yêu cầu đặc biệt..." />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setIsAddOpen(false)} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 active:scale-95 transition-all cursor-pointer bg-white">Hủy</button>
                  <button type="submit" className="flex-1 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-sky-600 text-white font-bold hover:shadow-lg active:scale-95 transition-all cursor-pointer border-none">Tạo lịch hẹn</button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
  const nextUp = todays
    .filter((a) => a.status === APT_STATUS.CONFIRMED || a.status === APT_STATUS.CHECKED_IN)
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
                        onClick={async () => { await onArrive(apt.aptId); showToast(`${apt.patientName} đã được tiếp đón.`, 'success'); }}
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
