import React, { useState } from 'react';
import { UploadCloud, Image as ImageIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ImageUploadModule = ({ task }) => {
    const [images, setImages] = useState([]);
    const requiredCount = task?.procedureDetails?.requiredImages || 1;

    const handleMockUpload = () => {
        if (images.length < requiredCount) {
            setImages([...images, { id: Date.now(), url: `https://picsum.photos/seed/${Date.now()}/400/300` }]);
        }
    };

    const removeImage = (id) => {
        setImages(images.filter(img => img.id !== id));
    };

    return (
        <div className="bg-white/90 border border-slate-200/60 shadow-sm rounded-2xl p-6 h-full flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Tải ảnh chụp lâm sàng</h3>
            <p className="text-sm text-slate-500 mb-6">Yêu cầu tải lên tối thiểu {requiredCount} ảnh cho dịch vụ này.</p>

            <div 
                onClick={handleMockUpload}
                className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-emerald-300 bg-emerald-50/30 hover:bg-emerald-50 rounded-2xl cursor-pointer transition-colors mb-6 p-8 text-center"
            >
                <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4">
                    <UploadCloud className="w-8 h-8 text-emerald-500" />
                </div>
                <h4 className="text-lg font-semibold text-emerald-800 mb-1">Kéo thả ảnh hoặc click để chọn</h4>
                <p className="text-sm text-emerald-600/70">Hỗ trợ JPG, PNG (Tối đa 10MB)</p>
            </div>

            <div className="h-32">
                <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center">
                    <ImageIcon className="w-4 h-4 mr-1 text-slate-400" /> 
                    Ảnh đã tải lên ({images.length}/{requiredCount})
                </h4>
                <div className="flex space-x-4 overflow-x-auto pb-2">
                    <AnimatePresence>
                        {images.map((img) => (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                key={img.id} 
                                className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-200 flex-shrink-0 group"
                            >
                                <img src={img.url} alt="Clinical" className="w-full h-full object-cover" />
                                <button 
                                    onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                                    className="absolute top-1 right-1 w-6 h-6 bg-white/80 hover:bg-red-500 hover:text-white rounded-full flex items-center justify-center text-slate-600 transition-colors opacity-0 group-hover:opacity-100 shadow-sm"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default ImageUploadModule;
