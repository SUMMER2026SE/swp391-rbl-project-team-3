import React, { useState, useEffect } from 'react';
import { Sparkles, ImageOff, Loader2, Info } from 'lucide-react';
import { SkinAnalysisModel } from '../../models/SkinAnalysisModel';
import { GLASS_BASE } from '../common/GlassCard';

// History of the patient's SELF-RUN AI skin scans (landing-page feature), shown
// to both sides of the desk:
//   variant="doctor"  — inside the exam workspace. Renders NOTHING when the
//                       patient never used the AI, and carries an explicit
//                       "reference only, not a diagnosis" banner so it can
//                       never be confused with the technician's clinical results.
//   variant="patient" — inside the patient's own "Hồ sơ bệnh án" tab, with a
//                       friendly empty state instead of disappearing.
//
// Only REAL model predictions are ever persisted (simulated/demo results are
// filtered out at the write path), so everything listed here came from the
// actual model.

const formatWhen = (iso) =>
  iso
    ? new Date(iso).toLocaleString('vi-VN', {
        hour: '2-digit', minute: '2-digit',
        day: '2-digit', month: '2-digit', year: 'numeric',
      })
    : '';

function ScanCard({ scan }) {
  const pct = scan.confidence != null ? Math.round(scan.confidence * 100) : null;
  return (
    <div className="bg-white/70 border border-slate-200/60 rounded-2xl p-4 shadow-sm">
      <div className="flex gap-4">
        <div className="w-24 h-24 shrink-0 rounded-xl overflow-hidden border border-slate-200/60 bg-slate-50 flex items-center justify-center">
          {scan.imageUrl ? (
            <img
              src={scan.imageUrl}
              alt={scan.condition || 'Ảnh soi da'}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          ) : (
            <ImageOff className="w-6 h-6 text-slate-300" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="font-bold text-sm text-slate-900">{scan.condition || 'Không xác định'}</p>
            {pct != null && (
              <span
                className={`shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full border ${
                  pct >= 80
                    ? 'bg-violet-50 text-violet-700 border-violet-200/60'
                    : 'bg-slate-50 text-slate-600 border-slate-200/60'
                }`}
              >
                {pct}% tin cậy
              </span>
            )}
          </div>
          <p className="text-[11px] font-semibold text-slate-400 mt-0.5">{formatWhen(scan.createdAt)}</p>
          {scan.recommendation && (
            <p className="text-xs text-slate-600 font-medium leading-relaxed mt-2 line-clamp-3">
              {scan.recommendation}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AIScanHistory({ patientId, variant = 'patient' }) {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!patientId) {
      setScans([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    SkinAnalysisModel.getByPatient(patientId)
      .then((rows) => { if (active) setScans(rows); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [patientId]);

  const isDoctor = variant === 'doctor';

  // Doctor side: no scans (or still loading) → no panel at all. The workspace
  // must not show an empty "AI" block for a patient who never used the feature.
  if (isDoctor && (loading || scans.length === 0)) return null;

  const list = (
    <div className="space-y-3">
      {scans.map((s) => (
        <ScanCard key={s.id} scan={s} />
      ))}
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
      </div>
    );
  }

  // Patient variant — plain white section that matches the profile tabs.
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-left">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-violet-600" />
        <h3 className="font-bold text-base text-slate-900">Lịch sử Soi da AI của bạn</h3>
      </div>
      {loading ? (
        <div className="flex items-center gap-2 text-slate-400 text-sm font-semibold py-6 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" /> Đang tải…
        </div>
      ) : scans.length === 0 ? (
        <p className="text-sm text-slate-400 font-medium py-4 text-center">
          Bạn chưa soi da bằng AI lần nào. Hãy thử tính năng &quot;Soi da AI miễn phí&quot; ở trang chủ —
          kết quả sẽ được lưu tại đây và bác sĩ có thể tham khảo khi bạn đến khám.
        </p>
      ) : (
        list
      )}
    </div>
  );
}
