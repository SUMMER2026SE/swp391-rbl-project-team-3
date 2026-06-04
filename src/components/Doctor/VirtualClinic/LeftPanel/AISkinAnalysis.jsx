import React from 'react';
import { Brain, ScanFace } from 'lucide-react';
import { mockAISkinResults } from '../../../../mockData';

export default function AISkinAnalysis({ patientId }) {
  const fallbackResult = {
    patientId: patientId || "fallback",
    overallScore: 85,
    imageUrl: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&q=80&w=800",
    metrics: {
      acne: { score: 30, severity: "Moderate", description: "Vài nốt mụn viêm ở vùng má." },
      pigmentation: { score: 90, severity: "Low", description: "Màu da đồng đều, ít sạm nám." },
      hydration: { score: 55, severity: "Moderate", description: "Da hơi khô ở vùng trán." },
      wrinkles: { score: 85, severity: "Low", description: "Độ đàn hồi tốt, ít nếp nhăn." }
    },
    highlights: [
      { x: '35%', y: '45%', radius: 30, type: "acne", color: "rgba(239, 68, 68, 0.5)" }, // Red
      { x: '65%', y: '40%', radius: 25, type: "pigmentation", color: "rgba(245, 158, 11, 0.5)" }, // Amber
      { x: '50%', y: '25%', radius: 40, type: "hydration", color: "rgba(14, 165, 233, 0.5)" } // Sky blue
    ]
  };

  // Try to find the latest AI result for the patient
  const aiResult = mockAISkinResults?.find(r => r.patientId === patientId);

  if (!aiResult) {
    return (
      <div className="glass-3d water-refract rounded-[2rem] p-8 text-center text-slate-500 font-medium mb-6">
        <Brain className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-sm font-semibold">Chưa có dữ liệu xét nghiệm/AI cho bệnh nhân này.</p>
      </div>
    );
  }

  return (
    <div className="glass-3d water-refract rounded-[2rem] p-6">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200/40">
        <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
          <Brain className="w-5 h-5 text-teal-600" />
          Phân tích da AI
        </h3>
        <span className="text-xs font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200/50">
          Điểm tổng thể: {aiResult?.overallScore}/100
        </span>
      </div>

      <div className="flex flex-col gap-6">
        {/* Image Viewer with Overlay */}
        <div className="relative rounded-2xl overflow-hidden bg-slate-900 aspect-square sm:aspect-video flex items-center justify-center border border-slate-200/40 shadow-inner">
          {aiResult?.imageUrl ? (
            <img
              src={aiResult.imageUrl}
              alt="AI Skin Analysis Scan"
              className="absolute inset-0 w-full h-full object-cover opacity-90"
            />
          ) : (
            <div className="text-slate-500 flex flex-col items-center">
              <ScanFace className="w-12 h-12 mb-2 opacity-50" />
              <p className="text-sm font-semibold">Chưa có hình ảnh scan</p>
            </div>
          )}
          
          {/* AI Highlights Overlay */}
          {aiResult?.highlights?.map((highlight, index) => (
            <div
              key={index}
              className="absolute rounded-full border-[3px] shadow-[0_0_15px_rgba(0,0,0,0.3)] animate-pulse"
              style={{
                top: highlight.y,
                left: highlight.x,
                width: highlight.radius * 2,
                height: highlight.radius * 2,
                borderColor: highlight.color,
                backgroundColor: highlight.color.replace('0.5', '0.1') // slight fill
              }}
              title={highlight.type}
            ></div>
          ))}
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Object.entries(aiResult?.metrics || {}).map(([key, data]) => {
            // Determine colors based on score
            let colorClass = "bg-teal-500";
            let textClass = "text-teal-700";
            let bgClass = "bg-teal-50";
            
            if (data.score < 50) {
              colorClass = "bg-rose-500";
              textClass = "text-rose-700";
              bgClass = "bg-rose-50";
            } else if (data.score < 70) {
              colorClass = "bg-amber-500";
              textClass = "text-amber-700";
              bgClass = "bg-amber-50";
            }

            return (
              <div key={key} className="bg-white/50 p-3 rounded-xl border border-slate-200/60 shadow-sm">
                <div className="flex justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 capitalize">{key}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${textClass} ${bgClass} border-current/20`}>
                    {data.severity}
                  </span>
                </div>
                <div className="w-full bg-slate-200/50 rounded-full h-1.5 mb-2">
                  <div className={`${colorClass} h-1.5 rounded-full`} style={{ width: `${data.score}%` }}></div>
                </div>
                <p className="text-[11px] text-slate-500 font-medium line-clamp-2">{data.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
