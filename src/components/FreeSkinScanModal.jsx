import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UploadCloud, Loader2, Sparkles, AlertTriangle, CheckCircle2, Calendar } from 'lucide-react';

const CLASS_MAP = {
    "acne": { name: "Mụn trứng cá", color: "from-rose-500 to-red-600", bg: "bg-rose-50 text-rose-700 border-rose-100" },
    "blackheads": { name: "Mụn đầu đen", color: "from-orange-500 to-amber-600", bg: "bg-orange-50 text-orange-700 border-orange-100" },
    "dark_spots": { name: "Thâm, nám & Sắc tố", color: "from-amber-600 to-yellow-700", bg: "bg-amber-50 text-amber-700 border-amber-100" },
    "pores": { name: "Lỗ chân lông to", color: "from-sky-500 to-blue-600", bg: "bg-sky-50 text-sky-700 border-sky-100" },
    "wrinkles": { name: "Nếp nhăn & Lão hóa", color: "from-purple-500 to-indigo-600", bg: "bg-purple-50 text-purple-700 border-purple-100" },
    "normal_skin": { name: "Da thường (Khỏe mạnh)", color: "from-emerald-500 to-teal-600", bg: "bg-emerald-50 text-emerald-700 border-emerald-100" }
};

export default function FreeSkinScanModal({ isOpen, onClose, onBookAppointment }) {
    const [image, setImage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [aiResults, setAiResults] = useState(null);
    const [activeTab, setActiveTab] = useState('original'); // 'original', 'annotated', 'cropped'
    
    const fileInputRef = useRef(null);

    const handleUploadClick = () => {
        if (!isLoading) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setError(null);
        setIsLoading(true);
        setAiResults(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('http://127.0.0.1:5000/predict', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Mã phản hồi lỗi: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }

            setAiResults(data);
            setImage(URL.createObjectURL(file));

            if (data.cropped) {
                setActiveTab('annotated');
            } else {
                setActiveTab('original');
            }
        } catch (err) {
            console.error("Lỗi soi da AI:", err);
            setError("Không thể kết nối đến máy chủ phân tích da. Vui lòng thử lại sau hoặc liên hệ bộ phận hỗ trợ.");
        } finally {
            setIsLoading(false);
            e.target.value = null;
        }
    };

    const handleReset = () => {
        setImage(null);
        setAiResults(null);
        setError(null);
    };

    const currentClassInfo = aiResults ? (CLASS_MAP[aiResults.predicted_class] || {
        name: aiResults.predicted_class,
        color: "from-slate-500 to-slate-700",
        bg: "bg-slate-50 text-slate-700 border-slate-100"
    }) : null;

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                {/* Backdrop overlay */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                />

                {/* Modal Container */}
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="bg-white border border-slate-100 w-full max-w-4xl h-[85vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden relative z-10 font-sans"
                >
                    {/* Header */}
                    <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-gradient-to-r from-emerald-50 to-sky-50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-extrabold text-slate-800 tracking-tight flex items-center gap-1.5">
                                    Soi Da AI Miễn Phí
                                </h3>
                                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    DermaSmart AI Technology
                                </span>
                            </div>
                        </div>
                        <button 
                            onClick={onClose}
                            className="w-10 h-10 bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full border border-slate-200/60 shadow-sm flex items-center justify-center transition-all cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Scrollable Body */}
                    <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col md:flex-row gap-6">
                        
                        {/* Left Side: Upload Area or Image Preview */}
                        <div className="flex-1 flex flex-col border border-slate-100 rounded-2xl bg-slate-50/50 p-4 relative overflow-hidden min-h-[300px]">
                            <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                ref={fileInputRef} 
                                onChange={handleFileChange}
                            />

                            {!image ? (
                                <div 
                                    onClick={handleUploadClick}
                                    className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 bg-white hover:border-emerald-400 hover:bg-emerald-50/20 rounded-2xl cursor-pointer transition-all duration-300 p-8 text-center h-full ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
                                >
                                    {isLoading ? (
                                        <div className="flex flex-col items-center">
                                            <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
                                            <h4 className="text-md font-semibold text-slate-700 mb-1">Đang phân tích cấu trúc da...</h4>
                                            <p className="text-xs text-slate-400 max-w-xs leading-relaxed">AI đang định vị khuôn mặt, trích xuất vùng da má và phân tích bệnh lý bằng mạng nơ-ron.</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
                                                <UploadCloud className="w-8 h-8 text-emerald-500" />
                                            </div>
                                            <h4 className="text-md font-semibold text-slate-700 mb-1">Chụp ảnh khuôn mặt hoặc tải ảnh có sẵn</h4>
                                            <p className="text-xs text-slate-400 mb-6">Chụp rõ khuôn mặt trực diện để AI phân tích tốt nhất vùng má</p>
                                            <button className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-sky-500 text-white font-bold text-xs rounded-xl shadow-md border-none cursor-pointer">
                                                Chọn ảnh ngay
                                            </button>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col h-full gap-4">
                                    {/* Tabs */}
                                    {aiResults?.cropped && (
                                        <div className="flex bg-slate-200/60 p-1 rounded-xl gap-1 text-xs self-start font-medium shrink-0">
                                            <button 
                                                onClick={() => setActiveTab('original')}
                                                className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'original' ? 'bg-white text-slate-800 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'}`}
                                            >
                                                Ảnh gốc
                                            </button>
                                            <button 
                                                onClick={() => setActiveTab('annotated')}
                                                className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'annotated' ? 'bg-white text-emerald-600 shadow-sm font-bold' : 'text-slate-600 hover:text-emerald-700'}`}
                                            >
                                                AI Nhận diện mặt
                                            </button>
                                            <button 
                                                onClick={() => setActiveTab('cropped')}
                                                className={`px-3 py-1.5 rounded-lg transition-all ${activeTab === 'cropped' ? 'bg-white text-emerald-600 shadow-sm font-bold' : 'text-slate-600 hover:text-emerald-700'}`}
                                            >
                                                Vùng má phân tích (Crop)
                                            </button>
                                        </div>
                                    )}

                                    {/* Image Display */}
                                    <div className="flex-1 relative bg-black rounded-xl overflow-hidden flex items-center justify-center min-h-[220px]">
                                        {activeTab === 'original' && (
                                            <img src={image} alt="Original Patient Skin" className="w-full h-full object-contain" />
                                        )}
                                        {activeTab === 'annotated' && aiResults?.annotated_url && (
                                            <img src={aiResults.annotated_url} alt="Face Detection AI" className="w-full h-full object-contain" />
                                        )}
                                        {activeTab === 'cropped' && aiResults?.cropped_url && (
                                            <img src={aiResults.cropped_url} alt="Skin Patch Crop AI" className="w-full h-full object-contain" />
                                        )}
                                        
                                        <button 
                                            onClick={handleReset}
                                            className="absolute top-2 right-2 w-8 h-8 bg-black/60 hover:bg-red-500 text-white rounded-full flex items-center justify-center transition-colors shadow-md border border-white/20"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Side: Analysis Results & Disclaimer */}
                        <div className="w-full md:w-[350px] flex flex-col gap-5">
                            
                            {aiResults ? (
                                <div className="flex-1 flex flex-col gap-4">
                                    <div>
                                        <span className="text-xs text-slate-500">Kết quả phân tích da của bạn:</span>
                                        <div className={`mt-1.5 flex items-center justify-between p-4 rounded-xl border ${currentClassInfo.bg} font-bold text-md`}>
                                            <span>{currentClassInfo.name}</span>
                                            <span className="px-2.5 py-1 bg-white/90 rounded-lg text-xs font-extrabold shadow-sm">
                                                {(aiResults.confidence * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>

                                    {/* Confidence bar */}
                                    <div>
                                        <div className="flex justify-between text-xs font-medium text-slate-500 mb-1">
                                            <span>Độ tin cậy của AI:</span>
                                            <span>{(aiResults.confidence * 100).toFixed(0)}%</span>
                                        </div>
                                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full bg-gradient-to-r ${currentClassInfo.color}`} 
                                                style={{ width: `${aiResults.confidence * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    {/* AI Spa Recommendation */}
                                    <div className="bg-emerald-50/40 border border-emerald-100 p-4 rounded-2xl">
                                        <h4 className="text-xs font-bold text-emerald-800 flex items-center gap-1.5 mb-1.5">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                            Liệu trình đề xuất cho bạn:
                                        </h4>
                                        <p className="text-xs text-slate-600 leading-relaxed italic">
                                            "{aiResults.recommendation}"
                                        </p>
                                    </div>

                                    {/* Action button */}
                                    <button 
                                        onClick={() => {
                                            onClose();
                                            if (onBookAppointment) onBookAppointment();
                                        }}
                                        className="w-full py-3 bg-gradient-to-r from-teal-500 to-sky-500 hover:from-teal-600 hover:to-sky-600 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 border-none cursor-pointer"
                                    >
                                        <Calendar className="w-4 h-4" />
                                        Đặt lịch khám với Bác sĩ ngay
                                    </button>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col justify-center text-center p-6 border border-slate-100 bg-slate-50/30 rounded-2xl">
                                    <Sparkles className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
                                    <h4 className="text-sm font-semibold text-slate-700">Công nghệ AI tiên tiến</h4>
                                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                        Mạng nơ-ron tích chập (CNN) được huấn luyện trên hàng ngàn ca bệnh lâm sàng giúp nhận biết 6 tình trạng da mặt phổ biến một cách nhanh chóng.
                                    </p>
                                </div>
                            )}

                            {/* Medical Disclaimer - Mandatory for medical AI apps */}
                            <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-2xl flex gap-3 shrink-0">
                                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                    <span className="text-xs font-bold text-amber-800 block mb-0.5">Khuyến cáo y khoa:</span>
                                    <p className="text-[10px] text-slate-500 leading-normal">
                                        Kết quả chẩn đoán tự động của AI chỉ mang tính chất tham khảo sơ bộ và hỗ trợ tư vấn liệu trình. Kết quả này không thay thế cho kết luận chuyên khoa và phác đồ điều trị chính thức của Bác sĩ da liễu.
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
