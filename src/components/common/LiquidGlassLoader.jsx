import React from 'react';
import { Loader2 } from 'lucide-react';

const LiquidGlassLoader = ({ text = "Đang tải dữ liệu...", className = "" }) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 w-full h-full min-h-[200px] backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-xl overflow-hidden relative ${className}`}>
      {/* Decorative gradient orb behind loader */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-blue-400/20 rounded-full blur-3xl" />
      
      <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4 relative z-10" />
      <p className="text-slate-600/80 font-medium animate-pulse relative z-10">
        {text}
      </p>
    </div>
  );
};

export default LiquidGlassLoader;
