import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Inbox, 
  TrendingUp, 
  HelpCircle, 
  LogOut, 
  Search, 
  Bell, 
  Settings, 
  Plus, 
  Hourglass, 
  CheckSquare, 
  DollarSign, 
  ChevronRight, 
  UserPlus,
  User,
  X,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  Trash2,
  AlertCircle,
  Clock,
  CalendarDays,
  CreditCard,
  Stethoscope
} from 'lucide-react';
import { 
  mockAppointments, 
  mockPatients, 
  mockChatMessages, 
  doctors, 
  mockServices, 
  mockTimeSlots 
} from '../mockData';
import LiveChatDrawer from '../components/Receptionist/LiveChatDrawer';
import { useAppointmentController } from '../controllers/useAppointmentController';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { type: "spring", damping: 25, stiffness: 100 } 
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function ReceptionistDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // ─── STATE MANAGEMENT ───────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('overview');
  
  const { appointments, updateAppointmentStatus, addDirectAppointment } = useAppointmentController();
  
  const [patients, setPatients] = useState(mockPatients);
  const [chatMessages, setChatMessages] = useState(mockChatMessages);
  const [toast, setToast] = useState(null);
  
  // Manual Appointment Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newApt, setNewApt] = useState({
    patientName: '',
    phone: '',
    date: '2026-06-01',
    time: '09:00',
    service: 'Khám Da Liễu Tổng Quát',
    doctorName: 'BS. CKII. Trần Văn A',
    notes: ''
  });

  // Chat Drawer State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeChatPatient, setActiveChatPatient] = useState(null);

  // ─── INITIALIZATION (Adjust Dates to Coordinate with Today's Date) ───────
  const todayStr = "2026-06-01"; // Timeline current date

  const handleScroll = (e) => {
    if (e.target.scrollTop > 10) {
      setIsScrolled(true);
    } else {
      setIsScrolled(false);
    }
  };

  // ─── TOAST NOTIFICATION ─────────────────────────────────────────────────
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // ─── DYNAMIC STATISTICS CALCULATIONS ────────────────────────────────────
  // "Bệnh nhân đang chờ" (Checked-in but not completed)
  const waitingCount = (appointments || []).filter(a => a.status === 'Đang chờ' && a.date === todayStr).length;
  
  // "Lịch hẹn hôm nay" (Total appointments for the current date)
  const todayAppointmentsCount = (appointments || []).filter(a => a.date === todayStr && a.status !== 'Đã hủy').length;
  
  // "Thanh toán chờ xử lý" (Appointments with 'Unpaid' or 'Pending' status)
  const pendingPaymentsCount = (appointments || []).filter(a => a.paymentStatus === 'Chưa thanh toán' || a.paymentStatus === 'Chờ xác nhận').length;

  // ─── INTERACTIVE ACTIONS ────────────────────────────────────────────────
  
  // 1. Check-in Button Action
  const handleCheckIn = (aptId, patientName) => {
    updateAppointmentStatus(aptId, 'Đang chờ');
    showToast(`Check-in thành công cho bệnh nhân ${patientName}!`, 'success');
  };

  // 2. Approve Button Action
  const handleApprove = (aptId, patientName) => {
    updateAppointmentStatus(aptId, 'Đã xác nhận');
    showToast(`Đã phê duyệt lịch hẹn khám của ${patientName}!`, 'success');
  };

  // 3. Reject/Cancel Button Action
  const handleReject = (aptId, patientName) => {
    updateAppointmentStatus(aptId, 'Đã hủy');
    showToast(`Đã từ chối/hủy lịch hẹn khám của ${patientName}.`, 'error');
  };

  // 4. Manual Appointment Creation Submission
  const handleAddApt = (e) => {
    e.preventDefault();
    if (!newApt.patientName.trim() || !newApt.phone.trim()) {
      showToast("Vui lòng điền đầy đủ họ tên và số điện thoại!", "error");
      return;
    }

    const doctor = doctors.find(d => d.name === newApt.doctorName) || doctors[0];
    const patientId = `pat-${Date.now()}`;

    // Create a new patient object
    const createdPatient = {
      id: patientId,
      fullName: newApt.patientName,
      phone: newApt.phone,
      avatar: `https://i.pravatar.cc/150?u=${patientId}`,
      medicalHistory: []
    };

    // Create a new appointment
    const createdAppointment = {
      id: `apt-${Date.now()}`,
      patientId: patientId,
      patientName: newApt.patientName,
      doctorId: doctor.id,
      doctorName: doctor.name,
      date: newApt.date,
      time: newApt.time,
      status: 'Đã xác nhận', // Directly confirmed
      service: newApt.service,
      paymentStatus: 'Chưa thanh toán',
      fee: '300,000 VNĐ',
      notes: newApt.notes
    };

    setPatients(prev => [...prev, createdPatient]);
    addDirectAppointment(createdAppointment);
    setIsAddOpen(false);
    
    // Reset Form
    setNewApt({
      patientName: '',
      phone: '',
      date: '2026-06-01',
      time: '09:00',
      service: 'Khám Da Liễu Tổng Quát',
      doctorName: 'BS. CKII. Trần Văn A',
      notes: ''
    });

    showToast(`Đã tạo lịch khám trực tiếp cho ${newApt.patientName}!`, 'success');
  };

  // 5. Open Live Chat for a Patient
  const handleOpenChat = (patientId, patientName) => {
    let targetPatient = (patients || []).find(p => p.id === patientId);
    if (!targetPatient) {
      // Create fallback if not fully defined
      targetPatient = {
        id: patientId,
        fullName: patientName,
        phone: 'Chưa có',
        email: 'Chưa có',
        avatar: `https://i.pravatar.cc/150?u=${patientId}`,
        medicalHistory: []
      };
    }
    setActiveChatPatient(targetPatient);
    setIsChatOpen(true);
  };

  // 6. Handle sending message from receptionist
  const handleSendMessage = (patientId, text) => {
    const newMsg = {
      id: `msg-${Date.now()}`,
      senderId: 'staff-01', // Receptionist ID
      senderName: 'Lễ tân Hoàng Anh',
      senderRole: 'RECEPTIONIST',
      text: text,
      timestamp: new Date().toISOString(),
      mode: 'Live',
      patientId: patientId
    };
    
    setChatMessages(prev => [...prev, newMsg]);

    // Simulate patient response after 1.5s to show rich interactivity
    setTimeout(() => {
      const activePatient = (patients || []).find(p => p.id === patientId);
      const replyMsg = {
        id: `msg-${Date.now() + 1}`,
        senderId: patientId,
        senderName: activePatient ? activePatient.fullName : 'Bệnh nhân',
        senderRole: 'PATIENT',
        text: `Dạ vâng ạ, cảm ơn lễ tân đã hỗ trợ nhiệt tình!`,
        timestamp: new Date().toISOString(),
        mode: 'Live',
        patientId: patientId
      };
      setChatMessages(prev => [...prev, replyMsg]);
      showToast(`Tin nhắn mới từ bệnh nhân ${activePatient ? activePatient.fullName : 'Bệnh nhân'}`, 'info');
    }, 1500);
  };

  // ─── FILTER DATA BASED ON SEARCH ────────────────────────────────────────
  // Today's waiting list (status: 'Đã xác nhận' or 'Đang chờ')
  const todayAppointments = (appointments || []).filter(a => 
    a.date === todayStr && 
    (a.status === 'Đã xác nhận' || a.status === 'Đang chờ')
  );

  const filteredWaiting = (todayAppointments || []).filter(a => 
    a.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.service?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pending booking requests (status: 'Chờ xác nhận')
  const bookingRequests = (appointments || []).filter(a => a.status === 'Chờ xác nhận');
  
  const filteredRequests = (bookingRequests || []).filter(a => 
    a.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.service?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-x-hidden flex w-full font-sans antialiased text-slate-800">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-20px) translateX(10px); }
        }
        @keyframes float-reverse {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(20px) translateX(-10px); }
        }
        .bg-mesh-blob-1 {
          animation: float 15s ease-in-out infinite;
        }
        .bg-mesh-blob-2 {
          animation: float-reverse 20s ease-in-out infinite;
        }
      `}</style>

      {/* Pristine Medical Mesh Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-emerald-300/15 blur-[120px] bg-mesh-blob-1"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-sky-300/15 blur-[120px] bg-mesh-blob-2"></div>
      </div>

      {/* Unified Glass Sidebar */}
      <aside className="hidden md:flex backdrop-blur-2xl bg-white/60 border-r border-white/50 w-64 fixed h-full z-40 flex-col py-8 px-4 justify-between">
        <div>
          {/* Logo Brand */}
          <div className="px-4 mb-8 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-sky-500 flex items-center justify-center text-white font-bold shadow-md shadow-teal-500/10">
              DS
            </div>
            <div>
              <h1 className="font-bold text-lg text-slate-900 tracking-tight leading-none">DermaSmart</h1>
              <span className="text-[11px] text-slate-500 font-medium">Clinic Management</span>
            </div>
          </div>

          {/* New Appointment Button */}
          <div className="px-2 mb-6">
            <button 
              onClick={() => setIsAddOpen(true)}
              className="w-full bg-gradient-to-r from-teal-600 to-sky-600 text-white py-3 px-4 rounded-xl font-semibold shadow-md shadow-teal-600/10 hover:shadow-lg hover:shadow-teal-600/20 active:scale-95 transition-all flex justify-center items-center gap-2 text-sm border-none cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Đặt lịch khám mới
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {[
              { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
              { id: 'waiting_list', label: 'Danh sách Hàng chờ', icon: Users },
              { id: 'appointments', label: 'Quản lý Lịch hẹn', icon: CalendarDays },
              { id: 'payments', label: 'Thanh toán & Hóa đơn', icon: CreditCard },
              { id: 'doctor_schedules', label: 'Lịch Bác sĩ', icon: Stethoscope },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all border-none cursor-pointer bg-transparent text-left ${
                  activeTab === tab.id
                    ? 'font-bold bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100/50'
                    : 'text-slate-500 hover:text-teal-600 hover:bg-slate-100'
                }`}
              >
                <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span className="text-sm">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Footer actions */}
        <div className="border-t border-slate-100 pt-4 space-y-1">
          <button
            onClick={() => navigate('/profile')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-slate-600 hover:text-teal-600 hover:bg-teal-50/40 transition-all border-none cursor-pointer bg-transparent align-middle text-left"
          >
            <User className="w-5 h-5 text-slate-400" />
            <span className="text-sm">Hồ sơ cá nhân</span>
          </button>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-slate-600 hover:text-teal-600 hover:bg-teal-50/40 transition-all">
            <HelpCircle className="w-5 h-5 text-slate-400" />
            <span className="text-sm">Hỗ trợ kỹ thuật</span>
          </a>
          <button
            onClick={async () => {
              await logout();
              navigate('/login');
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50/40 transition-all border-none cursor-pointer bg-transparent align-middle text-left"
          >
            <LogOut className="w-5 h-5 text-slate-400" />
            <span className="text-sm">Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 flex flex-col h-screen overflow-y-auto z-10" onScroll={handleScroll}>
        
        {/* Dynamic Morphing Pill Topbar */}
        <motion.header
          animate={{
            width: isScrolled ? "92%" : "100%",
            maxWidth: isScrolled ? "1100px" : "100%",
            top: isScrolled ? "16px" : "0px",
            borderRadius: isScrolled ? "9999px" : "0px",
            backgroundColor: isScrolled ? "rgba(255, 255, 255, 0.75)" : "transparent",
            boxShadow: isScrolled ? "0 10px 30px rgba(0,0,0,0.06)" : "none",
            borderBottom: isScrolled ? "none" : "1px solid rgba(226, 232, 240, 0.8)",
            border: isScrolled ? "1px solid rgba(255, 255, 255, 0.8)" : "none",
          }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
          style={{ position: 'sticky', zIndex: 40, margin: '0 auto', left: 0, right: 0 }}
          className="backdrop-blur-xl flex justify-between items-center w-full px-8 h-20"
        >
          <div className="flex items-center gap-4">
            <span className="font-extrabold text-xl text-teal-600 md:hidden tracking-tight">DermaSmart</span>
            <div className="hidden md:flex items-center bg-white/60 border border-slate-200/50 rounded-full px-4 py-1.5 focus-within:ring-2 focus-within:ring-teal-500/20 focus-within:border-teal-500 transition-all shadow-sm">
              <Search className="w-4 h-4 text-slate-400 mr-2" />
              <input
                className="bg-transparent border-none outline-none text-sm placeholder-slate-400 w-64 p-0 focus:ring-0"
                placeholder="Tìm kiếm bệnh nhân..."
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')} 
                  className="bg-transparent border-none cursor-pointer p-0.5 rounded-full hover:bg-slate-200/60 flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5 text-slate-400" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <span className="font-semibold text-xs text-teal-700 py-1 px-3 bg-teal-50 border border-teal-200/30 rounded-full">
              Cổng lễ tân
            </span>
            <div className="flex items-center gap-3 text-slate-500">
              <button 
                onClick={() => handleOpenChat('pat-01', 'Lê Minh Khôi')}
                className="hover:bg-slate-100 hover:text-teal-600 transition-all p-2 rounded-full relative active:scale-95 border-none cursor-pointer bg-transparent flex items-center justify-center"
                title="Mở Kênh Trò Chuyện Trực Tiếp"
              >
                <MessageSquare className="w-5 h-5 text-slate-600" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              </button>
              <button className="hover:bg-slate-100 hover:text-teal-600 transition-all p-2 rounded-full relative active:scale-95 border-none cursor-pointer bg-transparent flex items-center justify-center">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full"></span>
              </button>
              <button className="hover:bg-slate-100 hover:text-teal-600 transition-all p-2 rounded-full active:scale-95 border-none cursor-pointer bg-transparent flex items-center justify-center">
                <Settings className="w-5 h-5" />
              </button>
              <button className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 active:scale-95 transition-transform cursor-pointer border-none p-0">
                <img
                  alt="User Profile"
                  className="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuD-M2BqQXPDoBCWJkM6Fd79cimImp2GcimZMOlz2hyxwTH4bQ8vpMqVC_RIXoL2gAQqWt-OWMeEUU7YiJjTYdrKJ6XsjhktqmEjjycsJnakxWx_WlOKVxXcDhdC1jsooRwJbR1GBzC3hvEXnYhVvwZVOThox8jAo1EtiX6UhXkt9_AzZQuaNOIK89GbYNWX7HblAuBxdx77DsQ0O6pidqIO0QfLOZipt9s6XBnKNn_qc7Ii5Gu8kjJ1_lut2j9_FojRaUOzDBewe09P"
                />
              </button>
            </div>
          </div>
        </motion.header>

        {/* Dashboard Content */}
        <main className="p-8 space-y-8 max-w-7xl w-full mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div 
                key="overview"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
          {/* Welcome header */}
          <motion.div className="flex flex-col gap-1" variants={fadeInUp}>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-2xl md:text-3xl text-slate-900 tracking-tight">
                Chào buổi sáng, {user?.name || 'Lễ tân'}
              </h2>
              <span className="text-xl">👋</span>
            </div>
            <p className="text-sm text-slate-500 font-medium">Hôm nay là Thứ Hai, 1 Tháng 6, 2026</p>
          </motion.div>

          {/* Quick Stats Bento Grid (Dynamic stats calculated from local state) */}
          <motion.section className="grid grid-cols-1 md:grid-cols-3 gap-6" variants={fadeInUp}>
            
            {/* Stat 1: Waiting - Checked in but not completed */}
            <div className="backdrop-blur-xl bg-white/40 border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-[2rem] p-6 relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-sky-500/5 rounded-full blur-xl group-hover:bg-sky-500/10 transition-all"></div>
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-sky-50 rounded-xl text-sky-600 border border-sky-100 shadow-inner">
                  <Hourglass className="w-6 h-6" />
                </div>
                {waitingCount > 0 && (
                  <span className="bg-sky-50 text-sky-700 px-2.5 py-1 rounded-full text-xs font-bold border border-sky-200/20 animate-pulse">
                    Đang chờ khám
                  </span>
                )}
              </div>
              <h3 className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Bệnh nhân đang chờ</h3>
              <div className="flex items-baseline gap-1.5">
                <span className="font-black text-4xl text-slate-900">{waitingCount}</span>
                <span className="text-xs text-slate-400 font-medium">người</span>
              </div>
            </div>

            {/* Stat 2: Today's Appointments */}
            <div className="backdrop-blur-xl bg-white/40 border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-[2rem] p-6 relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-all"></div>
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100 shadow-inner">
                  <CheckSquare className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Lịch hẹn hôm nay</h3>
              <div className="flex items-baseline gap-1.5">
                <span className="font-black text-4xl text-slate-900">{todayAppointmentsCount}</span>
                <span className="text-xs text-slate-400 font-medium">ca khám</span>
              </div>
              <div className="mt-4 w-full bg-slate-200/50 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: todayAppointmentsCount > 0 ? `${(waitingCount / todayAppointmentsCount) * 100}%` : '0%' }}
                ></div>
              </div>
            </div>

            {/* Stat 3: Pending Payments */}
            <div className="backdrop-blur-xl bg-white/40 border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-[2rem] p-6 relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-500/5 rounded-full blur-xl group-hover:bg-rose-500/10 transition-all"></div>
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-rose-50 rounded-xl text-rose-600 border border-rose-100 shadow-inner">
                  <DollarSign className="w-6 h-6" />
                </div>
                {pendingPaymentsCount > 0 && (
                  <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse"></span>
                )}
              </div>
              <h3 className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Thanh toán chờ xử lý</h3>
              <div className="flex items-baseline gap-1.5">
                <span className="font-black text-4xl text-slate-900">{pendingPaymentsCount}</span>
                <span className="text-xs text-slate-400 font-medium">hồ sơ</span>
              </div>
            </div>
          </motion.section>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Column 1: Waiting List ("Danh sách hàng chờ") */}
            <motion.div className="lg:col-span-2 space-y-4" variants={fadeInUp}>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-xl text-slate-900">Danh sách hàng chờ hôm nay</h3>
                  <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100/50">
                    Khung giờ khám
                  </span>
                </div>
                {filteredWaiting.length > 0 && (
                  <span className="text-xs text-slate-400 font-semibold">
                    Hiển thị {filteredWaiting.length} lịch khám
                  </span>
                )}
              </div>

              <div className="backdrop-blur-xl bg-white/40 border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-[2rem] overflow-hidden flex flex-col">
                {filteredWaiting.length === 0 ? (
                  <div className="p-12 text-center flex flex-col items-center justify-center">
                    <div className="w-12 h-12 bg-slate-100 border border-slate-200/50 rounded-2xl flex items-center justify-center text-slate-400 mb-3 shadow-inner">
                      <Hourglass className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-slate-700 text-sm">Hàng chờ trống</h4>
                    <p className="text-xs text-slate-400 font-medium max-w-sm mt-1">
                      {searchTerm ? 'Không tìm thấy bệnh nhân nào khớp với từ khóa tìm kiếm.' : 'Không có lịch hẹn khám nào đã xác nhận cho hôm nay.'}
                    </p>
                  </div>
                ) : (
                  (filteredWaiting || []).map((apt, index) => {
                    const isCheckedIn = apt.status === 'Đang chờ';
                    
                    return (
                      <div 
                        key={apt.id}
                        className={`p-5 border-b border-slate-200/40 hover:bg-white/60 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${isCheckedIn ? 'opacity-85' : ''}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm border relative transition-all ${
                            isCheckedIn 
                              ? 'bg-slate-100 text-slate-500 border-slate-200' 
                              : 'bg-gradient-to-tr from-sky-50 to-teal-50 text-teal-700 border-sky-100 shadow-sm'
                          }`}>
                            {apt.patientName.charAt(0)}
                            {!isCheckedIn && (
                              <span className="absolute -top-1 -right-1 w-4 h-4 bg-teal-600 text-white text-[9px] rounded-full flex items-center justify-center border border-white font-extrabold shadow-sm">
                                {index + 1}
                              </span>
                            )}
                          </div>
                          <div>
                            <h4 className={`font-bold text-sm transition-colors ${isCheckedIn ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                              {apt.patientName}
                            </h4>
                            <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mt-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span className="font-bold text-slate-500">{apt.time}</span>
                              <span>•</span>
                              <span>{apt.service}</span>
                              {apt.doctorName && (
                                <>
                                  <span>•</span>
                                  <span className="text-teal-600 font-semibold">{apt.doctorName}</span>
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 w-full sm:w-auto">
                          <button 
                            onClick={() => handleOpenChat(apt.patientId, apt.patientName)}
                            className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl border border-slate-200 text-slate-500 text-xs font-bold hover:bg-slate-50 hover:text-teal-600 transition-colors cursor-pointer bg-white"
                          >
                            Hồ sơ & Chat
                          </button>
                          
                          {isCheckedIn ? (
                            <span className="px-4 py-2 text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl font-bold flex items-center gap-1.5 shadow-sm">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 animate-bounce" /> Đang chờ bác sĩ
                            </span>
                          ) : (
                            <button 
                              onClick={() => handleCheckIn(apt.id, apt.patientName)}
                              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-500 hover:to-sky-600 text-white text-xs font-bold transition-all shadow-sm shadow-sky-600/10 cursor-pointer border-none"
                            >
                              Check-in
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>

            {/* Column 2: Booking Requests ("Yêu cầu đặt lịch") */}
            <motion.div className="space-y-4" variants={fadeInUp}>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-extrabold text-xl text-slate-900">Yêu cầu đặt lịch</h3>
                {filteredRequests.length > 0 && (
                  <span className="bg-rose-50 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-200/20 animate-pulse">
                    {filteredRequests.length} MỚI
                  </span>
                )}
              </div>

              <div className="space-y-3">
                {filteredRequests.length === 0 ? (
                  <div className="backdrop-blur-xl bg-white/40 border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.05)] rounded-[2rem] p-8 text-center flex flex-col items-center justify-center">
                    <div className="w-10 h-10 bg-slate-100 border border-slate-200/50 rounded-xl flex items-center justify-center text-slate-400 mb-2 shadow-inner">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-slate-700 text-xs">Không có yêu cầu mới</h4>
                    <p className="text-[10px] text-slate-400 font-medium max-w-[180px] mt-0.5">
                      Tất cả các yêu cầu đặt lịch đã được xử lý xong.
                    </p>
                  </div>
                ) : (
                  (filteredRequests || []).map((apt) => (
                    <div 
                      key={apt.id}
                      className="backdrop-blur-xl bg-white/50 border border-white/70 shadow-[0_4px_20px_rgba(0,0,0,0.02)] rounded-2xl p-4 hover:shadow-md transition-all border-l-4 border-l-sky-500 relative flex flex-col"
                    >
                      {/* Close button to reject request */}
                      <button 
                        onClick={() => handleReject(apt.id, apt.patientName)}
                        title="Từ chối yêu cầu lịch hẹn"
                        className="absolute right-3 top-3 w-6 h-6 rounded-full hover:bg-rose-50 text-slate-400 hover:text-rose-500 flex items-center justify-center cursor-pointer border-none bg-transparent"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>

                      <div className="flex justify-between items-start mb-2 pr-6">
                        <h4 className="font-bold text-slate-800 text-xs tracking-tight">{apt.patientName}</h4>
                      </div>
                      
                      <div className="text-xs text-slate-500 font-medium space-y-1.5 flex-1">
                        <p className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-bold text-slate-600">{apt.date}</span>
                          <span>-</span>
                          <span className="font-bold text-teal-600 bg-teal-50 px-1 rounded">{apt.time}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{apt.service}</span>
                        </p>
                        {apt.doctorName && (
                          <p className="text-[10px] text-slate-400 flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>Bác sĩ chỉ định: <strong className="text-slate-600">{apt.doctorName}</strong></span>
                          </p>
                        )}
                        {apt.notes && (
                          <p className="text-[10px] bg-slate-50 p-2 rounded-xl border border-slate-200/50 italic text-slate-400 font-normal">
                            "{apt.notes}"
                          </p>
                        )}
                      </div>
                      
                      <div className="flex gap-2 mt-4">
                        <button 
                          onClick={() => handleApprove(apt.id, apt.patientName)}
                          className="flex-1 py-2 rounded-xl bg-teal-50 text-teal-700 text-[11px] font-bold hover:bg-teal-100/50 border border-teal-200/10 transition-colors cursor-pointer"
                        >
                          Phê duyệt
                        </button>
                        <button 
                          onClick={() => handleOpenChat(apt.patientId, apt.patientName)}
                          className="flex-1 py-2 rounded-xl bg-slate-100 text-slate-600 text-[11px] font-bold hover:bg-slate-200/60 border border-slate-200/10 transition-colors cursor-pointer"
                        >
                          Liên hệ
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <button 
                onClick={() => setIsAddOpen(true)}
                className="w-full mt-4 py-3 rounded-2xl border border-dashed border-slate-300 text-slate-400 hover:bg-white/40 hover:text-teal-600 hover:border-teal-300 transition-all text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer bg-transparent"
              >
                <UserPlus className="w-4 h-4" /> Tự thêm lịch hẹn trực tiếp
              </button>
            </motion.div>
          </div>
              </motion.div>
            )}

            {activeTab === 'waiting_list' && (
              <motion.div key="waiting_list" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Danh sách Hàng chờ Check-in</h2>
                {/* Future: Inject Waiting list code here */}
                <div className="p-8 backdrop-blur-xl bg-white/40 border border-white/60 shadow-sm rounded-[2rem] text-center text-slate-500 font-medium">
                  Tính năng đang được phát triển...
                </div>
              </motion.div>
            )}

            {activeTab === 'appointments' && (
              <motion.div key="appointments" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Quản lý toàn bộ Lịch hẹn</h2>
                {/* Future: Inject full Appointments management table here */}
                <div className="p-8 backdrop-blur-xl bg-white/40 border border-white/60 shadow-sm rounded-[2rem] text-center text-slate-500 font-medium">
                  Tính năng đang được phát triển...
                </div>
              </motion.div>
            )}

            {activeTab === 'payments' && (
              <motion.div key="payments" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Thanh toán & Hóa đơn</h2>
                {/* Future: Inject Payment management table here */}
                <div className="p-8 backdrop-blur-xl bg-white/40 border border-white/60 shadow-sm rounded-[2rem] text-center text-slate-500 font-medium">
                  Tính năng đang được phát triển...
                </div>
              </motion.div>
            )}

            {activeTab === 'doctor_schedules' && (
              <motion.div key="doctor_schedules" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Cập nhật Lịch Bác sĩ</h2>
                {/* Future: Inject a mock view of Doctor schedules */}
                <div className="p-8 backdrop-blur-xl bg-white/40 border border-white/60 shadow-sm rounded-[2rem] text-center text-slate-500 font-medium">
                  Tính năng đang được phát triển...
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* ─── LIVE CHAT DRAWER INTEGRATION ──────────────────────────────────── */}
      <LiveChatDrawer 
        patient={activeChatPatient}
        isOpen={isChatOpen}
        onClose={() => {
          setIsChatOpen(false);
          setActiveChatPatient(null);
        }}
        messages={chatMessages}
        onSendMessage={handleSendMessage}
      />

      {/* ─── MANUAL APPOINTMENT CREATION MODAL ──────────────────────────────── */}
      <AnimatePresence>
        {isAddOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddOpen(false)}
              className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-[100]"
            />

            {/* Modal Body */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25 }}
              className="fixed inset-0 m-auto w-full max-w-lg h-fit max-h-[90vh] overflow-y-auto backdrop-blur-3xl bg-white/90 border border-white rounded-[2.5rem] shadow-2xl z-[101] p-8 flex flex-col gap-6"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-teal-50 rounded-xl text-teal-600">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-lg text-slate-900 tracking-tight">Thêm lịch hẹn trực tiếp</h3>
                </div>
                <button 
                  onClick={() => setIsAddOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer border-none"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddApt} className="space-y-4 text-xs font-semibold text-slate-700">
                
                {/* Patient Name */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="pname">Họ và tên bệnh nhân <span className="text-rose-500">*</span></label>
                  <input 
                    type="text" 
                    id="pname"
                    required
                    placeholder="VD: Nguyễn Văn Anh"
                    value={newApt.patientName}
                    onChange={(e) => setNewApt(prev => ({ ...prev, patientName: e.target.value }))}
                    className="bg-slate-50/60 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-xs font-medium text-slate-800"
                  />
                </div>

                {/* Patient Phone */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="phone">Số điện thoại bệnh nhân <span className="text-rose-500">*</span></label>
                  <input 
                    type="tel" 
                    id="phone"
                    required
                    placeholder="VD: 0901 234 567"
                    value={newApt.phone}
                    onChange={(e) => setNewApt(prev => ({ ...prev, phone: e.target.value }))}
                    className="bg-slate-50/60 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-xs font-medium text-slate-800"
                  />
                </div>

                {/* Grid: Date & Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="date">Ngày khám</label>
                    <input 
                      type="date" 
                      id="date"
                      required
                      value={newApt.date}
                      onChange={(e) => setNewApt(prev => ({ ...prev, date: e.target.value }))}
                      className="bg-slate-50/60 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-xs font-medium text-slate-800"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="time">Giờ khám</label>
                    <select 
                      id="time"
                      value={newApt.time}
                      onChange={(e) => setNewApt(prev => ({ ...prev, time: e.target.value }))}
                      className="bg-slate-50/60 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-xs font-medium text-slate-800 cursor-pointer"
                    >
                      {(mockTimeSlots || []).map(slot => (
                        <option key={slot} value={slot}>{slot}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Service Selection */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="service">Dịch vụ khám điều trị</label>
                  <select 
                    id="service"
                    value={newApt.service}
                    onChange={(e) => setNewApt(prev => ({ ...prev, service: e.target.value }))}
                    className="bg-slate-50/60 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-xs font-medium text-slate-800 cursor-pointer"
                  >
                    {(mockServices || []).map(svc => (
                      <option key={svc.id} value={svc.name}>{svc.name} - ({svc.price})</option>
                    ))}
                  </select>
                </div>

                {/* Doctor Selection */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="doctor">Bác sĩ phụ trách</label>
                  <select 
                    id="doctor"
                    value={newApt.doctorName}
                    onChange={(e) => setNewApt(prev => ({ ...prev, doctorName: e.target.value }))}
                    className="bg-slate-50/60 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-xs font-medium text-slate-800 cursor-pointer"
                  >
                    {(doctors || []).map(doc => (
                      <option key={doc.id} value={doc.name}>{doc.name} - ({doc.title})</option>
                    ))}
                  </select>
                </div>

                {/* Notes */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="notes">Ghi chú hoặc triệu chứng</label>
                  <textarea 
                    id="notes"
                    placeholder="VD: Viêm da tái phát, dị ứng thực phẩm..."
                    rows={3}
                    value={newApt.notes}
                    onChange={(e) => setNewApt(prev => ({ ...prev, notes: e.target.value }))}
                    className="bg-slate-50/60 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-xs font-medium text-slate-800"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button 
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    className="flex-1 py-3.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 active:scale-95 transition-all cursor-pointer bg-white"
                  >
                    Hủy bỏ
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-teal-600 to-sky-600 text-white font-bold hover:shadow-lg hover:shadow-teal-600/10 active:scale-95 transition-all cursor-pointer border-none"
                  >
                    Đặt lịch & Check-in
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── CUSTOM ANIMATED TOAST NOTIFICATION ─────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9, x: "-50%" }}
            animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
            exit={{ opacity: 0, y: 20, scale: 0.9, x: "-50%" }}
            className={`fixed bottom-6 left-1/2 z-[110] p-4 rounded-2xl shadow-xl backdrop-blur-xl flex items-center gap-3 border ${
              toast.type === 'success'
                ? 'bg-emerald-600/90 border-emerald-500 text-white shadow-emerald-600/20'
                : toast.type === 'info'
                  ? 'bg-sky-600/90 border-sky-500 text-white shadow-sky-600/20'
                  : 'bg-rose-600/90 border-rose-500 text-white shadow-rose-600/20'
            }`}
            style={{ left: '50%', transform: 'translateX(-50%)' }}
          >
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              {toast.type === 'success' ? (
                <CheckSquare className="w-3.5 h-3.5" />
              ) : toast.type === 'info' ? (
                <Sparkles className="w-3.5 h-3.5" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5" />
              )}
            </div>
            <p className="text-xs font-bold whitespace-nowrap">{toast.message}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
