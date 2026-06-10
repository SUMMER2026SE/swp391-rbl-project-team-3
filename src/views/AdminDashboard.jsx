import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  Ticket,
  FileText,
  LogOut,
  Search,
  Bell,
  ChevronDown,
  Calendar,
  Clock,
  Star,
  TrendingUp,
} from 'lucide-react';
import AdminOverview from '../components/Admin/AdminOverview';
import EmployeeManagement from '../components/Admin/EmployeeManagement';
import FeedbackDashboard from '../components/Admin/FeedbackDashboard';
import ServiceManagement from '../components/Admin/ServiceManagement';
import DoctorScheduleManagement from '../components/Admin/DoctorScheduleManagement';
import ConsultationTimeManagement from '../components/Admin/ConsultationTimeManagement';
import RevenueStatistics from '../components/Admin/RevenueStatistics';
import VoucherManagement from '../components/Admin/VoucherManagement';
import ReportsPage from '../components/Admin/ReportsPage';

// Placeholder components for other tabs
const PlaceholderTab = ({ title }) => (
  <div className="flex items-center justify-center h-full">
    <h2 className="text-2xl font-bold text-slate-400">{title} Component (Coming Soon)</h2>
  </div>
);

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'employees', label: 'Quản lý Nhân sự', icon: Users },
    { id: 'services', label: 'Quản lý Dịch vụ', icon: Stethoscope },
    { id: 'doctorSchedule', label: 'Lịch bác sĩ', icon: Calendar },
    { id: 'consultationTime', label: 'Khung giờ khám', icon: Clock },
    { id: 'vouchers', label: 'Quản lý Voucher', icon: Ticket },
    { id: 'feedback', label: 'Đánh giá', icon: Star },
    { id: 'reports', label: 'Doanh thu & Báo cáo', icon: TrendingUp },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <AdminOverview />;
      case 'employees':
        return <EmployeeManagement />;
      case 'services':
        return <ServiceManagement />;
      case 'doctorSchedule':
        return <DoctorScheduleManagement />;
      case 'consultationTime':
        return <ConsultationTimeManagement />;
      case 'vouchers':
        return <VoucherManagement />;
      case 'feedback':
        return <FeedbackDashboard />;
      case 'reports':
        return <ReportsPage />;
      default:
        return <AdminOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden flex font-sans text-slate-800">
      {/* Ambient background glowing blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-indigo-400/20 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[35rem] h-[35rem] bg-sky-400/20 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }}></div>

      {/* Sidebar */}
      <aside className="w-72 backdrop-blur-2xl bg-white/70 border-r border-white/60 shadow-[4px_0_24px_rgba(0,0,0,0.02)] flex flex-col justify-between z-20">
        <div>
          <div className="p-8">
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-sky-500 tracking-tight">
              Pristine
            </h1>
            <p className="text-xs text-indigo-500/80 font-bold tracking-widest mt-1 uppercase">Quản trị hệ thống</p>
          </div>
          <nav className="mt-6 px-6 space-y-3">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center px-5 py-4 rounded-2xl transition-all duration-300 relative group overflow-hidden ${
                  activeTab === item.id
                    ? 'bg-gradient-to-r from-indigo-50 to-sky-50/50 shadow-sm border border-indigo-100/50'
                    : 'hover:bg-slate-100/50 hover:shadow-sm'
                }`}
              >
                {activeTab === item.id && (
                  <motion.div 
                    layoutId="activeTabIndicator"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-sky-500 rounded-r-full" 
                  />
                )}
                <item.icon className={`w-5 h-5 mr-4 transition-colors ${activeTab === item.id ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-500'}`} />
                <span className={`font-bold text-sm transition-colors ${activeTab === item.id ? 'text-indigo-900' : 'text-slate-600 group-hover:text-slate-900'}`}>
                  {item.label}
                </span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6 border-t border-slate-200/40">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center px-4 py-4 bg-white/50 border border-slate-200/60 rounded-2xl text-red-500 font-bold text-sm hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all shadow-sm group"
          >
            <LogOut className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden z-10 relative">
        
        {/* Global Glassmorphism Topbar */}
        <header className="px-10 py-5 bg-white/60 backdrop-blur-2xl border-b border-white/80 shadow-[0_4px_30px_rgba(0,0,0,0.03)] flex justify-between items-center z-30 sticky top-0">
          
          {/* Topbar: Search */}
          <div className="relative w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text"
              placeholder="Tìm kiếm thông tin, bệnh nhân, nhân viên..."
              className="w-full pl-12 pr-4 py-3 bg-white/50 border border-slate-200 rounded-full focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 outline-none text-sm font-medium transition-all shadow-inner"
            />
          </div>

          {/* Topbar: Right Actions */}
          <div className="flex items-center space-x-6">
            <button className="relative p-3 bg-white/50 border border-slate-200 hover:bg-white rounded-full transition-all shadow-sm group">
              <Bell className="w-5 h-5 text-slate-500 group-hover:text-indigo-600 transition-colors" />
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </button>

            <div className="h-8 w-[1px] bg-slate-200"></div>

            <button className="flex items-center space-x-3 group cursor-pointer hover:bg-white/50 p-2 rounded-2xl transition-colors">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-sky-400 flex items-center justify-center text-white font-bold shadow-md border-2 border-white group-hover:scale-105 transition-transform">
                {user?.name?.charAt(0) || 'A'}
              </div>
              <div className="text-left hidden md:block">
                <div className="text-sm font-bold text-slate-800">{user?.name || 'Admin'}</div>
                <div className="text-xs font-semibold text-indigo-600">{user?.role || 'Super Admin'}</div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
            </button>
          </div>
        </header>

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto p-10 space-y-8 scroll-smooth relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="h-full max-w-7xl mx-auto"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
