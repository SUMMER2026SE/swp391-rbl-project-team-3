import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
import { mockAssignedTasks } from '../mockData';
import TechnicianOverview from '../components/Technician/Overview/TechnicianOverview';
import AssignedTasksList from '../components/Technician/AssignedTasks/AssignedTasksList';
import TechnicianSchedule from '../components/Technician/WorkSchedule/TechnicianSchedule';
import TechnicianWorkspace from '../components/Technician/ProcedureWorkspace/TechnicianWorkspace';
import TechnicianFeedbackView from '../components/Technician/TechnicianFeedbackView';
import LiquidSidebarMenu from '../components/ui/LiquidSidebarMenu';

export default function TechnicianDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  /* ───────── state ───────── */
  const [activeTab, setActiveTab] = useState('overview');
  const [activeTask, setActiveTask] = useState(null);
  const [tasks, setTasks] = useState(mockAssignedTasks || []);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [showToast, setShowToast] = useState(false);

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
  const handleCompleteTask = (taskId, resultRecord) => {
    const updatedTasks = tasks.map((t) =>
      t.id === taskId ? { ...t, status: 'Đã hoàn thành', resultRecord } : t
    );
    setTasks(updatedTasks);
    // Also update global mock
    const found = mockAssignedTasks?.find((t) => t.id === taskId);
    if (found) {
      found.status = 'Đã hoàn thành';
      found.resultRecord = resultRecord;
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
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 overflow-hidden">
      {/* ─── Background Blobs ─── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full bg-emerald-300/15 blur-[120px]"
          style={{ animation: 'float 18s ease-in-out infinite' }}
        />
        <div
          className="absolute -bottom-40 -right-40 w-[480px] h-[480px] rounded-full bg-sky-300/15 blur-[120px]"
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
        className="hidden md:flex backdrop-blur-2xl bg-white/30 border-r border-white/40 fixed h-full z-40 flex-col py-8 px-3 justify-between shadow-[4px_0_24px_rgba(0,0,0,0.03),inset_-1px_0_2px_rgba(255,255,255,0.7)] overflow-hidden"
      >
        {/* Sidebar Top */}
        <div className="flex flex-col gap-6">
          {/* Logo & Toggle Header */}
          <div className={`flex items-center ${isSidebarExpanded ? 'justify-between px-1' : 'justify-center'} min-h-[44px]`}>
            {isSidebarExpanded ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25 flex-shrink-0">
                    <span className="text-white font-bold text-sm">DS</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent whitespace-nowrap font-black animate-fadeIn">
                      DermaSmart
                    </span>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap animate-fadeIn">
                      Technician Portal
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
          {/* Profile */}
          <motion.button
            className="relative flex items-center gap-3 px-3 py-2.5 rounded-2xl text-slate-600 hover:text-teal-700 hover:bg-teal-50/60 transition-all duration-200 group"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0">
              <User size={16} className="text-white" />
            </div>
            <AnimatePresence>
              {isSidebarExpanded && (
                <motion.span
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.18 }}
                  className="text-sm font-medium whitespace-nowrap"
                >
                  Hồ sơ
                </motion.span>
              )}
            </AnimatePresence>
            {!isSidebarExpanded && (
              <div className="absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-slate-800 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl z-50">
                Hồ sơ
              </div>
            )}
          </motion.button>

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
            <div className="flex items-center justify-between gap-4 w-full">
              <div className="flex items-center gap-4 flex-1">
                <span className="font-black text-2xl text-gradient-emerald md:hidden tracking-tight">DermaSmart</span>
                <h1 className="text-xl md:text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-800 to-teal-500 tracking-tight whitespace-nowrap mr-6">
                  {getPageTitle()}
                </h1>
                <div className="relative flex-1 max-w-md">
                  <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    placeholder="Tìm kiếm chỉ định, bệnh nhân..."
                    className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-white/40 border border-white/60 backdrop-blur-md text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-300/60 shadow-inner shadow-white/20 transition-all"
                  />
                </div>
              </div>

              {/* Right side */}
              <div className="flex items-center gap-3">
                {/* User info */}
                <div className="hidden lg:flex flex-col items-end mr-1">
                  <span className="text-sm font-semibold text-slate-700">
                    {user?.name || 'KTV. Lê Thị C'}
                  </span>
                  <span className="text-[11px] text-slate-400">
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
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20"
                >
                  <User size={18} className="text-white" />
                </motion.button>
              </div>
            </div>
          </motion.header>

          {/* ─── Page Content ─── */}
          <main className="relative z-10 px-4 md:px-8 py-8 max-w-[1600px] mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={
                  activeTask
                    ? `task-${activeTask.id}`
                    : `tab-${activeTab}`
                }
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
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
