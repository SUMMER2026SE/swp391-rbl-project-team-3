import React from 'react';
import { Database } from 'lucide-react';

const LiquidGlassEmptyState = ({ 
  title = "Hiện chưa có dữ liệu", 
  subtitle = "Hệ thống chưa ghi nhận dữ liệu cho mục này.", 
  icon: Icon = Database,
  className = "" 
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-10 w-full h-full min-h-[300px] backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-sm relative overflow-hidden ${className}`}>
      {/* Decorative glass elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-100/30 to-purple-100/30 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-teal-100/30 to-blue-100/30 rounded-full blur-2xl opacity-50 translate-y-1/3 -translate-x-1/4" />
      
      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="w-20 h-20 mb-6 rounded-full bg-gradient-to-tr from-white/40 to-white/10 border border-white/30 backdrop-blur-md flex items-center justify-center shadow-inner">
          <Icon className="w-8 h-8 text-slate-400" strokeWidth={1.5} />
        </div>
        <h3 className="text-xl font-semibold text-slate-700 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 max-w-sm">{subtitle}</p>
      </div>
    </div>
  );
};

export default LiquidGlassEmptyState;
