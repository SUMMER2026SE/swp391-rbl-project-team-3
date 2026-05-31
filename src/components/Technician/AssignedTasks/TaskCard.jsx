import React from 'react';
import { User, Activity, Clock } from 'lucide-react';

const TaskCard = ({ task, onExecute }) => {
    if (!task) return null;

    return (
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold">
                        {task?.patientName?.charAt(0)}
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-800">{task?.patientName}</h4>
                        <p className="text-xs text-slate-500 flex items-center mt-1">
                            <User className="w-3 h-3 mr-1" />
                            {task?.gender}, {task?.age} tuổi
                        </p>
                    </div>
                </div>
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                    task?.status === 'Chờ thực hiện' ? 'bg-amber-100 text-amber-700' :
                    task?.status === 'Đang tiến hành' ? 'bg-sky-100 text-sky-700' :
                    'bg-emerald-100 text-emerald-700'
                }`}>
                    {task?.status}
                </span>
            </div>

            <div className="space-y-2 mb-6">
                <div className="flex items-center text-sm text-slate-600">
                    <Activity className="w-4 h-4 mr-2 text-slate-400" />
                    <span className="font-medium">{task?.procedureType}</span>
                </div>
                <div className="flex items-center text-sm text-slate-500">
                    <Clock className="w-4 h-4 mr-2 text-slate-400" />
                    <span>Yêu cầu lúc: {new Date(task?.requestTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
                <button
                    onClick={() => onExecute(task)}
                    className="w-full py-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white font-medium rounded-lg transition-colors border border-emerald-200 hover:border-emerald-600"
                >
                    Thực hiện
                </button>
            </div>
        </div>
    );
};

export default TaskCard;
