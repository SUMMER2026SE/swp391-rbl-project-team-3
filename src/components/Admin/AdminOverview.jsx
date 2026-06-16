import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Ticket, Activity, ChevronRight, Zap, Shield } from 'lucide-react';
import { SystemLogModel } from '../../models/SystemLogModel';

const AdminOverview = ({ onNavigate }) => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await SystemLogModel.getAll();
        setLogs(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch logs:", err);
        setLogs([]);
      }
    };
    fetchLogs();

    const handleUpdate = () => {
      fetchLogs();
    };
    window.addEventListener('system-logs-updated', handleUpdate);
    return () => window.removeEventListener('system-logs-updated', handleUpdate);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 250, damping: 25 } }
  };

  const stats = [
    { 
      title: "Doanh thu tháng này", 
      value: "150.000.000đ", 
      icon: TrendingUp, 
      gradient: "from-indigo-500 to-indigo-600",
      lightBg: "bg-indigo-50",
      trend: "+12% so với tháng trước"
    },
    { 
      title: "Tổng nhân sự", 
      value: ([])?.length.toString() || "0", 
      icon: Users, 
      gradient: "from-sky-400 to-sky-500",
      lightBg: "bg-sky-50",
      trend: "2 nhân sự mới"
    },
    { 
      title: "Voucher hoạt động", 
      value: ([])?.filter(v => v.status === "Hoạt động").length.toString() || "0", 
      icon: Ticket, 
      gradient: "from-emerald-400 to-emerald-500",
      lightBg: "bg-emerald-50",
      trend: "5 voucher sắp hết hạn"
    },
  ];

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      <div className="flex justify-between items-end mb-2">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Tổng quan hệ thống</h2>
          <p className="text-slate-500 text-sm font-medium mt-1">Theo dõi các chỉ số quan trọng và hoạt động gần đây.</p>
        </div>
        <button 
          onClick={() => onNavigate && onNavigate('reports')}
          className="flex items-center px-5 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-all group"
        >
          <Zap className="w-4 h-4 mr-2 text-amber-500 group-hover:scale-110 transition-transform" />
          Báo cáo nhanh
        </button>
      </div>
      {/* Bento Grid: Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {(Array.isArray(stats) ? stats : []).map((stat, index) => (
          <motion.div 
            key={index} 
            variants={itemVariants}
            className="backdrop-blur-xl bg-white/75 border border-white/80 shadow-[0_15px_40px_rgba(0,0,0,0.05)] rounded-3xl p-7 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300"
          >
            <div className="flex justify-between items-start mb-6">
              <div className={`p-4 rounded-2xl bg-gradient-to-br ${stat.gradient} shadow-lg shadow-${stat.gradient.split('-')[1]}/30`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <h3 className="text-slate-500 font-bold text-sm mb-2 uppercase tracking-wider">{stat.title}</h3>
              <div className="text-4xl font-extrabold text-slate-800 tracking-tight mb-2">{stat.value}</div>
              <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${stat.lightBg} text-${stat.gradient.split('-')[1]}-700`}>
                {stat.trend}
              </div>
            </div>
            {/* Decorative background glow on hover */}
            <div className={`absolute -bottom-16 -right-16 w-48 h-48 bg-gradient-to-br ${stat.gradient} rounded-full blur-[80px] opacity-0 group-hover:opacity-20 transition-opacity duration-700`}></div>
          </motion.div>
        ))}
      </div>
      {/* Bento Grid: Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div 
          variants={itemVariants} 
          className="lg:col-span-2 backdrop-blur-xl bg-white/75 border border-white/80 shadow-[0_15px_40px_rgba(0,0,0,0.05)] rounded-3xl p-8"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-extrabold text-slate-800 flex items-center">
              <Activity className="w-6 h-6 mr-3 text-indigo-500" />
              Hoạt động hệ thống
            </h3>
            <button 
              onClick={() => onNavigate && onNavigate('reports')}
              className="text-sm font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-4 py-2 rounded-xl transition-colors flex items-center"
            >
              Xem tất cả <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
          
          <div className="space-y-5">
            {(Array.isArray(logs) ? logs : []).map((log) => (
              <div key={log.id} className="flex items-start p-5 rounded-2xl bg-white/80 border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mr-5 ${log.severity === 'Success' ? 'bg-emerald-100 text-emerald-600' : 'bg-sky-100 text-sky-600'}`}>
                  {log.severity === 'Success' ? <Activity className="w-6 h-6" /> : <Users className="w-6 h-6" />}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-extrabold text-base text-slate-800">{log.actor}</span>
                    <span className="text-xs text-slate-400 font-bold bg-slate-100 px-3 py-1 rounded-full">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 font-medium leading-relaxed">{log.details}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div 
          variants={itemVariants}
          className="backdrop-blur-xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-sky-700 border border-white/20 shadow-[0_15px_40px_rgba(99,102,241,0.2)] rounded-3xl p-8 text-white relative overflow-hidden flex flex-col justify-between"
        >
           <div className="absolute top-[-30%] right-[-20%] w-64 h-64 bg-white/10 rounded-full mix-blend-overlay filter blur-3xl"></div>
           <div className="absolute bottom-[-10%] left-[-10%] w-40 h-40 bg-sky-400/20 rounded-full mix-blend-overlay filter blur-2xl"></div>
           
           <div className="relative z-10">
             <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 border border-white/20 shadow-inner">
               <Shield className="w-7 h-7 text-white" />
             </div>
             <h3 className="text-2xl font-extrabold mb-3 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-indigo-100">DermaSmart Admin</h3>
             <p className="text-indigo-100/90 text-sm mb-8 font-medium leading-relaxed">
               Không gian quản trị toàn diện. Kiểm soát nhân sự, phân quyền, quản lý dịch vụ và hệ thống báo cáo chuyên sâu.
             </p>
           </div>
           
           <div className="space-y-4 relative z-10">
             <button 
               onClick={() => onNavigate && onNavigate('employees')}
               className="w-full py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl font-bold text-sm transition-all flex items-center justify-between px-5 border border-white/20 hover:border-white/40 group shadow-lg"
             >
               Thêm nhân viên mới
               <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
             </button>
             <button 
               onClick={() => onNavigate && onNavigate('vouchers')}
               className="w-full py-4 bg-black/20 hover:bg-black/30 backdrop-blur-md rounded-2xl font-bold text-sm transition-all flex items-center justify-between px-5 border border-white/5 hover:border-white/20 group"
             >
               Tạo Voucher Khuyến Mãi
               <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
             </button>
           </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AdminOverview;
