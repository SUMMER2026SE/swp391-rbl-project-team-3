import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, ImageOff, Loader2, Info, Trash2, X, Brain } from 'lucide-react';
import { SkinAnalysisModel } from '../../models/SkinAnalysisModel';
import { GLASS_BASE } from '../common/GlassCard';

// ─── Localization & Styles Helpers ──────────────────────────────────────────

const translateLabel = (label) => {
  if (!label) return '';
  const cleanLabel = label.trim().toLowerCase();
  const translationMap = {
    'acne': 'Mụn trứng cá',
    'pustule': 'Mụn mủ',
    'pustules': 'Mụn mủ',
    'papule': 'Mụn sẩn',
    'papules': 'Mụn sẩn',
    'nodule': 'Mụn bọc',
    'nodules': 'Mụn bọc',
    'cyst': 'Mụn nang',
    'cysts': 'Mụn nang',
    'blackhead': 'Mụn đầu đen',
    'blackheads': 'Mụn đầu đen',
    'whitehead': 'Mụn đầu trắng',
    'whiteheads': 'Mụn đầu trắng',
    'dark spot': 'Thâm & Nám',
    'dark spots': 'Thâm & Nám',
    'dark_spots': 'Thâm & Nám',
    'darkspot': 'Thâm & Nám',
    'darkspots': 'Thâm & Nám',
    'pore': 'Lỗ chân lông',
    'pores': 'Lỗ chân lông',
    'wrinkle': 'Nếp nhăn',
    'wrinkles': 'Nếp nhăn',
    'scar': 'Sẹo mụn',
    'scars': 'Sẹo mụn',
    'normal_skin': 'Da thường',
    'normal skin': 'Da thường',
    'normal': 'Da thường'
  };
  return translationMap[cleanLabel] || label;
};

const getLabelStyle = (label) => {
  if (!label) return { stroke: 'rgba(99, 102, 241, 0.8)', fill: 'rgba(99, 102, 241, 0.12)', text: 'rgba(99, 102, 241, 1)' };
  const cleanLabel = label.trim().toLowerCase();

  if (['acne', 'pustule', 'pustules', 'papule', 'papules', 'nodule', 'nodules', 'cyst', 'cysts'].includes(cleanLabel)) {
    return { stroke: 'rgba(239, 68, 68, 0.8)',  fill: 'rgba(239, 68, 68, 0.12)', text: 'rgba(239, 68, 68, 1)' };
  }
  if (['dark spot', 'dark spots', 'dark_spots', 'darkspot', 'darkspots', 'scar', 'scars'].includes(cleanLabel)) {
    return { stroke: 'rgba(245, 158, 11, 0.8)', fill: 'rgba(245, 158, 11, 0.12)', text: 'rgba(245, 158, 11, 1)' };
  }
  if (['blackhead', 'blackheads', 'whitehead', 'whiteheads'].includes(cleanLabel)) {
    return { stroke: 'rgba(249, 115, 22, 0.8)', fill: 'rgba(249, 115, 22, 0.12)', text: 'rgba(249, 115, 22, 1)' };
  }
  if (['pore', 'pores'].includes(cleanLabel)) {
    return { stroke: 'rgba(14, 165, 233, 0.8)', fill: 'rgba(14, 165, 233, 0.12)', text: 'rgba(14, 165, 233, 1)' };
  }
  if (['wrinkle', 'wrinkles'].includes(cleanLabel)) {
    return { stroke: 'rgba(168, 85, 247, 0.8)', fill: 'rgba(168, 85, 247, 0.12)', text: 'rgba(168, 85, 247, 1)' };
  }
  if (['normal', 'normal_skin', 'normal skin'].includes(cleanLabel)) {
    return { stroke: 'rgba(16, 185, 129, 0.8)', fill: 'rgba(16, 185, 129, 0.12)', text: 'rgba(16, 185, 129, 1)' };
  }
  return { stroke: 'rgba(99, 102, 241, 0.8)', fill: 'rgba(99, 102, 241, 0.12)', text: 'rgba(99, 102, 241, 1)' };
};

const formatWhen = (iso) =>
  iso
    ? new Date(iso).toLocaleString('vi-VN', {
        hour: '2-digit', minute: '2-digit',
        day: '2-digit', month: '2-digit', year: 'numeric',
      })
    : '';

// ─── Compact Card for Doctor list view ────────────────────────────────────────

