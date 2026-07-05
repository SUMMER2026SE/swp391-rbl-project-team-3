import React from 'react';
import { Stethoscope } from 'lucide-react';
import { GLASS_BASE, GLASS_INPUT } from '../../../common/GlassCard';
import GlassAutoComplete from '../../../common/GlassAutoComplete';
import { MedicalRecordModel } from '../../../../models/MedicalRecordModel';

export default function DiagnosisForm({ value = '', onChange, isReviewMode = false }) {
  // Review mode is a plain frosted read-out; live mode is a DB-backed type-ahead
  // querying the `diagnoses` (ICD-10) catalogue in real time.
  return (
    <div className={`${GLASS_BASE} water-refract rounded-2xl p-6 mb-6 relative z-50`}>
      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-200/40">
        <Stethoscope className="w-5 h-5 text-teal-600" />
        <h3 className="text-lg font-bold text-gray-900 tracking-tight">Chẩn đoán Lâm sàng</h3>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wider">
          Chẩn đoán xác định (ICD-10)
        </label>

        {isReviewMode ? (
          <input
            type="text"
            value={value}
            readOnly
            className={`${GLASS_INPUT} w-full py-3 pl-4 pr-10 text-sm font-semibold rounded-xl bg-slate-100/50 cursor-not-allowed`}
          />
        ) : (
          <GlassAutoComplete
            value={value}
            onChange={onChange}
            fetchSuggestions={(q) => MedicalRecordModel.searchDiagnoses(q)}
            // ICD-10 is standardized: no free-text fallback, and the parent state
            // stores the canonical "code - name" string on select.
            allowCustomInput={false}
            getOptionLabel={(d) => `${d.icd10_code} - ${d.name}`}
            renderOption={(d) => (
              <div className="flex items-center gap-2.5">
                <span className="shrink-0 px-2 py-0.5 rounded-lg bg-teal-500/15 text-teal-700 text-[11px] font-bold tracking-wide tabular-nums">
                  {d.icd10_code}
                </span>
                <span className="text-sm font-semibold text-gray-800 truncate">{d.name}</span>
              </div>
            )}
            placeholder="Nhập mã hoặc tên bệnh (VD: L20.9 Viêm da cơ địa)..."
            emptyMessage="Không tìm thấy chẩn đoán phù hợp."
          />
        )}
      </div>
    </div>
  );
}
