import React from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, CheckCircle2, Clock, TrendingUp } from 'lucide-react';
import GlassCard, { GLASS_BASE, GLASS_HOVER, GLASS_TITLE } from '../../common/GlassCard';

const TechnicianOverview = ({ tasks }) => {
    const pendingTasks = (Array.isArray(tasks) ? tasks : []).filter(t => t.status === "Chờ thực hiện")?.length || 0;
    const completedTasks = (Array.isArray(tasks) ? tasks : []).filter(t => t.status === "Đã hoàn thành")?.length || 0;
    const totalShifts = ([])?.length || 0;

    const stats = [
        { 
            title: "Chỉ định chờ", 
            value: pendingTasks, 
            icon: ClipboardList, 
            color: "text-amber-500", 
            bg: "bg-amber-100/50",
            trend: "+2 từ hôm qua",
            trendIcon: TrendingUp,
            trendColor: "text-amber-600"
        },
        { 
            title: "Đã hoàn thành", 
            value: completedTasks, 
            icon: CheckCircle2, 
            color: "text-emerald-500", 
            bg: "bg-emerald-100/50",
            trend: "+5 so với tuần trước",
            trendIcon: TrendingUp,
            trendColor: "text-emerald-600"
        },
        { 
            title: "Tổng ca làm", 
            value: totalShifts, 
            icon: Clock, 
            color: "text-sky-500", 
            bg: "bg-sky-100/50",
            trend: "Tháng này",
            trendIcon: null,
            trendColor: "text-slate-500"
        }
    ];

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(Array.isArray(stats) ? stats : []).map((stat, idx) => (
                    <div key={idx} className={`${GLASS_BASE} ${GLASS_HOVER} p-6 relative overflow-hidden group h-full flex flex-col`}>
                        <div className="flex justify-between items-start mb-6">
                            <div className={`p-4 rounded-2xl ${stat.bg}`}>
                                <stat.icon className={`w-8 h-8 ${stat.color}`} />
                            </div>
                            {stat.trendIcon && (
                                <div className={`flex items-center text-xs font-medium ${stat.trendColor} bg-white/50 px-2.5 py-1 rounded-full`}>
                                    <stat.trendIcon className="w-3 h-3 mr-1" />
                                    {stat.trend}
                                </div>
                            )}
                        </div>
                        <div>
                            <h3 className="text-4xl font-extrabold text-slate-800 tracking-tight">{stat.value}</h3>
                            <p className="text-sm font-medium text-slate-500 mt-1">{stat.title}</p>
                        </div>
                        {/* Decorative background blob */}
                        <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full ${stat.bg} blur-2xl opacity-50 group-hover:opacity-80 transition-opacity`}></div>
                    </div>
                ))}
            </div>
            
            <GlassCard>
                <h3 className={`${GLASS_TITLE} mb-4 border-b border-slate-100 pb-4`}>Thông báo mới</h3>
                <div className="flex items-center justify-center py-12 text-slate-500 italic">
                    <span className="bg-slate-50 px-4 py-2 rounded-full border border-slate-100 text-sm">
                        Chưa có thông báo nào trong hôm nay.
                    </span>
                </div>
            </GlassCard>
        </motion.div>
    );
};

export default TechnicianOverview;
