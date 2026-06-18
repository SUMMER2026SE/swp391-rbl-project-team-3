import React, { useState, useRef, useEffect } from 'react';
import { Stethoscope, Search } from 'lucide-react';
import { GLASS_INPUT } from '../../../common/GlassCard';

const ICD10_CODES = [
  "L20.9 - Viêm da cơ địa",
  "L70.0 - Mụn trứng cá thông thường",
  "L21.9 - Viêm da tiết bã",
  "L40.0 - Vẩy nến thể mảng",
  "L30.9 - Chàm (Eczema) không xác định",
  "L53.9 - Ban đỏ không xác định",
  "L81.1 - Nám da (Chloasma)",
  "B35.4 - Nấm da toàn thân",
  "B00.9 - Nhiễm virus Herpes simplex",
  "L01.0 - Chốc lây (Impetigo)",
  "L50.9 - Mày đay không xác định",
  "L73.2 - Viêm tuyến mồ hôi mủ"
];

export default function DiagnosisForm({ value = '', onChange, isReviewMode = false }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef(null);

  const filteredCodes = ICD10_CODES.filter(code => 
    code.toLowerCase().includes(value.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="glass-3d water-refract rounded-[2rem] p-6 mb-6 relative z-50">
      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-200/40">
        <Stethoscope className="w-5 h-5 text-teal-600" />
        <h3 className="text-lg font-bold text-gray-900 tracking-tight">Chẩn đoán Lâm sàng</h3>
      </div>
      <div ref={wrapperRef} className="relative">
        <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wider">Chẩn đoán xác định (ICD-10)</label>
        <div className="relative">
          <input
            type="text"
            value={value}
            onChange={(e) => {
              onChange && onChange(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => !isReviewMode && setShowDropdown(true)}
            readOnly={isReviewMode}
            className={`${GLASS_INPUT} w-full py-3 pl-4 pr-10 text-sm font-semibold rounded-xl ${
              isReviewMode ? 'bg-slate-100/50 cursor-not-allowed' : ''
            }`}
            placeholder="Nhập mã hoặc tên bệnh (VD: L20.9 Viêm da cơ địa)..."
          />
          {!isReviewMode && (
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          )}
        </div>

        {/* Dropdown for ICD-10 suggestions */}
        {showDropdown && !isReviewMode && filteredCodes.length > 0 && (
          <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto custom-scrollbar">
            {filteredCodes.map((code, index) => (
              <div
                key={index}
                onClick={() => {
                  onChange && onChange(code);
                  setShowDropdown(false);
                }}
                className="px-4 py-3 hover:bg-sky-50 cursor-pointer text-sm font-medium text-slate-700 border-b border-slate-100 last:border-0 transition-colors"
              >
                {code}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
