import React, { useState, useEffect } from 'react';
import { Pill, Plus, Trash2, GripVertical, FileText, Stethoscope } from 'lucide-react';
import { GLASS_INPUT } from '../../../common/GlassCard';
import GlassAutoComplete from '../../../common/GlassAutoComplete';
import { PrescriptionModel } from '../../../../models/PrescriptionModel';

export default function PrescriptionForm({ appointmentId, isReviewMode = false, examRecord = null, initialDiagnosis = '', onChange }) {
  // For the moment, we treat existingPrescription as null
  const existingPrescription = null;

  const [medications, setMedications] = useState([]);
  const [generalInstructions, setGeneralInstructions] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [diagnosis, setDiagnosis] = useState('');

  // Load existing data if available or if in review mode
  useEffect(() => {
    if (isReviewMode && examRecord) {
      setMedications(examRecord.medications || []);
      setGeneralInstructions(examRecord.generalInstructions || '');
      setFollowUpDate(examRecord.followUpDate || '');
      setFollowUpNotes(examRecord.followUpNotes || '');
      setDiagnosis(examRecord.diagnosis || '');
    } else if (existingPrescription) {
      setMedications(existingPrescription.medications || []);
      setGeneralInstructions(existingPrescription.generalInstructions || '');
    } else {
      // Initialize with initialDiagnosis for live mode
      setDiagnosis((prev) => prev || initialDiagnosis || '');
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
  }, [existingPrescription, isReviewMode, examRecord, initialDiagnosis]);

  // Bubble changes up to parent component
  useEffect(() => {
    if (onChange && !isReviewMode) {
      onChange({
        medications,
        generalInstructions,
        followUpDate,
        followUpNotes,
        diagnosis
      });
    }
  }, [medications, generalInstructions, followUpDate, followUpNotes, diagnosis, onChange, isReviewMode]);

  // Handlers for medications
  const handleAddMedication = () => {
    setMedications([...medications, { name: '', dosage: '', frequency: '', instructions: '' }]);
  };

  const handleRemoveMedication = (index) => {
    const updated = [...medications];
    updated.splice(index, 1);
    setMedications(updated);
  };

  const handleMedicationChange = (index, field, value) => {
    const updated = [...medications];
    updated[index] = { ...updated[index], [field]: value };
    setMedications(updated);
  };

  const baseInputClass = `${GLASS_INPUT} w-full text-sm font-semibold text-gray-900 rounded-xl`;

  const getInputClass = (readOnly) => `${baseInputClass} ${
    readOnly 
      ? 'bg-slate-100/50 text-slate-900 font-medium cursor-not-allowed border-slate-200/60 focus:ring-0 focus:border-slate-200/80' 
      : ''
  }`;

  return (
    <div className="space-y-6">
      {/* Premium Prescription Pad */}
      <div className="backdrop-blur-xl bg-white/80 border border-slate-200/60 shadow-[0_12px_40px_rgba(0,0,0,0.06)] rounded-2xl relative overflow-hidden">
        
        {/* Decorative top bar */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
        
        {/* Clinic branding / Header */}
        <div className="px-8 pt-8 pb-6">
          <div className="flex justify-between items-start border-b border-slate-200/60 pb-6">
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
        </div>

        {/* Diagnosis Conclusion */}
        <div className="px-8 pb-6">
          <div className="flex items-center gap-2 mb-3">
            <Stethoscope className="w-4 h-4 text-teal-600" />
            <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">
              Kết luận chẩn đoán bệnh
            </label>
          </div>
          <textarea
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            placeholder="Nhập kết luận chẩn đoán bệnh..."
            rows="2"
            className={`${getInputClass(isReviewMode, !!diagnosis?.trim())} p-3.5 resize-none`}
            readOnly={isReviewMode}
          />
        </div>

        {/* Prescription Items Section */}
        <div className="px-8 pb-8">
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                Chỉ định Thuốc & Liều dùng
              </span>
            </div>
            {!isReviewMode && (
              <button
                onClick={handleAddMedication}
                type="button"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl shadow-md shadow-emerald-500/15 hover:shadow-lg hover:shadow-emerald-500/25 transition-all active:scale-95 cursor-pointer border-none"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" /> Thêm thuốc
              </button>
            )}
          </div>

          <div className="space-y-4">
            {medications?.map?.((med, idx) => (
              <div 
                key={idx} 
                className="group relative bg-gradient-to-br from-white/80 to-slate-50/80 hover:from-white hover:to-slate-50 border border-slate-200/60 hover:border-emerald-200/80 rounded-2xl transition-all duration-200 shadow-sm hover:shadow-md overflow-hidden"
              >
                {/* Medication Number Badge & Header */}
                <div className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-slate-100/80">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 text-white text-xs font-black shadow-sm flex-shrink-0">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    {isReviewMode ? (
                      <p className="text-sm font-bold text-slate-800 truncate">{med.name || 'Chưa đặt tên thuốc'}</p>
                    ) : (
                      <GlassAutoComplete
                        value={med.name}
                        onChange={(val) => handleMedicationChange(idx, 'name', val)}
                        fetchSuggestions={(q) => PrescriptionModel.searchMedicines(q)}
                        // Doctors prescribe drugs not yet catalogued — keep free
                        // text; resolveMedicineId() find-or-creates it on submit.
                        allowCustomInput={true}
                        getOptionLabel={(m) => m.medicine_name}
                        renderOption={(m) => (
                          <div className="flex items-center gap-2.5">
                            <Pill className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-800 truncate">{m.medicine_name}</p>
                              {m.description && (
                                <p className="text-[11px] text-gray-500 truncate">{m.description}</p>
                              )}
                            </div>
                          </div>
                        )}
                        placeholder="Nhập tên thuốc (ví dụ: Isotretinoin 20mg)"
                        emptyMessage="Không tìm thấy thuốc phù hợp."
                      />
                    )}
                  </div>
                  {/* Delete button */}
                  {!isReviewMode && (
                    <button
                      onClick={() => handleRemoveMedication(idx)}
                      type="button"
                      className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer border-none bg-transparent flex-shrink-0"
                      title="Xóa thuốc này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Dosage & Frequency Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 px-5 py-4">
                  {/* Dosage */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                      💊 Liều lượng
                    </label>
                    <input
                      type="text"
                      value={med.dosage}
                      onChange={(e) => handleMedicationChange(idx, 'dosage', e.target.value)}
                      placeholder="ví dụ: 1 viên"
                      className={`${getInputClass(isReviewMode)} p-3`}
                      readOnly={isReviewMode}
                    />
                  </div>

                  {/* Frequency */}
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                      🕐 Tần suất uống / bôi
                    </label>
                    <input
                      type="text"
                      value={med.frequency}
                      onChange={(e) => handleMedicationChange(idx, 'frequency', e.target.value)}
                      placeholder="ví dụ: 2 lần/ngày (Sáng, Tối)"
                      className={`${getInputClass(isReviewMode)} p-3`}
                      readOnly={isReviewMode}
                    />
                  </div>

                  {/* Instructions */}
                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                      📋 Hướng dẫn chi tiết sử dụng
                    </label>
                    <textarea
                      value={med.instructions}
                      onChange={(e) => handleMedicationChange(idx, 'instructions', e.target.value)}
                      placeholder="ví dụ: Thoa một lớp mỏng lên nốt mụn viêm buổi tối trước khi đi ngủ."
                      rows="2"
                      className={`${getInputClass(isReviewMode)} p-3 resize-none`}
                      readOnly={isReviewMode}
                    />
                  </div>
                </div>
              </div>
            ))}

            {medications.length === 0 && (
              <div className="text-center py-12 bg-slate-50/30 border-2 border-dashed border-slate-200 rounded-2xl">
                <Pill className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-400 mb-1">
                  Chưa có thuốc nào được thêm vào đơn.
                </p>
                <p className="text-xs text-slate-300 mb-4">
                  Nhấn nút bên dưới để bắt đầu kê đơn thuốc cho bệnh nhân.
                </p>
                {!isReviewMode && (
                  <button
                    onClick={handleAddMedication}
                    type="button"
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-500/15 active:scale-95 transition-all cursor-pointer border-none"
                  >
                    <Plus className="w-4 h-4" /> Kê thuốc đầu tiên
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* General Notes for Patient */}
        <div className="px-8 pb-8">
          <div className="pt-6 border-t border-slate-200/60">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">📝</span>
              <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                Lời dặn chung của Bác sĩ
              </label>
            </div>
            <p className="text-[11px] text-slate-400 font-medium mb-2">
              Hướng dẫn chế độ ăn uống, chống nắng, dưỡng ẩm, sinh hoạt, chăm sóc da
            </p>
            <textarea
              value={generalInstructions}
              onChange={(e) => setGeneralInstructions(e.target.value)}
              placeholder="Nhập hướng dẫn chế độ ăn uống, chống nắng, dưỡng ẩm thêm..."
              rows="3"
              className={`${getInputClass(isReviewMode)} p-3.5 resize-none`}
              readOnly={isReviewMode}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
