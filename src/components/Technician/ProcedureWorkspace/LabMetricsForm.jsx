import React from 'react';
import { GLASS_BASE, GLASS_INPUT } from '../../common/GlassCard';

const LabMetricsForm = ({ task }) => {
    const metrics = task?.procedureDetails?.metrics || [];

    return (
        <div className={`${GLASS_BASE} p-6 h-full flex flex-col`}>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Nhập kết quả xét nghiệm</h3>
            <p className="text-sm text-slate-500 mb-6">Vui lòng điền đầy đủ các chỉ số được yêu cầu.</p>
            
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {metrics?.map((metric, idx) => (
                    <div key={idx} className="space-y-1.5">
                        <label className="block text-sm font-medium text-slate-700">
                            {metric}
                        </label>
                        <input
                            type="text"
                            className={`${GLASS_INPUT} w-full p-3 font-semibold`}
                            placeholder={`Nhập kết quả ${metric.toLowerCase()}...`}
                        />
                    </div>
                ))}
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-slate-700">
                        Đánh giá chung / Ghi chú kết quả
                    </label>
                    <textarea
                        rows="3"
                        className={`${GLASS_INPUT} w-full p-3 font-semibold resize-none`}
                        placeholder="Nhập ghi chú thêm nếu có..."
                    ></textarea>
                </div>
            </div>
        </div>
    );
};

export default LabMetricsForm;
