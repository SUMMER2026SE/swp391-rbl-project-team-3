import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Clock, Play, CheckCircle } from 'lucide-react';

const AssignedTasksList = ({ tasks, onExecuteTask }) => {
    const pendingTasks = tasks?.filter(t => t.status !== "Đã hoàn thành") || [];

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="backdrop-blur-xl bg-white/60 border border-white/80 shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-3xl overflow-hidden"
        >
            <div className="p-6 border-b border-slate-100/60 flex justify-between items-center bg-white/40">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Danh sách Chỉ định</h2>
                    <p className="text-sm text-slate-500 mt-1">Các thủ thuật/xét nghiệm đang chờ được thực hiện</p>
                </div>
                <div className="bg-white/80 px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 shadow-sm border border-slate-100">
                    Tổng cộng: <span className="text-emerald-600">{pendingTasks.length}</span>
                </div>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider">
                            <th className="px-6 py-4 font-semibold">Bệnh nhân</th>
                            <th className="px-6 py-4 font-semibold">Chỉ định</th>
                            <th className="px-6 py-4 font-semibold">Thời gian yêu cầu</th>
                            <th className="px-6 py-4 font-semibold">Trạng thái</th>
                            <th className="px-6 py-4 font-semibold text-right">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/60">
                        {pendingTasks.map((task, idx) => (
                            <tr key={task.id} className="hover:bg-white/60 transition-colors group">
                                <td className="px-6 py-5">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm shadow-sm">
                                            {task?.patientName?.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">{task?.patientName}</p>
                                            <p className="text-xs text-slate-500">{task?.gender} • {task?.age} tuổi</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex items-center text-sm font-medium text-slate-700">
                                        <Activity className="w-4 h-4 mr-2 text-slate-400" />
                                        {task?.procedureType}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">BS: {task?.assignedBy}</p>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex items-center text-sm text-slate-600">
                                        <Clock className="w-4 h-4 mr-2 text-slate-400" />
                                        {new Date(task?.requestTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <span className={`inline-flex items-center px-3 py-1 text-xs font-bold rounded-full border ${
                                        task?.status === 'Chờ thực hiện' ? 'bg-amber-50 text-amber-700 border-amber-200/60' :
                                        task?.status === 'Đang tiến hành' ? 'bg-sky-50 text-sky-700 border-sky-200/60' :
                                        'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                                    }`}>
                                        {task?.status === 'Chờ thực hiện' && <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-2"></span>}
                                        {task?.status === 'Đang tiến hành' && <span className="w-1.5 h-1.5 bg-sky-500 rounded-full mr-2"></span>}
                                        {task?.status === 'Đã hoàn thành' && <CheckCircle className="w-3 h-3 mr-1" />}
                                        {task?.status}
                                    </span>
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <button
                                        onClick={() => onExecuteTask(task)}
                                        className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-sm font-bold rounded-xl shadow-sm hover:shadow-md hover:shadow-emerald-500/20 transition-all transform active:scale-95"
                                    >
                                        <Play className="w-4 h-4 mr-1.5 fill-current" />
                                        Thực hiện
                                    </button>
                                </td>
                            </tr>
                        ))}
                        
                        {pendingTasks.length === 0 && (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center">
                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 mb-4">
                                        <CheckCircle className="w-8 h-8 text-emerald-400" />
                                    </div>
                                    <p className="text-slate-500 font-medium">Bạn đã hoàn thành tất cả chỉ định.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
};

export default AssignedTasksList;
