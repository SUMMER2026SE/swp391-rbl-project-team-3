import React, { useState } from 'react';
import { Activity, Beaker, CalendarDays, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ClinicalHistory({ patientId }) {
  const patientLabs = [];
  const patientRecords = [];
  const [showDetails, setShowDetails] = useState(false);

  if (patientLabs.length === 0 && patientRecords.length === 0) {
    return (
      <div className="glass-3d-soft water-refract rounded-[2rem] p-8 text-center text-slate-500 font-medium">
        <Activity className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-sm font-semibold">Chưa có dữ liệu xét nghiệm/AI cho bệnh nhân này.</p>
      </div>
    );
  }

  return (
    <div className="glass-3d-soft water-refract rounded-[2rem] p-6">
      {/* Always visible: Header + Summary */}
      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-200/40">
        <Activity className="w-5 h-5 text-teal-600" />
        <div className="flex-1">
          <h3 className="font-bold text-lg text-slate-900">Lịch sử Cận lâm sàng & Tiến triển</h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {patientLabs.length} kết quả xét nghiệm • {patientRecords.length} lần khám
          </p>
        </div>
      </div>
      {/* Toggle Button */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center gap-1.5 text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors mb-4 cursor-pointer"
      >
        <motion.span
          animate={{ rotate: showDetails ? 180 : 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="inline-flex"
        >
          <ChevronDown className="w-4 h-4" />
        </motion.span>
        {showDetails ? 'Thu gọn' : 'Xem thêm chi tiết'}
      </button>
      {/* Collapsible: Lab Tests + Timeline */}
      <AnimatePresence initial={false}>
        {showDetails && (
          <motion.div
            key="clinical-details"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            {/* Lab Tests Section */}
            <div className="mb-8">
              <h4 className="font-bold text-sm text-slate-700 flex items-center gap-1.5 mb-4">
                <Beaker className="w-4 h-4 text-sky-500" /> Kết quả Xét nghiệm / Dịch vụ
              </h4>
              <div className="space-y-3">
                {patientLabs.length > 0 ? (
                  patientLabs?.map?.((lab) => (
                    <div key={lab.id} className="bg-white/60 p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-sm text-sky-700 group-hover:text-sky-600 transition-colors">{lab.testName}</span>
                        <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-200/30">
                          {lab.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 font-medium mb-2">
                        Ngày yêu cầu: {lab.dateRequested} | Hoàn thành: {lab.dateCompleted}
                      </div>
                      <div className="bg-slate-50 p-2 rounded-lg text-xs font-semibold text-slate-700 border border-slate-100">
                        <span className="text-slate-400 font-bold">Kết luận:</span> {lab.summary}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400 italic">Không có xét nghiệm cận lâm sàng nào.</p>
                )}
              </div>
            </div>

            {/* Timeline Section */}
            <div>
              <h4 className="font-bold text-sm text-slate-700 flex items-center gap-1.5 mb-4">
                <CalendarDays className="w-4 h-4 text-teal-500" /> Tiến triển điều trị
              </h4>
              <div className="relative pl-4 border-l-2 border-slate-200/60 space-y-6">
                {patientRecords.length > 0 ? (
                  patientRecords?.map?.((rec) => (
                    <div key={rec.id} className="relative">
                      <div className="absolute -left-[21px] top-1 w-3 h-3 bg-teal-500 rounded-full border-2 border-white shadow-sm"></div>
                      <div className="bg-white/50 p-3.5 rounded-xl border border-slate-200/60 shadow-sm">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-xs text-slate-800">{rec.date}</span>
                          <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-1.5 py-0.5 rounded">{rec.specialty}</span>
                        </div>
                        <div className="text-xs text-slate-600 font-medium mb-1">
                          <span className="font-bold text-slate-400">BS:</span> {rec.doctor}
                        </div>
                        <div className="text-xs text-slate-700 font-semibold bg-slate-50 p-2 rounded-lg mt-2">
                          <div className="mb-1"><span className="text-teal-600 font-bold">CĐ:</span> {rec.diagnosis}</div>
                          <div><span className="text-sky-600 font-bold">ĐT:</span> {rec.prescription}</div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400 italic">Bệnh nhân mới, chưa có lịch sử điều trị.</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
