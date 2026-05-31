import React from 'react';
import { User, Activity, AlertCircle, UserCheck } from 'lucide-react';

const PatientInfoPanel = ({ task }) => {
    return (
        <div className="bg-white/90 border border-slate-200/60 shadow-sm rounded-2xl p-6 h-full flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center border-b pb-4 border-slate-100">
                <UserCheck className="w-5 h-5 mr-2 text-emerald-600" />
                Thông tin Bệnh nhân
            </h3>
            
            <div className="flex-1 space-y-6">
                <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center text-xl font-bold shadow-sm">
                        {task?.patientName?.charAt(0)}
                    </div>
                    <div>
                        <h4 className="text-xl font-semibold text-slate-800">{task?.patientName}</h4>
                        <p className="text-slate-500 flex items-center mt-1">
                            <User className="w-4 h-4 mr-1" />
                            {task?.patientId} &bull; {task?.gender}, {task?.age} tuổi
                        </p>
                    </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <h5 className="text-sm font-medium text-slate-500 mb-2 uppercase tracking-wider flex items-center">
                        <Activity className="w-4 h-4 mr-1" /> Chỉ định dịch vụ
                    </h5>
                    <p className="text-lg font-semibold text-emerald-700">{task?.procedureType}</p>
                    <p className="text-sm text-slate-600 mt-2">Bác sĩ chỉ định: <span className="font-medium text-slate-800">{task?.assignedBy}</span></p>
                </div>

                {task?.notes && (
                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                        <h5 className="text-sm font-medium text-amber-700 mb-2 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-1" /> Ghi chú từ bác sĩ
                        </h5>
                        <p className="text-amber-900 italic text-sm">{task?.notes}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PatientInfoPanel;
