import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import PatientInfoPanel from './PatientInfoPanel';
import ImageUploadModule from './ImageUploadModule';
import LabMetricsForm from './LabMetricsForm';

const ProcedureWorkspace = ({ task, onBack, onComplete }) => {
    
    const handleComplete = () => {
        // In real app, call API. Here we just trigger callback.
        onComplete(task.id);
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="h-full flex flex-col space-y-6"
        >
            <div className="flex items-center justify-between bg-white/80 border border-slate-200/60 shadow-sm rounded-2xl p-4">
                <button 
                    onClick={onBack}
                    className="flex items-center text-slate-500 hover:text-emerald-600 font-medium transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Quay lại danh sách
                </button>
                <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-slate-500">Mã chỉ định: {task?.id}</span>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[500px]">
                <div className="lg:col-span-1">
                    <PatientInfoPanel task={task} />
                </div>
                
                <div className="lg:col-span-2">
                    {task?.procedureDetails?.type === 'Imaging' ? (
                        <ImageUploadModule task={task} />
                    ) : (
                        <LabMetricsForm task={task} />
                    )}
                </div>
            </div>

            <div className="bg-white/80 border border-slate-200/60 shadow-sm rounded-2xl p-5 flex justify-end">
                <button 
                    onClick={handleComplete}
                    className="flex items-center px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                >
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Cập nhật kết quả & Hoàn thành
                </button>
            </div>
        </motion.div>
    );
};

export default ProcedureWorkspace;
