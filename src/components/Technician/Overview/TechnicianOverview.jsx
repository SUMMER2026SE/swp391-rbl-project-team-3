import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, CheckCircle2, Clock, TrendingUp, Calendar, ChevronRight } from 'lucide-react';
import GlassCard, { GLASS_BASE, GLASS_HOVER, GLASS_TITLE } from '../../common/GlassCard';
import { DoctorScheduleModel } from '../../../models/DoctorScheduleModel';
import { timeToMinutes, dateKey } from '../../common/scheduleUtils';

const TechnicianOverview = ({ tasks, technicianId, shifts: initialShifts, onNavigate }) => {
    const [shifts, setShifts] = useState(initialShifts || []);

    useEffect(() => {
        if (initialShifts && initialShifts.length > 0) {
            setShifts(initialShifts);
            return;
        }
        if (!technicianId) return;
        let alive = true;
        const fetchShifts = async () => {
            const data = await DoctorScheduleModel.getShiftsByDoctor(technicianId);
            if (alive) {
                setShifts(Array.isArray(data) ? data : []);
            }
        };
        fetchShifts();
        return () => {
            alive = false;
        };
    }, [technicianId, initialShifts]);

    const pendingTasks = (Array.isArray(tasks) ? tasks : []).filter(
        (t) => t.status === "Chờ thực hiện" && (!t.technicianId || (technicianId && String(t.technicianId) === String(technicianId)))
    ).length;
    const completedTasks = (Array.isArray(tasks) ? tasks : []).filter(
        (t) => t.status === "Đã hoàn thành" && (technicianId ? String(t.technicianId) === String(technicianId) : true)
    ).length;

    const todayKeyStr = dateKey(new Date());
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    const confirmedPastShifts = (Array.isArray(shifts) ? shifts : []).filter((s) => {
        if (s.status !== 'Đã xác nhận') return false;
        const shiftDate = String(s.work_date || '').slice(0, 10);
        if (!shiftDate) return false;
        if (shiftDate < todayKeyStr) return true;
        if (shiftDate === todayKeyStr) {
            const startMin = timeToMinutes(s.start_time) ?? 0;
            return startMin <= nowMinutes;
        }
        return false;
    });

    const totalMinutes = confirmedPastShifts.reduce((sum, s) => {
        const a = timeToMinutes(s.start_time) ?? 0;
        const b = timeToMinutes(s.end_time) ?? a;
        return sum + Math.max(b - a, 0);
    }, 0);
    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

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
            title: "Tổng ca đã hoàn thành", 
            value: completedTasks, 
            icon: CheckCircle2, 
            color: "text-emerald-500", 
            bg: "bg-emerald-100/50",
            trend: "+5 so với tuần trước",
            trendIcon: TrendingUp,
            trendColor: "text-emerald-600"
        },
        { 
            title: "Tổng giờ làm", 
            value: `${totalHours} giờ`, 
            icon: Clock, 
            color: "text-sky-500", 
            bg: "bg-sky-100/50",
            trend: "Ca đã xác nhận",
            trendIcon: null,
            trendColor: "text-slate-500"
        }
    ];

    // Dynamic notification generation for Technician
    const notifications = useMemo(() => {
        const list = [];

        // 1. New indications/service tickets waiting to be processed
        (tasks || []).forEach((t) => {
            if (t.status === 'Chờ thực hiện') {
                list.push({
                    id: `task-${t.id}`,
                    icon: ClipboardList,
                    iconBg: 'bg-amber-100 text-amber-600',
                    title: 'Chỉ định thủ thuật mới',
                    message: `Bác sĩ ${t.assignedBy || 'chuyên khoa'} vừa chỉ định "${t.procedureType || t.service}" cho bệnh nhân ${t.patientName}`,
                    time: t.createdAt || t.requestTime,
                    badge: 'Chờ thực hiện',
                    badgeStyle: 'bg-amber-50 text-amber-700 border-amber-200',
                    targetTab: 'tasks',
                });
            }
        });

        // 2. New work shifts assigned by Admin waiting for technician confirmation
        (shifts || []).forEach((s) => {
            if (s.status === 'Đã phân công') {
                list.push({
                    id: `shift-${s.id}`,
                    icon: Calendar,
                    iconBg: 'bg-sky-100 text-sky-600',
                    title: 'Ca làm việc mới cần xác nhận',
                    message: `Quản trị viên đã phân ca làm việc (${s.start_time?.slice(0, 5)} - ${s.end_time?.slice(0, 5)}) cho ngày ${s.work_date}`,
                    time: s.created_at || s.work_date,
                    badge: 'Chờ xác nhận',
                    badgeStyle: 'bg-sky-50 text-sky-700 border-sky-200',
                    targetTab: 'schedule',
                });
            }
        });

        return list;
    }, [tasks, shifts]);

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
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                    <h3 className={GLASS_TITLE}>Thông báo mới trong ngày</h3>
                    {notifications.length > 0 && (
                        <span className="px-2.5 py-1 text-xs font-extrabold rounded-full bg-teal-100 text-teal-700 border border-teal-200">
                            {notifications.length} thông báo
                        </span>
                    )}
                </div>

                {notifications.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                        {notifications.map((n) => {
                            const IconComp = n.icon;
                            return (
                                <div
                                    key={n.id}
                                    onClick={() => onNavigate && n.targetTab && onNavigate(n.targetTab)}
                                    className="py-4 first:pt-0 last:pb-0 flex items-start gap-4 p-3 rounded-xl transition-all cursor-pointer group hover:bg-teal-50/60 hover:shadow-sm"
                                    title="Click để đến trang tương ứng"
                                >
                                    <div className={`p-3 rounded-xl shrink-0 ${n.iconBg} transition-transform group-hover:scale-105`}>
                                        <IconComp className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <h4 className="text-sm font-bold text-slate-800 group-hover:text-teal-700 transition-colors flex items-center gap-1">
                                                {n.title}
                                                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all" />
                                            </h4>
                                            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${n.badgeStyle}`}>
                                                {n.badge}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-600 mt-1">{n.message}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex items-center justify-center py-12 text-slate-500 italic">
                        <span className="bg-slate-50 px-4 py-2 rounded-full border border-slate-100 text-sm">
                            Chưa có thông báo nào trong hôm nay.
                        </span>
                    </div>
                )}
            </GlassCard>
        </motion.div>
    );
};

export default TechnicianOverview;
