import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GLASS_INPUT } from '../components/common/GlassCard';
import { ServiceTicketModel } from '../models/ServiceTicketModel';
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
} from 'lucide-react';
import TechnicianOverview from '../components/Technician/Overview/TechnicianOverview';
import AssignedTasksList from '../components/Technician/AssignedTasks/AssignedTasksList';
import TechnicianSchedule from '../components/Technician/WorkSchedule/TechnicianSchedule';
import TechnicianWorkspace from '../components/Technician/ProcedureWorkspace/TechnicianWorkspace';
import TechnicianFeedbackView from '../components/Technician/TechnicianFeedbackView';
import LiquidSidebarMenu from '../components/ui/LiquidSidebarMenu';
import logo from '../assets/logo.png';

export default function TechnicianDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  /* ───────── state ───────── */
  const [activeTab, setActiveTab] = useState('overview');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [activeTask, setActiveTask] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // PHASE 3 — Doctor → Technician read path. Map a service_ticket row into the
  // task shape the workspace/list components already consume.
  const mapTicket = (t) => ({
    id: t.id,
    appointmentId: t.appointment_id,
    patientId: t.appointment?.patient_id || null,
    patientName: t.appointment?.patient_name || 'Bệnh nhân',
    procedureType: t.service_name,
    procedure: t.service_name,
    service: t.service_name,
    status: t.status === 'TECH_COMPLETED' ? 'Đã hoàn thành' : 'Chờ thực hiện',
    createdAt: t.created_at,
    requestTime: t.created_at,
    resultRecord:
      t.status === 'TECH_COMPLETED'
        ? {
            technicianNotes: t.result_notes || '',
            images: t.result_image_url
              ? [{ id: 'res-0', url: t.result_image_url, name: 'result.jpg' }]
              : [],
            metrics: {},
          }
        : null,
  });

  const loadTasks = useCallback(async () => {
    try {
      const tickets = await ServiceTicketModel.getActiveTickets();
      setTasks((Array.isArray(tickets) ? tickets : []).map(mapTicket));
    } catch (err) {
      console.error('Failed to load technician tasks:', err);
      setTasks([]);
    }
  }, []);

  // Initial load + light polling so indications a doctor just routed appear
  // without a manual refresh.
  useEffect(() => {
    loadTasks();
    const interval = setInterval(loadTasks, 5000);
    return () => clearInterval(interval);
  }, [loadTasks]);

  /* ───────── dynamic page title ───────── */
  const getPageTitle = () => {
    if (activeTask) {
      return `Phòng Kỹ thuật: ${activeTask.patientName}`;
    }
    const tabNames = {
      overview: 'Tổng quan',
      tasks: 'Danh sách Chỉ định',
      schedule: 'Lịch làm việc',
      feedback: 'Đánh giá',
    };
    return tabNames[activeTab] || 'Tổng quan';
  };

  /* ───────── scroll-linked navbar ───────── */
  const scrollRef = useRef(null);
  const { scrollY } = useScroll({ container: scrollRef });

  const springCfg = { stiffness: 220, damping: 32, mass: 0.9 };

  const rawWidth = useTransform(scrollY, [0, 120], [100, 90]);
  const rawMaxW = useTransform(scrollY, [0, 120], [1600, 1140]);
  const rawRadius = useTransform(scrollY, [0, 120], [0, 32]);
  const rawTop = useTransform(scrollY, [0, 120], [0, 16]);
  const rawPX = useTransform(scrollY, [0, 120], [32, 30]);
  const rawBgOpacity = useTransform(scrollY, [0, 120], [0, 0.72]);
  const rawShadowOpacity = useTransform(scrollY, [0, 120], [0, 0.12]);
  const rawRingOpacity = useTransform(scrollY, [0, 120], [0, 0.7]);

  const widthMV = useSpring(rawWidth, springCfg);
  const maxWMV = useSpring(rawMaxW, springCfg);
  const radiusMV = useSpring(rawRadius, springCfg);
  const topMV = useSpring(rawTop, springCfg);
  const pxMV = useSpring(rawPX, springCfg);
  const bgMV = useSpring(rawBgOpacity, springCfg);
  const shadowMV = useSpring(rawShadowOpacity, springCfg);
  const ringMV = useSpring(rawRingOpacity, springCfg);

  const navWidth = useMotionTemplate`${widthMV}%`;
  const navMaxWidth = useMotionTemplate`${maxWMV}px`;
  const navBorderRadius = useMotionTemplate`${radiusMV}px`;
  const navTop = useMotionTemplate`${topMV}px`;
  const navPaddingX = useMotionTemplate`${pxMV}px`;
  const navBg = useMotionTemplate`rgba(255, 255, 255, ${bgMV})`;
  const navShadow = useMotionTemplate`0 14px 40px rgba(2, 32, 29, ${shadowMV}), inset 0 1px 2px rgba(255,255,255,0.9), inset 0 0 0 1px rgba(255,255,255,${ringMV})`;

  /* ───────── nav items ───────── */
  const navItems = [
    { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'tasks', label: 'Danh sách Chỉ định', icon: ClipboardList },
    { id: 'schedule', label: 'Lịch làm việc', icon: Calendar },
    { id: 'feedback', label: 'Đánh giá', icon: Star },
  ];

  /* ───────── handlers ───────── */
  // PHASE 3 — Technician result feedback loop. Persist the completion to the
  // service_tickets row so the Doctor's workspace can read tech notes/images.
  const handleCompleteTask = async (taskId, resultRecord) => {
    try {
      await ServiceTicketModel.update(taskId, {
        status: 'TECH_COMPLETED',
        result_notes: resultRecord?.technicianNotes || '',
        result_image_url: resultRecord?.images?.[0]?.url || null,
        technician_id: user?.id || null,
        updated_at: new Date().toISOString(),
      });
      await loadTasks();
    } catch (err) {
      console.error('Failed to save technician result:', err);
    }
    setActiveTask(null);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleSelectTask = (task) => {
    setActiveTask(task);
  };

  const handleReviewTask = (task) => {
    setActiveTask(task);
  };

  /* ───────── content renderer ───────── */
  const renderContent = () => {
    if (activeTask) {
      if (activeTask.status === 'Đã hoàn thành') {
        return (
          <TechnicianWorkspace
            task={activeTask}
            onBack={() => setActiveTask(null)}
            isReviewMode={true}
          />
        );
      }
      return (
        <TechnicianWorkspace
          task={activeTask}
          onBack={() => setActiveTask(null)}
          onComplete={handleCompleteTask}
          isReviewMode={false}
        />
      );
    }

    switch (activeTab) {
      case 'overview':
        return <TechnicianOverview tasks={tasks} />;
      case 'tasks':
        return (
          <AssignedTasksList
            tasks={tasks}
            onExecuteTask={handleSelectTask}
            onReviewTask={handleReviewTask}
          />
        );
      case 'schedule':
        return <TechnicianSchedule />;
      case 'feedback':
        return <TechnicianFeedbackView />;
      default:
        return <TechnicianOverview tasks={tasks} />;
    }
  };

  /* ═══════════════════════════════════════════ JSX ═══════════════════════════════════════════ */
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-teal-50 via-emerald-100 to-cyan-50 overflow-hidden">
      {/* ─── Background Blobs ─── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full bg-emerald-400/30 blur-3xl"
          style={{ animation: 'float 18s ease-in-out infinite' }}
        />
        <div
          className="absolute -bottom-40 -right-40 w-[480px] h-[480px] rounded-full bg-cyan-400/30 blur-3xl"
          style={{ animation: 'float-reverse 20s ease-in-out infinite' }}
        />
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -40px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.97); }
        }
        @keyframes float-reverse {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-30px, 30px) scale(0.95); }
          66% { transform: translate(25px, -25px) scale(1.04); }
        }
      `}</style>

      {/* ─── Sidebar ─── */}
      <motion.aside
        animate={{ width: isSidebarExpanded ? 256 : 80 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="hidden md:flex backdrop-blur-2xl bg-teal-900/10 border-r border-teal-900/10 fixed h-full z-40 flex-col py-8 px-3 justify-between shadow-[4px_0_24px_rgba(0,0,0,0.03),inset_-1px_0_2px_rgba(255,255,255,0.7)] overflow-hidden"
      >
        {/* Sidebar Top */}
        <div className="flex flex-col gap-6">
          {/* Logo & Toggle Header */}
          <div className={`flex items-center ${isSidebarExpanded ? 'justify-between px-1' : 'justify-center'} min-h-[80px]`}>
            {isSidebarExpanded ? (
              <>
                <div className="flex flex-col items-start gap-1">
                  <img src={logo} alt="DermaSmart Logo" className="h-16 w-auto object-contain" />
                  <span className="text-[10px] text-gray-500 whitespace-nowrap animate-fadeIn">
                    Technician Portal
                  </span>
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

          {/* Nav Items */}
          <LiquidSidebarMenu
            items={navItems}
            activeId={activeTab === 'overview' && activeTask ? '' : activeTab}
            onChange={(id) => {
              setActiveTab(id);
              setActiveTask(null);
            }}
            isSidebarExpanded={isSidebarExpanded}
          />
        </div>

        {/* Sidebar Footer */}
        <div className="flex flex-col gap-2">


          {/* Logout */}
          <motion.button
            onClick={async () => {
              await logout();
              navigate('/login');
            }}
            className="relative flex items-center gap-3 px-3 py-2.5 rounded-2xl text-red-400 hover:text-red-600 hover:bg-red-50/60 transition-all duration-200 group"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <LogOut size={20} className="flex-shrink-0" />
            <AnimatePresence>
              {isSidebarExpanded && (
                <motion.span
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.18 }}
                  className="text-sm font-medium whitespace-nowrap"
                >
                  Đăng xuất
                </motion.span>
              )}
            </AnimatePresence>
            {!isSidebarExpanded && (
              <div className="absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-slate-800 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl z-50">
                Đăng xuất
              </div>
            )}
          </motion.button>
        </div>
      </motion.aside>

      {/* ─── Main Content Area ─── */}
      <div
        className={`transition-all duration-300 ${
          isSidebarExpanded ? 'md:ml-64' : 'md:ml-20'
        }`}
      >
        {/* Scroll container */}
        <div ref={scrollRef} className="h-screen overflow-y-auto relative">
          {/* ─── Navbar ─── */}
          <motion.header
            style={{
              width: navWidth,
              maxWidth: navMaxWidth,
              borderRadius: navBorderRadius,
              top: navTop,
              paddingLeft: navPaddingX,
              paddingRight: navPaddingX,
              backgroundColor: navBg,
              boxShadow: navShadow,
            }}
            className="sticky mx-auto z-30 py-4 backdrop-blur-2xl"
          >
            <div className="relative flex items-center justify-between gap-4 w-full">
              <div className="flex items-center gap-4 flex-1">
                <span className="font-black text-2xl text-gradient-emerald md:hidden tracking-tight">DermaSmart</span>
                <div className="relative flex-1 max-w-md">
                  <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    placeholder="Tìm kiếm chỉ định, bệnh nhân..."
                    className={`w-full pl-11 pr-4 py-2.5 text-sm ${GLASS_INPUT}`}
                  />
                </div>
              </div>
              <h1 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xl md:text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-800 to-emerald-700 tracking-tight whitespace-nowrap pointer-events-none">
                {getPageTitle()}
              </h1>

              {/* Right side */}
              <div className="flex items-center gap-3">
                {/* User info */}
                <div className="hidden lg:flex flex-col items-end mr-1">
                  <span className="text-sm font-semibold text-gray-900">
                    {user?.name || 'KTV. Lê Thị C'}
                  </span>
                  <span className="text-[11px] text-gray-500">
                    Technician Portal
                  </span>
                </div>

                {/* Bell */}
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative w-10 h-10 rounded-2xl bg-white/50 border border-white/60 backdrop-blur-md flex items-center justify-center text-slate-500 hover:text-emerald-600 shadow-sm transition-colors"
                >
                  <Bell size={18} />
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white" />
                </motion.button>

                {/* Settings */}
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 rounded-2xl bg-white/50 border border-white/60 backdrop-blur-md flex items-center justify-center text-slate-500 hover:text-emerald-600 shadow-sm transition-colors"
                >
                  <Settings size={18} />
                </motion.button>

                {/* Avatar */}
                <div className="relative">
                  <motion.button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 cursor-pointer transition-transform hover:scale-105 ring-2 ring-transparent hover:ring-emerald-500/50"
                  >
                    <User size={18} className="text-white" />
                  </motion.button>

                  <AnimatePresence>
                    {showProfileMenu && (
                      <>
                        {/* Click-away backdrop */}
                        <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                        
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute right-0 mt-2 w-56 bg-white/90 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-2xl p-2 z-50 origin-top-right text-left"
                        >
                          <div className="px-3 py-2.5 border-b border-slate-100 mb-1">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tài khoản</p>
                            <p className="text-sm font-bold text-slate-800 truncate mt-0.5">{user?.name || 'Kỹ thuật viên'}</p>
                            <p className="text-[11px] text-emerald-600 font-medium truncate">{user?.email || 'tech@dermasmart.com'}</p>
                          </div>
                          
                          <button
                            onClick={() => {
                              setShowProfileMenu(false);
                              navigate('/profile');
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:text-emerald-600 hover:bg-emerald-50/50 transition-colors border-none bg-transparent cursor-pointer text-left"
                          >
                            <User className="w-4 h-4 text-slate-400" />
                            Xem hồ sơ cá nhân
                          </button>

                          <button
                            onClick={async () => {
                              setShowProfileMenu(false);
                              await logout();
                              navigate('/login');
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50/50 transition-colors border-none bg-transparent cursor-pointer text-left"
                          >
                            <LogOut className="w-4 h-4 text-rose-400" />
                            Đăng xuất
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.header>

          {/* ─── Page Content ─── */}
          <main className="relative z-10 px-4 md:px-8 py-8 max-w-[1600px] mx-auto">
            {/* Keyed remount instead of AnimatePresence mode="wait" (whose exit
                stalled and blocked tab/task content from swapping). */}
            <motion.div
              key={
                activeTask
                  ? `task-${activeTask.id}`
                  : `tab-${activeTab}`
              }
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              {renderContent()}
            </motion.div>
          </main>
        </div>
      </div>

      {/* ─── Toast ─── */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="fixed bottom-8 right-8 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-2xl shadow-emerald-500/30"
          >
            <CheckCircle2 size={22} className="flex-shrink-0" />
            <span className="text-sm font-semibold">
              Kết quả thủ thuật đã được ghi nhận!
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
