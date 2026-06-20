import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Clock, Play, CheckCircle2, Eye } from 'lucide-react';

const AssignedTasksList = ({ tasks, onExecuteTask, onReviewTask }) => {
  const taskList = tasks || [];

  if (taskList.length === 0) {
    return (
      <div className="glass-3d rounded-[1.75rem] overflow-hidden">
        <div className="bg-white/40 backdrop-blur-sm border-b border-white/30 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl md:text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-800 to-emerald-700 tracking-tight whitespace-nowrap">
                Danh sách Chỉ định
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Các chỉ định thủ thuật được phân công cho bạn
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100/80 text-slate-600 text-sm font-semibold border border-slate-200/60">
              0 chỉ định
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-24 px-8">
          <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-5">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <p className="text-lg font-semibold text-slate-700 mb-1">
            Không có chỉ định nào
          </p>
          <p className="text-sm text-slate-400">
            Hiện tại chưa có chỉ định thủ thuật nào được phân công cho bạn.
          </p>
        </div>
      </div>
    );
  }

  const formatTime = (timeValue) => {
    if (!timeValue) return '—';
    try {
      const date = new Date(timeValue);
      if (isNaN(date.getTime())) return timeValue;
      return date.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return timeValue;
    }
  };

  const getInitial = (name) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="glass-3d rounded-[1.75rem] overflow-hidden">
      {/* Header */}
      <div className="bg-white/40 backdrop-blur-sm border-b border-white/30 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-800 to-emerald-700 tracking-tight whitespace-nowrap">
              Danh sách Chỉ định
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Các chỉ định thủ thuật được phân công cho bạn
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50/80 text-emerald-700 text-sm font-semibold border border-emerald-200/60">
            {taskList.length} chỉ định
          </span>
        </div>
      </div>
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-white/30">
              <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                Bệnh nhân
              </th>
              <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                Chỉ định
              </th>
              <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                Thời gian yêu cầu
              </th>
              <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                Trạng thái
              </th>
              <th className="text-right px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/20">
            {(Array.isArray(taskList) ? taskList : []).map((task, index) => {
              const isCompleted = task?.status === 'Đã hoàn thành';
              const isPending = task?.status === 'Chờ thực hiện';

              return (
                <motion.tr
                  key={task?.id || index}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.04 }}
                  className={`hover:bg-white/50 transition-colors duration-200 ${
                    isCompleted ? 'opacity-60' : ''
                  }`}
                >
                  {/* Bệnh nhân */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <span className="text-sm font-bold text-white leading-none">
                          {getInitial(task?.patientName)}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">
                          {task?.patientName || 'Không rõ'}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {[task?.gender, task?.age ? `${task.age} tuổi` : null]?.filter?.(Boolean)
                            .join(' · ') || '—'}
                        </p>
                      </div>
                    </div>
                  </td>
                  {/* Chỉ định */}
                  <td className="px-6 py-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span className="text-sm font-semibold text-slate-800 truncate">
                          {task?.procedureType || task?.procedure || '—'}
                        </span>
                      </div>
                      {task?.doctorName && (
                        <p className="text-xs text-slate-500 mt-1 ml-6">
                          {task.doctorName}
                        </p>
                      )}
                    </div>
                  </td>
                  {/* Thời gian yêu cầu */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="text-sm text-slate-700 font-medium">
                        {formatTime(task?.requestTime || task?.createdAt)}
                      </span>
                    </div>
                  </td>
                  {/* Trạng thái */}
                  <td className="px-6 py-4">
                    {isPending && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Chờ thực hiện
                      </span>
                    )}
                    {isCompleted && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Đã hoàn thành
                      </span>
                    )}
                    {!isPending && !isCompleted && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-600 border border-slate-200/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        {task?.status || 'Không rõ'}
                      </span>
                    )}
                  </td>
                  {/* Hành động */}
                  <td className="px-6 py-4 text-right">
                    {isPending && (
                      <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => onExecuteTask?.(task)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 shadow-md shadow-emerald-500/25 hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-200"
                      >
                        <Play className="w-4 h-4" />
                        Thực hiện thủ thuật
                      </motion.button>
                    )}
                    {isCompleted && (
                      <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => onReviewTask?.(task)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold glass-inner text-slate-700 hover:text-emerald-700 hover:bg-emerald-50/60 transition-all duration-200"
                      >
                        <Eye className="w-4 h-4" />
                        Xem lại kết quả
                      </motion.button>
                    )}
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AssignedTasksList;
