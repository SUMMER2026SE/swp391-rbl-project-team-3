import React, { useState, useEffect } from 'react';
import { Brain, ScanFace, ImageOff } from 'lucide-react';
import { supabase } from '../../../../supabaseClient';
import { GLASS_BASE } from '../../../common/GlassCard';

export default function AISkinAnalysis({ patientId, ticketsStatusHash }) {
  const [scanData, setScanData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!patientId) {
      setLoading(false);
      return;
    }
    const fetchLatestScan = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('service_tickets')
          .select(`
            result_image_url,
            result_images,
            result_notes,
            result_metrics,
            service_name,
            updated_at,
            appointment:appointments!inner (
              patient_id
            )
          `)
          .eq('appointment.patient_id', patientId)
          .eq('status', 'TECH_COMPLETED')
          .order('updated_at', { ascending: false })
          .limit(1);

        if (error) throw error;

        if (data && data.length > 0 && data[0]?.result_image_url) {
          setScanData(data[0]);
        } else {
          setScanData(null);
        }
      } catch (err) {
        console.error('[AISkinAnalysis] Error fetching scan:', err);
        setScanData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchLatestScan();
  }, [patientId, ticketsStatusHash]);

  // While loading, show a skeleton
  if (loading) {
    return (
      <div className={`${GLASS_BASE} water-refract rounded-2xl p-6`}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 rounded bg-slate-200 animate-pulse" />
          <div className="h-5 w-40 rounded bg-slate-200 animate-pulse" />
        </div>
        <div className="aspect-video rounded-xl bg-slate-100 animate-pulse" />
      </div>
    );
  }

  // If patient hasn't used the AI/scan feature at all, hide the section entirely
  if (!scanData) {
    return null;
  }

  // Parse real data from the scan result
  const imageUrl = scanData.result_image_url;
  const resultImages = Array.isArray(scanData.result_images) ? scanData.result_images : [];
  const resultNotes = scanData.result_notes || '';
  const resultMetrics = scanData.result_metrics && typeof scanData.result_metrics === 'object'
    ? scanData.result_metrics
    : {};
  const serviceName = scanData.service_name || 'Kết quả cận lâm sàng';
  const updatedAt = scanData.updated_at
    ? new Date(scanData.updated_at).toLocaleString('vi-VN', {
        hour: '2-digit', minute: '2-digit',
        day: '2-digit', month: '2-digit', year: 'numeric'
      })
    : null;

  // Collect all real images (primary + extras)
  const allImages = [];
  if (imageUrl) allImages.push({ url: imageUrl, name: 'Ảnh chính' });
  resultImages.forEach((img, idx) => {
    if (img?.url && img.url !== imageUrl) {
      allImages.push({ url: img.url, name: img.name || `Ảnh ${idx + 1}` });
    }
  });

  const metricEntries = Object.entries(resultMetrics).filter(([k]) => k !== 'fallbackResult');

  return (
    <div className={`${GLASS_BASE} water-refract rounded-2xl p-6 text-left`}>
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200/40">
        <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
          <Brain className="w-5 h-5 text-teal-600" />
          {serviceName}
        </h3>
        {updatedAt && (
          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100/80 px-2.5 py-1 rounded-full">
            {updatedAt}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-5">
        {/* Real scan images */}
        {allImages.length > 0 ? (
          <div className={`grid gap-3 ${allImages.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {allImages.map((img, idx) => (
              <div key={idx} className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-200/40 shadow-inner group">
                <img
                  src={img.url}
                  alt={img.name}
                  className="w-full h-auto max-h-80 object-contain bg-slate-50"
                  loading="lazy"
                />
                {img.name && (
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2">
                    <span className="text-[11px] font-semibold text-white/90">{img.name}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <ImageOff className="w-10 h-10 text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-400">Không có hình ảnh kết quả</p>
          </div>
        )}

        {/* Real metrics from technician */}
        {metricEntries.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">Chỉ số xét nghiệm</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {metricEntries.map(([key, value]) => (
                <div key={key} className="bg-white/60 p-3 rounded-xl border border-slate-200/60 shadow-sm">
                  <span className="text-xs font-bold text-slate-700 capitalize block mb-1">{key}</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Technician notes */}
        {resultNotes && (
          <div className="bg-amber-50/60 border border-amber-200/50 rounded-xl p-4">
            <h4 className="text-xs font-black text-amber-700 uppercase tracking-wider mb-2">
              Ghi chú Kỹ thuật viên
            </h4>
            <p className="text-sm text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">
              {resultNotes}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
