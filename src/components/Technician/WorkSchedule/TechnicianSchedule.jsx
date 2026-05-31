import React from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, CheckCircle2, Clock } from 'lucide-react';
import { mockTechnicianShifts } from '../../../mockData';

const TechnicianSchedule = () => {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 border border-slate-200/60 shadow-sm rounded-2xl p-5"
        >
            <h2 className="text-xl font-semibold text-slate-800 mb-6 flex items-center">
                <CalendarIcon className="w-5 h-5 mr-2 text-emerald-600" />
                Lịch làm việc của bạn
            </h2>
            
            <div className="space-y-4">
                {mockTechnicianShifts?.map((shift) => (
                    <div key={shift.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-slate-500">
                                <Clock className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="font-medium text-slate-800">Ngày: {shift.date}</p>
                                <p className="text-sm text-slate-500">Ca: {shift.shift}</p>
                            </div>
                        </div>
                        
                        <div>
                            {shift.status === "Confirmed" ? (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800">
                                    <CheckCircle2 className="w-4 h-4 mr-1" />
                                    Đã xác nhận
                                </span>
                            ) : (
                                <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl shadow-sm transition-colors">
                                    Xác nhận ca
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};

export default TechnicianSchedule;
