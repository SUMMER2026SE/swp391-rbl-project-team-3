import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { NotificationModel } from '../models/NotificationModel';
import { DoctorModel } from '../models/DoctorModel';
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
  Users, 
  Calendar, 
  LogOut, 
  Search, 
  Bell, 
  Settings, 
  User,
  Star,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  CheckCircle2,
  MessageSquare,

} from 'lucide-react';

// Import Mock Data
import { mockAppointments, mockAssignedTasks, mockPatients } from '../mockData';

// Import Tab Components
import DashboardOverview from '../components/Doctor/DashboardOverview';
import ScheduleWaitingList from '../components/Doctor/ScheduleWaitingList';
import WorkSchedule from '../components/Doctor/WorkSchedule';
import VirtualClinicWorkspace from '../components/Doctor/VirtualClinic/VirtualClinicWorkspace';
import DoctorFeedbackView from '../components/Doctor/DoctorFeedbackView';
import { doctors } from '../mockData';
import LiquidSidebarMenu from '../components/ui/LiquidSidebarMenu';


export default function DoctorDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // State-based routing
  const [activeTab, setActiveTab] = useState('overview');
  const [activeAppointment, setActiveAppointment] = useState(null);
  const [notifications, setNotifications] = useState(() => NotificationModel.getAll());
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [appointments, setAppointments] = useState(mockAppointments);
  const [showToast, setShowToast] = useState(false);
  const [currentDoctorId, setCurrentDoctorId] = useState(
    (user?.id && typeof user.id === 'string' && user.id.startsWith('doc-')) ? user.id : 'doc-01'
  );
  const activeDoctor = doctors.find(d => d.id === currentDoctorId) || doctors[0];


  // Dynamic Page Title
  const getPageTitle = () => {
    if (activeAppointment) {
      return `Phòng khám ảo: ${activeAppointment.patientName}`;
    }
    const tabNames = {
      overview: 'Tổng quan',
      waiting_list: 'Hàng chờ & Lịch khám',
      schedule: 'Lịch làm việc',
      feedback: 'Đánh giá',
    };
    return tabNames[activeTab] || 'Tổng quan';
  };

  const handleCompleteExamination = (appointmentId, selectedServices = [], clinicalData = null) => {
    // 1. Update local React state
    setAppointments((prev) =>
      prev.map((app) => (app.id === appointmentId ? { ...app, status: 'Đã khám', examRecord: clinicalData } : app))
    );

    // 2. Update global mock data to persist across tab switches
    const foundApt = mockAppointments?.find((a) => a.id === appointmentId);
    if (foundApt) {
      foundApt.status = 'Đã khám';
      foundApt.examRecord = clinicalData;
    }

    // 3. Create assigned tasks in mockAssignedTasks
    if (selectedServices.length > 0 && foundApt) {
      const patient = mockPatients?.find((p) => p.id === foundApt.patientId);
      selectedServices.forEach((serviceId, index) => {
        let procedureType = '';
        if (serviceId === 'soi-da') procedureType = 'Soi da cắt lớp AI';
        else if (serviceId === 'xet-nghiem-mau') procedureType = 'Xét nghiệm máu (Gan/Thận)';
        else if (serviceId === 'lay-nhan-mun') procedureType = 'Lấy nhân mụn chuẩn y khoa';
        else if (serviceId === 'dien-di') procedureType = 'Điện di Vitamin C';
        else if (serviceId === 'peel-da') procedureType = 'Peel da điều trị mụn';
        else if (serviceId === 'chieu-den') procedureType = 'Chiếu đèn sinh học Omega Light';
        else procedureType = serviceId;


        const newTask = {
          id: `TASK-${Date.now()}-${index}`,
          patientId: foundApt.patientId || 'pat-unknown',
          patientName: foundApt.patientName || 'Bệnh nhân',
          age: patient?.dob ? new Date().getFullYear() - new Date(patient.dob).getFullYear() : 30,
          gender: patient?.gender || 'Nữ',
          procedureType,
          assignedBy: foundApt.doctorName || 'Bác sĩ điều trị',
          status: 'Chờ thực hiện',
          requestTime: new Date().toISOString(),
          notes: 'Chỉ định từ phòng khám ảo (Khám lâm sàng)',
          procedureDetails: {
            type: serviceId === 'soi-da' ? 'Imaging' : 'LabTest',
          },
        };
        mockAssignedTasks.push(newTask);
      });
    }

    // 4. Close the Virtual Clinic
    setActiveAppointment(null);

    // 5. Trigger success toast
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  const doctorId = DoctorModel.getDoctorById(user?.id) ? user.id : 'doc-01';

  useEffect(() => {
    const handleUpdate = () => {
      setNotifications(NotificationModel.getAll());
    };

    window.addEventListener('notifications-updated', handleUpdate);
    return () => window.removeEventListener('notifications-updated', handleUpdate);
  }, []);

  const myNotifications = notifications.filter(
    (n) => n.recipientRole === 'DOCTOR' && (n.recipientId === doctorId || n.recipientId === 'all')
  );
  const unreadCount = myNotifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = () => {
    NotificationModel.markAllAsRead('DOCTOR', doctorId);
  };

  /* --------------------------------------------------------------
     Continuous scroll-linked navbar morph (Part 2).
     -------------------------------------------------------------- */
  const scrollRef = useRef(null);
  const { scrollY } = useScroll({ container: scrollRef });

  const spring = { stiffness: 220, damping: 32, mass: 0.9 };
  const widthRaw = useTransform(scrollY, [0, 120], [100, 90]);
  const maxWRaw = useTransform(scrollY, [0, 120], [1600, 1140]);
  const radiusRaw = useTransform(scrollY, [0, 120], [0, 32]);
  const topRaw = useTransform(scrollY, [0, 120], [0, 16]);
  const padXRaw = useTransform(scrollY, [0, 120], [32, 30]);
  const bgRaw = useTransform(scrollY, [0, 120], [0, 0.72]);
  const shadowRaw = useTransform(scrollY, [0, 120], [0, 0.12]);
  const ringRaw = useTransform(scrollY, [0, 120], [0, 0.7]);

  const widthMV = useSpring(widthRaw, spring);
  const maxWMV = useSpring(maxWRaw, spring);
  const radiusMV = useSpring(radiusRaw, spring);
  const topMV = useSpring(topRaw, spring);
  const padXMV = useSpring(padXRaw, spring);
  const bgMV = useSpring(bgRaw, spring);
  const shadowMV = useSpring(shadowRaw, spring);
  const ringMV = useSpring(ringRaw, spring);

  const navWidth = useMotionTemplate`${widthMV}%`;
  const navMaxWidth = useMotionTemplate`${maxWMV}px`;
  const navRadius = useMotionTemplate`${radiusMV}px`;
  const navTop = useMotionTemplate`${topMV}px`;
  const navPadX = useMotionTemplate`${padXMV}px`;
  const navBg = useMotionTemplate`rgba(255, 255, 255, ${bgMV})`;
  const navShadow = useMotionTemplate`0 14px 40px rgba(2, 32, 29, ${shadowMV}), inset 0 1px 2px rgba(255,255,255,0.9), inset 0 0 0 1px rgba(255,255,255,${ringMV})`;

  const navItems = [
    { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'waiting_list', label: 'Hàng chờ & Lịch khám', icon: Users },
    { id: 'schedule', label: 'Lịch làm việc', icon: Calendar },
    { id: 'feedback', label: 'Đánh giá', icon: Star },
  ];

  return (
    <div className="min-h-screen bg-transparent relative overflow-x-hidden flex w-full font-sans antialiased text-slate-800">
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

      {/* Compact Glass Sidebar — icon-only by default, expands on hover */}
      <motion.aside
        animate={{ width: isSidebarExpanded ? 256 : 80 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="hidden md:flex bg-white/40 backdrop-blur-2xl border-r border-white/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.07),inset_0_0_20px_rgba(255,255,255,0.5)] dark:bg-slate-900/40 dark:border-slate-700/50 fixed h-full z-40 flex-col py-8 px-3 justify-between overflow-hidden transition-all duration-500 ease-out"
      >
        <div className="flex flex-col gap-6">
          {/* Logo & Toggle Header */}
          <div className={`flex items-center ${isSidebarExpanded ? 'justify-between px-1' : 'justify-center'} min-h-[44px]`}>
            {isSidebarExpanded ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-teal-500/25 flex-shrink-0">
                    DS
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent whitespace-nowrap font-black animate-fadeIn">
                      DermaSmart
                    </span>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap animate-fadeIn">
                      Doctor Portal
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsSidebarExpanded(false)}
                  className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-emerald-600 transition-colors cursor-pointer"
                  title="Thu gọn"
                >
                  <PanelLeftClose className="w-5 h-5" />
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsSidebarExpanded(true)}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-emerald-600 transition-colors cursor-pointer"
                title="Mở rộng"
              >
                <PanelLeftOpen className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <LiquidSidebarMenu
            items={navItems}
            activeId={activeTab}
            onChange={(id) => {
              setActiveTab(id);
              setActiveAppointment(null);
            }}
            isSidebarExpanded={isSidebarExpanded}
          />
        </div>

        {/* Footer actions */}
        <div className="border-t border-slate-100/60 pt-4 space-y-1">
          <div className="relative group">
            <button
              onClick={() => navigate('/profile')}
              className={`w-full flex items-center gap-3 rounded-xl font-medium text-slate-600 hover:text-teal-600 hover:bg-teal-50/40 transition-all ${
                isSidebarExpanded ? 'px-4 py-3' : 'px-0 py-3 justify-center'
              }`}
            >
              <User className="w-5 h-5 text-slate-400 flex-shrink-0" />
              <AnimatePresence>
                {isSidebarExpanded && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-sm whitespace-nowrap"
                  >
                    Hồ sơ cá nhân
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
            {!isSidebarExpanded && (
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                Hồ sơ cá nhân
              </div>
            )}
          </div>
          <div className="relative group">
            <button
              onClick={async () => {
                await logout();
                navigate('/login');
              }}
              className={`w-full flex items-center gap-3 rounded-xl font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50/40 transition-all ${
                isSidebarExpanded ? 'px-4 py-3' : 'px-0 py-3 justify-center'
              }`}
            >
              <LogOut className="w-5 h-5 text-slate-400 flex-shrink-0" />
              <AnimatePresence>
                {isSidebarExpanded && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-sm whitespace-nowrap"
                  >
                    Đăng xuất
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
            {!isSidebarExpanded && (
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                Đăng xuất
              </div>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Main Content Area — margin adapts to compact sidebar */}
      <div
        ref={scrollRef}
        className={`flex-1 flex flex-col h-screen overflow-y-auto z-10 transition-all duration-300 ${
          isSidebarExpanded ? 'md:ml-64' : 'md:ml-20'
        }`}
      >
        {/* Continuous Morphing Pill Topbar */}
        <motion.header
          style={{
            position: 'sticky',
            top: navTop,
            zIndex: 50,
            margin: '0 auto',
            left: 0,
            right: 0,
            width: navWidth,
            maxWidth: navMaxWidth,
            borderRadius: navRadius,
            paddingLeft: navPadX,
            paddingRight: navPadX,
            backgroundColor: navBg,
            boxShadow: navShadow,
          }}
          className="backdrop-blur-2xl flex justify-between items-center h-20 transition-all duration-500 ease-out"
        >
          <div className="flex items-center gap-4">
            <span className="font-black text-2xl text-gradient-emerald md:hidden tracking-tight">DermaSmart</span>
            <h1 className="text-xl md:text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-800 to-teal-500 tracking-tight whitespace-nowrap mr-6">
              {getPageTitle()}
            </h1>
            <div className="hidden md:flex items-center glass-inner rounded-full pl-4 pr-5 py-2.5 focus-within:ring-2 focus-within:ring-teal-500/30 focus-within:border-teal-400 transition-all">
              <Search className="w-[18px] h-[18px] text-slate-400 mr-2.5" />
              <input
                className="bg-transparent border-none outline-none text-[15px] font-medium text-slate-700 placeholder-slate-400 w-72 p-0 focus:ring-0"
                placeholder="Tìm kiếm bệnh nhân, hồ sơ..."
                type="text"
              />
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div className="text-right hidden md:block">
              {!user?.isSupabase ? (
                <div className="flex flex-col items-end">
                  <select
                    value={currentDoctorId}
                    onChange={(e) => setCurrentDoctorId(e.target.value)}
                    className="font-bold text-sm text-slate-900 bg-white/80 border border-slate-200 rounded-xl px-3 py-1.5 outline-none focus:border-teal-500 transition-all text-right shadow-sm cursor-pointer"
                  >
                    {doctors.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Doctor Portal (Demo)</span>
                </div>
              ) : (
                <>
                  <p className="font-bold text-sm text-slate-900 leading-none">{user?.name || 'BS. CKII. Trần Văn A'}</p>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Doctor Portal</span>
                </>
              )}

            </div>
            <div className="flex items-center gap-2.5 text-slate-500">
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="hover:bg-white/70 hover:text-teal-600 transition-all p-2.5 rounded-full relative active:scale-95 border-none cursor-pointer bg-transparent flex items-center justify-center"
                >
                  <Bell className="w-[22px] h-[22px]" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white"></span>
                  )}
                </button>

                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-80 bg-white/40 backdrop-blur-2xl border border-white/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.07),inset_0_0_20px_rgba(255,255,255,0.5)] dark:bg-slate-900/40 dark:border-slate-700/50 rounded-2xl p-4 z-50 max-h-[350px] overflow-y-auto transition-all duration-500 ease-out"
                    >
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100 mb-2">
                        <span className="text-sm font-bold text-slate-800">Thông báo của bạn</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-[10px] text-teal-600 hover:text-teal-700 font-bold border-none bg-transparent cursor-pointer"
                          >
                            Đọc tất cả
                          </button>
                        )}
                      </div>
                      <div className="space-y-2.5">
                        {myNotifications.length === 0 ? (
                          <p className="text-xs text-slate-400 italic text-center py-4">Chưa có thông báo nào.</p>
                        ) : (
                          myNotifications.map((notif) => (
                            <div
                              key={notif.id}
                              onClick={() => {
                                NotificationModel.markAsRead(notif.id);
                              }}
                              className={`p-2.5 rounded-xl transition-all border cursor-pointer text-left ${
                                notif.isRead
                                  ? 'bg-transparent border-slate-100 hover:bg-slate-50'
                                  : 'bg-teal-50/50 border-teal-100/50 hover:bg-teal-50'
                              }`}
                            >
                              <p className="text-xs font-bold text-slate-800">{notif.title}</p>
                              <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{notif.content}</p>
                              <span className="text-[8px] text-slate-400 block mt-1.5">
                                {new Date(notif.timestamp).toLocaleString('vi-VN')}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <button className="hover:bg-white/70 hover:text-teal-600 transition-all p-2.5 rounded-full active:scale-95">
                <Settings className="w-[22px] h-[22px]" />
              </button>
              <button className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 active:scale-95 transition-transform flex items-center justify-center">
                {activeDoctor?.image ? (
                  <img src={activeDoctor.image} alt={activeDoctor.name} className="w-full h-full object-cover object-top" />
                ) : (
                  <div className="w-full h-full bg-teal-50 flex items-center justify-center text-teal-600 font-bold text-xs">
                    <User className="w-4 h-4" />
                  </div>
                )}

              </button>
            </div>
          </div>
        </motion.header>

        {/* Dashboard Content Container */}
        <main className="p-8 max-w-7xl w-full mx-auto">
          {activeAppointment ? (
            <VirtualClinicWorkspace 
              appointment={activeAppointment} 
              onBack={() => setActiveAppointment(null)} 
              handleCompleteExamination={handleCompleteExamination}
            />
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'overview' && <DashboardOverview doctorId={currentDoctorId} />}
              {activeTab === 'waiting_list' && (
                <ScheduleWaitingList 
                  doctorId={currentDoctorId} 
                  onStartExam={setActiveAppointment} 
                  appointments={appointments}
                />
              )}
              {activeTab === 'schedule' && <WorkSchedule doctorId={currentDoctorId} />}
              {activeTab === 'feedback' && <DoctorFeedbackView doctorId={currentDoctorId} />}
            </motion.div>
          )}
        </main>
      </div>

      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-8 right-8 z-50 flex items-center gap-3 backdrop-blur-2xl bg-emerald-500/90 text-white px-6 py-4 rounded-2xl shadow-lg shadow-emerald-500/20 border border-emerald-400/50"
          >
            <CheckCircle2 className="w-5 h-5 text-white" />
            <span className="font-bold text-sm">Hồ sơ bệnh án đã lưu thành công!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