function ScanCard({ scan, onSelect }) {
  const pct = scan.confidence != null ? Math.round(scan.confidence * 100) : null;
  return (
    <div className="bg-white/70 border border-slate-200/60 rounded-2xl p-4 shadow-sm text-left">
      <div className="flex gap-4">
        <div className="w-24 h-24 shrink-0 rounded-xl overflow-hidden border border-slate-200/60 bg-slate-50 flex items-center justify-center">
          {scan.imageUrl ? (
            <img
              src={scan.imageUrl}
              alt={scan.condition || 'Ảnh soi da'}
              loading="lazy"
              className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-all duration-350"
              onClick={() => onSelect(scan)}
            />
          ) : (
            <ImageOff className="w-6 h-6 text-slate-300" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="font-bold text-sm text-slate-900">{translateLabel(scan.condition) || 'Không xác định'}</p>
            {pct != null && (
              <span
                className="shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full border bg-violet-50 text-violet-700 border-violet-200/60"
              >
                {pct}% tin cậy
              </span>
            )}
          </div>
          <p className="text-[11px] font-semibold text-slate-400 mt-0.5">{formatWhen(scan.createdAt)}</p>
          {scan.recommendation && (
            <p className="text-xs text-slate-600 font-medium leading-relaxed mt-2 line-clamp-2">
              {scan.recommendation}
            </p>
          )}
          <button 
            onClick={() => onSelect(scan)} 
            className="text-[10px] font-black text-teal-600 hover:text-teal-700 mt-2 bg-transparent border-none p-0 cursor-pointer flex items-center gap-1"
          >
            Chi tiết soi da &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Split Screen Detail Modal ────────────────────────────────────────────────

function ScanDetailModal({ scan, onClose }) {
  const style = getLabelStyle(scan.condition);
  const translatedName = translateLabel(scan.condition);
  const confidencePercent = scan.confidence != null ? Math.round(scan.confidence * 100) : 95;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 sm:p-6" 
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-full max-w-4xl bg-white rounded-3xl overflow-hidden shadow-2xl relative border border-slate-100 flex flex-col md:flex-row max-h-[90vh] md:max-h-[80vh] text-left"
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 z-10 p-2 bg-slate-100/80 hover:bg-slate-200 backdrop-blur-sm rounded-full text-slate-500 hover:text-slate-700 transition-all cursor-pointer border-none flex items-center justify-center"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Column: Face Image (No overlays, raw, clean) */}
        <div className="w-full md:w-1/2 bg-slate-950 flex items-center justify-center aspect-[4/3] md:aspect-auto min-h-[300px] md:min-h-0 relative">
          {scan.imageUrl ? (
            <img src={scan.imageUrl} alt="Scan Detail" className="w-full h-full object-cover block animate-fade-in" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-900">
              <ImageOff className="w-12 h-12 text-slate-700" />
            </div>
          )}
          <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2.5 py-1 rounded-full font-bold">
            Quét lúc: {formatWhen(scan.createdAt)}
          </div>
        </div>

        {/* Right Column: Results Display */}
        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between overflow-y-auto bg-slate-50/50">
          <div className="space-y-6">
            <div>
              <span className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">Lịch sử soi da</span>
              <h3 className="text-lg font-black text-slate-950 mt-1 uppercase">KẾT QUẢ PHÂN TÍCH DA</h3>
            </div>

            {/* Diagnosis display */}
            <div className="space-y-4">
              <div 
                className="flex items-center justify-between p-4 rounded-2xl border transition-all"
                style={{ backgroundColor: style.fill, borderColor: style.stroke }}
              >
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: style.stroke }} />
                  <span className="text-sm font-black" style={{ color: style.text }}>
                    {translatedName}
                  </span>
                </div>
                <span className="text-xs font-extrabold px-3 py-1 bg-white rounded-full shadow-sm border border-slate-100" style={{ color: style.text }}>
                  {confidencePercent}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-500">Độ tin cậy của AI:</span>
                  <span className="font-bold text-slate-800">{confidencePercent}%</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${confidencePercent}%`, 
                      backgroundColor: style.stroke 
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="p-4 rounded-2xl bg-white border border-slate-150 shadow-sm space-y-1.5">
              <span className="text-[9px] font-extrabold text-teal-600 tracking-wider uppercase">Lời khuyên y khoa:</span>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {scan.recommendation || "Vui lòng tham khảo ý kiến bác sĩ da liễu để được khám chuyên sâu."}
              </p>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-100">
            <button 
              onClick={onClose} 
              className="w-full py-3 bg-gradient-to-r from-teal-500 to-sky-500 text-white text-sm font-bold rounded-xl shadow-md shadow-teal-500/20 hover:shadow-lg transition-all cursor-pointer border-none text-center"
            >
              Đóng báo cáo
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main AIScanHistory Component ────────────────────────────────────────────

export default function AIScanHistory({ patientId, variant = 'patient' }) {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedScan, setSelectedScan] = useState(null);

  const fetchScans = () => {
    if (!patientId) {
      setScans([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    SkinAnalysisModel.getByPatient(patientId)
      .then((rows) => setScans(rows))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchScans();
    window.addEventListener('ai-scans-updated', fetchScans);
    return () => window.removeEventListener('ai-scans-updated', fetchScans);
  }, [patientId]);

  const handleDeleteScanLocal = async (scan, e) => {
    e.stopPropagation();
    if (!window.confirm('Bạn có chắc chắn muốn xóa kết quả soi da này không?')) return;
    const success = await SkinAnalysisModel.deleteScan(scan.id, scan.imageId, scan.imagePath);
    if (success) {
      setScans((prev) => prev.filter((s) => s.id !== scan.id));
      window.dispatchEvent(new CustomEvent('ai-scans-updated'));
    }
  };

  const isDoctor = variant === 'doctor';

  // Doctor side: no scans (or still loading) → no panel at all.
  if (isDoctor && (loading || scans.length === 0)) return null;

  // List layout (for Doctor examine left-panel)
  const list = (
    <div className="space-y-3">
      {scans.map((s) => (
        <ScanCard key={s.id} scan={s} onSelect={setSelectedScan} />
      ))}
    </div>
  );

  // Bento Card Grid layout (for Patient Portal profile tab)
  const grid = (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-4">
      {scans.map((scan) => {
        const style = getLabelStyle(scan.condition);
        const translatedName = translateLabel(scan.condition);
        const confidencePercent = scan.confidence != null ? Math.round(scan.confidence * 100) : 95;

        return (
          <div 
            key={scan.id} 
            className="bg-white/85 border border-slate-200/60 shadow-sm rounded-2xl p-4 flex flex-col hover:shadow-md hover:border-teal-300 transition-all group text-left"
          >
            {/* Image */}
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-950 mb-3 border border-slate-100">
              {scan.imageUrl ? (
                <img src={scan.imageUrl} alt="Face Scan" className="w-full h-full object-cover animate-fade-in" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-900">
                  <ImageOff className="w-8 h-8 text-slate-700" />
                </div>
              )}
              <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                {formatWhen(scan.createdAt)}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">CHẨN ĐOÁN:</span>
                <div 
                  className="flex items-center justify-between p-3.5 rounded-2xl border mt-1.5"
                  style={{ backgroundColor: style.fill, borderColor: style.stroke }}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: style.stroke }} />
                    <span className="text-xs font-black" style={{ color: style.text }}>
                      {translatedName}
                    </span>
                  </div>
                  <span className="text-[10px] font-black px-2 py-0.5 bg-white rounded-full shadow-sm border border-slate-100" style={{ color: style.text }}>
                    {confidencePercent}%
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100/60">
                <button
                  onClick={() => setSelectedScan(scan)}
                  className="flex-1 py-2.5 bg-gradient-to-r from-teal-500/10 to-sky-500/10 hover:from-teal-500/20 hover:to-sky-500/20 text-teal-700 text-xs font-bold rounded-xl border border-teal-500/10 hover:border-teal-500/20 transition-all cursor-pointer text-center"
                >
                  Xem chi tiết soi da
                </button>
                <button
                  onClick={(e) => handleDeleteScanLocal(scan, e)}
                  className="p-2.5 hover:bg-rose-50 text-rose-500 hover:text-rose-600 rounded-xl transition-all cursor-pointer border border-transparent hover:border-rose-100 flex items-center justify-center"
                  title="Xóa kết quả"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  if (isDoctor) {
    return (
      <div className={`${GLASS_BASE} water-refract rounded-2xl p-6 text-left`}>
        <div className="flex items-center justify-between gap-3 mb-3 pb-4 border-b border-slate-200/40">
          <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-600" />
            Soi da AI (bệnh nhân tự thực hiện)
          </h3>
          <span className="text-[11px] font-bold text-slate-500 bg-slate-100/80 px-2.5 py-1 rounded-full">
            {scans.length} lần soi
          </span>
        </div>
        <div className="flex items-start gap-2 bg-violet-50/70 border border-violet-200/50 rounded-xl px-3 py-2.5 mb-4">
          <Info className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
          <p className="text-xs font-semibold text-violet-800 leading-relaxed">
            Kết quả do bệnh nhân tự soi bằng AI trước khi khám — chỉ mang tính tham khảo,
            không phải chẩn đoán y khoa.
          </p>
        </div>
        {list}

        {/* Detail Modal for Doctor */}
        <AnimatePresence>
          {selectedScan && (
            <ScanDetailModal scan={selectedScan} onClose={() => setSelectedScan(null)} />
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Patient variant
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100 animate-pulse">
          <Brain className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">Lịch sử soi da AI</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {scans.length > 0 ? `Lưu trữ ${scans.length}/4 lần phân tích gần nhất` : 'Lưu trữ tối đa 4 kết quả phân tích gần nhất'}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-400 text-sm font-semibold py-12 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" /> Đang tải…
        </div>
      ) : scans.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-white/40 backdrop-blur-sm">
          <Brain className="w-10 h-10 text-slate-300 mx-auto mb-3 animate-pulse" />
          <p className="text-sm text-slate-500 font-semibold">Chưa có lịch sử soi da.</p>
          <p className="text-xs text-slate-400 mt-1">
            Bạn chưa soi da bằng AI lần nào. Hãy thử tính năng &quot;Soi da AI miễn phí&quot; ở trang chủ —
            kết quả sẽ được lưu tại đây và bác sĩ có thể tham khảo khi bạn đến khám.
          </p>
        </div>
      ) : (
        grid
      )}

      {/* Detail Modal for Patient */}
      <AnimatePresence>
        {selectedScan && (
          <ScanDetailModal scan={selectedScan} onClose={() => setSelectedScan(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
