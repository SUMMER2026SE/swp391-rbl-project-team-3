import React, { useState, useEffect } from 'react';
import { Pill, Plus, Trash2, Calendar } from 'lucide-react';

export default function PrescriptionForm({ appointmentId, isReviewMode = false, examRecord = null, onChange }) {
  // Find prescription or initialize with defaults
  const existingPrescription = ([])?.find(p => p.appointmentId === appointmentId);

  const [medications, setMedications] = useState([]);
  const [generalInstructions, setGeneralInstructions] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');

  // Load existing data if available or if in review mode
  useEffect(() => {
    if (isReviewMode && examRecord) {
      setMedications(examRecord.medications || []);
      setGeneralInstructions(examRecord.generalInstructions || '');
      setFollowUpDate(examRecord.followUpDate || '');
      setFollowUpNotes(examRecord.followUpNotes || '');
    } else if (existingPrescription) {
      setMedications(existingPrescription.medications || []);
      setGeneralInstructions(existingPrescription.generalInstructions || '');
    } else {
      // Provide a couple of default items for testing if none exist
      setMedications([
        {
          name: 'Clindamycin 1% Gel',
          dosage: 'Thoa 1 lớp mỏng',
          frequency: '2 lần/ngày (Sáng, Tối)',
          instructions: 'Chấm trực tiếp lên các nốt mụn viêm, tránh vùng mắt.'
        }
      ]);
    }
  }, [existingPrescription, isReviewMode, examRecord]);

  // Bubble changes up to parent component
  useEffect(() => {
    if (onChange && !isReviewMode) {
      onChange({
        medications,
        generalInstructions,
        followUpDate,
        followUpNotes
      });
    }
  }, [medications, generalInstructions, followUpDate, followUpNotes, onChange, isReviewMode]);

  const premiumInputClass = "w-full p-3 bg-white/60 border border-slate-200/80 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-slate-800 text-sm font-semibold";

  const getInputClass = (readOnly) => `${premiumInputClass} ${
    readOnly 
      ? 'bg-slate-100/50 text-slate-900 font-medium cursor-not-allowed border-slate-200/60 focus:ring-0 focus:border-slate-200/80' 
      : ''
  }`;

  return (
    <div className="space-y-6">
      {/* Premium Prescription Pad */}
      <div className="backdrop-blur-xl bg-white/80 border border-slate-200/60 shadow-[0_12px_40px_rgba(0,0,0,0.06)] rounded-[2.5rem] p-8 relative overflow-hidden">
        
        {/* Decorative elements representing a physical doctor pad */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
        <div className="absolute top-2 right-12 w-24 h-24 bg-teal-500/5 rounded-full blur-3xl" />
        
        {/* Clinic branding / Header */}
        <div className="flex justify-between items-start mb-6 border-b border-slate-200/60 pb-6">
          <div>
            <h4 className="font-extrabold text-xs uppercase tracking-widest text-emerald-600">
              Hệ thống Phòng khám Da liễu
            </h4>
            <h2 className="font-black text-xl text-slate-900 mt-0.5 tracking-tight">
              DERMASMART CLINIC
            </h2>
            <p className="text-[10px] text-slate-400 font-medium mt-1 leading-relaxed">
              Địa chỉ: 128 Đường Ba Tháng Hai, Quận 10, TP. Hồ Chí Minh<br />
              Hotline: 1900 6000 • Website: dermasmart.vn
            </p>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 font-extrabold text-xs">
              <Pill className="w-3.5 h-3.5 text-emerald-600" /> ĐƠN THUỐC
            </span>
            <p className="text-[10px] text-slate-400 font-bold mt-2">
              Mã HS: RX-{appointmentId || '0023'}
            </p>
          </div>
        </div>

        {/* Prescription Items */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <span className="text-xs font-black text-slate-400 tracking-wider uppercase">
              Chỉ định Thuốc & Liều dùng
            </span>
            {!isReviewMode && (
              <button
                onClick={handleAddMedication}
                type="button"
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" /> Thêm thuốc
              </button>
            )}
          </div>

          <div className="space-y-5">
            {medications?.map?.((med, idx) => (
              <div 
                key={idx} 
                className="group relative p-5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200/50 hover:border-slate-300/80 rounded-2xl transition-all duration-200"
              >
                {/* Delete button */}
                {!isReviewMode && (
                  <button
                    onClick={() => handleRemoveMedication(idx)}
                    type="button"
                    className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="Xóa thuốc này"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Medicine Name */}
                  <div className="md:col-span-3">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Tên thuốc / Biệt dược
                    </label>
                    <input
                      type="text"
                      value={med.name}
                      onChange={(e) => handleMedicationChange(idx, 'name', e.target.value)}
                      placeholder="Nhập tên thuốc (ví dụ: Isotretinoin 20mg)"
                      className={getInputClass(isReviewMode)}
                      readOnly={isReviewMode}
                    />
                  </div>

                  {/* Dosage */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Liều lượng
                    </label>
                    <input
                      type="text"
                      value={med.dosage}
                      onChange={(e) => handleMedicationChange(idx, 'dosage', e.target.value)}
                      placeholder="ví dụ: 1 viên"
                      className={getInputClass(isReviewMode)}
                      readOnly={isReviewMode}
                    />
                  </div>

                  {/* Frequency */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Tần suất uống / bôi
                    </label>
                    <input
                      type="text"
                      value={med.frequency}
                      onChange={(e) => handleMedicationChange(idx, 'frequency', e.target.value)}
                      placeholder="ví dụ: 1 lần/ngày (sau ăn)"
                      className={getInputClass(isReviewMode)}
                      readOnly={isReviewMode}
                    />
                  </div>

                  {/* Instructions */}
                  <div className="md:col-span-3">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Hướng dẫn chi tiết sử dụng
                    </label>
                    <textarea
                      value={med.instructions}
                      onChange={(e) => handleMedicationChange(idx, 'instructions', e.target.value)}
                      placeholder="ví dụ: Thoa một lớp mỏng lên nốt mụn viêm buổi tối trước khi đi ngủ."
                      rows="2"
                      className={`${getInputClass(isReviewMode)} resize-none`}
                      readOnly={isReviewMode}
                    />
                  </div>
                </div>
              </div>
            ))}

            {medications.length === 0 && (
              <div className="text-center py-8 bg-slate-50/30 border-2 border-dashed border-slate-200 rounded-2xl">
                <p className="text-sm font-semibold text-slate-400">
                  Chưa có thuốc nào được thêm vào đơn.
                </p>
                {!isReviewMode && (
                  <button
                    onClick={handleAddMedication}
                    type="button"
                    className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-500/10 active:scale-95 transition-all"
                  >
                    <Plus className="w-4 h-4" /> Kê thuốc đầu tiên
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* General Notes for Patient */}
        <div className="mt-6 pt-6 border-t border-slate-200/60">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Lời dặn chung của Bác sĩ (Sinh hoạt, Ăn uống, Chăm sóc)
          </label>
          <textarea
            value={generalInstructions}
            onChange={(e) => setGeneralInstructions(e.target.value)}
            placeholder="Nhập hướng dẫn chế độ ăn uống, chống nắng, dưỡng ẩm thêm..."
            rows="2"
            className={`${getInputClass(isReviewMode)} resize-none`}
            readOnly={isReviewMode}
          />
        </div>
      </div>
      {/* Follow-up Section (Hẹn tái khám) */}
      <div className="glass-3d water-refract rounded-[2rem] p-6">
        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-200/40">
          <Calendar className="w-5 h-5 text-emerald-600" />
          <h3 className="font-extrabold text-lg text-slate-900">Lịch Hẹn Tái Khám</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="follow-up-date" className="block text-xs font-bold text-slate-700 mb-2">
              Hẹn ngày tái khám
            </label>
            <input
              id="follow-up-date"
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className={getInputClass(isReviewMode)}
              readOnly={isReviewMode}
            />
          </div>

          <div>
            <label htmlFor="follow-up-notes" className="block text-xs font-bold text-slate-700 mb-2">
              Lời dặn / Ghi chú tái khám
            </label>
            <input
              id="follow-up-notes"
              type="text"
              value={followUpNotes}
              onChange={(e) => setFollowUpNotes(e.target.value)}
              placeholder="VD: Mang theo kết quả xét nghiệm máu lần kế tiếp"
              className={getInputClass(isReviewMode)}
              readOnly={isReviewMode}
            />
          </div>
        </div>
      </div>
    </div>
  );

}
