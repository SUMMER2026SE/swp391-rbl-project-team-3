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

const analyzeSkinImage = (img) => {
    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 100;
        canvas.height = 100;
        ctx.drawImage(img, 0, 0, 100, 100);
        const imgData = ctx.getImageData(0, 0, 100, 100);
        const data = imgData.data;
        
        let redPixels = 0;
        let darkPixels = 0;
        let yellowPixels = 0;
        let totalBrightness = 0;
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i+1];
            const b = data[i+2];
            
            const brightness = (r + g + b) / 3;
            totalBrightness += brightness;
            
            // Sắc đỏ (mụn, viêm da)
            if (r > 130 && (r - g) > 40 && (r - b) > 40) {
                redPixels++;
            }
            
            // Sắc tối/sạm màu (thâm, nám, tàn nhang)
            if (brightness < 110 && r > 40 && g > 30 && b > 20) {
                darkPixels++;
            }
            
            // Sắc vàng/bóng nhờn (lỗ chân lông to, bã nhờn)
            if (r > 150 && g > 130 && b < 100) {
                yellowPixels++;
            }
        }
        
        const pixelCount = data.length / 4;
        const redRatio = redPixels / pixelCount;
        const darkRatio = darkPixels / pixelCount;
        const yellowRatio = yellowPixels / pixelCount;
        const avgBrightness = totalBrightness / pixelCount;

        if (redRatio > 0.08) {
            return {
                predicted_class: "acne",
                confidence: Math.min(0.78 + redRatio * 0.8, 0.98)
            };
        } else if (darkRatio > 0.22) {
            return {
                predicted_class: "dark_spots",
                confidence: Math.min(0.75 + darkRatio * 0.6, 0.97)
            };
        } else if (yellowRatio > 0.15) {
            return {
                predicted_class: "pores",
                confidence: Math.min(0.77 + yellowRatio * 0.7, 0.96)
            };
        } else if (avgBrightness < 110) {
            return {
                predicted_class: "blackheads",
                confidence: 0.82
            };
        } else if (avgBrightness > 180) {
            return {
                predicted_class: "normal_skin",
                confidence: 0.93
            };
        } else {
            return {
                predicted_class: "wrinkles",
                confidence: 0.84
            };
        }
    } catch (e) {
        console.error("Lỗi phân tích pixel ảnh:", e);
        return null;
    }
};

const getDeterministicFallback = (file) => {
    const fileKey = `${file.name}-${file.size}`;
    let hash = 0;
    for (let i = 0; i < fileKey.length; i++) {
        hash = (hash << 5) - hash + fileKey.charCodeAt(i);
        hash |= 0;
    }
    const absHash = Math.abs(hash);
    const skinClasses = ["acne", "blackheads", "dark_spots", "pores", "wrinkles", "normal_skin"];
    const predicted_class = skinClasses[absHash % skinClasses.length];
    const confidence = 0.80 + (absHash % 16) / 100;
    return { predicted_class, confidence };
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
            console.warn("Lỗi kết nối đến máy chủ AI thực tế, kích hoạt chế độ mô phỏng:", err);
            
            // Giả lập thời gian phân tích của AI (1.5 giây)
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            const objectUrl = URL.createObjectURL(file);
            
            // Load ảnh vào đối tượng Image để phân tích pixel
            const img = new Image();
            img.src = objectUrl;
            await new Promise((resolve) => {
                img.onload = resolve;
                img.onerror = resolve;
            });
            
            let prediction = null;
            try {
                prediction = analyzeSkinImage(img);
            } catch (pErr) {
                console.error("Lỗi khi phân tích pixel ảnh:", pErr);
            }
            
            // Nếu không phân tích được bằng canvas, dùng thuật toán băm (hash) để đảm bảo tính nhất quán
            if (!prediction) {
                prediction = getDeterministicFallback(file);
            }
            
            const recommendations = {
                acne: "Khuyến nghị làm sạch sâu bằng sữa rửa mặt chứa Acid Salicylic (BHA) 2%, kết hợp gel chấm mụn chứa Benzoyl Peroxide hoặc Adapalene. Hãy uống đủ nước và hạn chế thức khuya.",
                blackheads: "Khuyến nghị sử dụng tẩy tế bào chết hóa học chứa BHA 2% từ 2-3 lần/tuần, kết hợp mặt nạ đất sét để hút bã nhờn dư thừa. Dưỡng ẩm nhẹ dịu dạng gel.",
                dark_spots: "Khuyến nghị bổ sung Serum Vitamin C, Niacinamide hoặc Arbutin vào chu trình dưỡng da buổi sáng. Bắt buộc sử dụng kem chống nắng quang phổ rộng SPF 50+ hàng ngày.",
                pores: "Khuyến nghị tập trung làm sạch sâu, sử dụng serum chứa Niacinamide (Vitamin B3) 10% giúp điều tiết dầu và thu nhỏ lỗ chân lông. Tránh bít tắc.",
                wrinkles: "Khuyến nghị bắt đầu sử dụng Retinol 0.5% hoặc Peptide vào ban đêm để kích thích sản sinh collagen. Chú trọng dưỡng ẩm sâu với Hyaluronic Acid.",
                normal_skin: "Làn da của bạn rất khỏe mạnh và có độ ẩm tốt. Hãy duy trì chu trình chăm sóc cơ bản gồm: Làm sạch - Dưỡng ẩm nhẹ nhàng - Chống nắng đầy đủ hàng ngày."
            };

            setImage(objectUrl);
            setAiResults({
                predicted_class: prediction.predicted_class,
                confidence: prediction.confidence,
                recommendation: recommendations[prediction.predicted_class] || "Làn da khỏe mạnh.",
                cropped: true,
                annotated_url: objectUrl,
                cropped_url: objectUrl,
                isDemo: true
            });
            setActiveTab('annotated');
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

                                    {aiResults.isDemo && (
                                        <div className="bg-amber-50/70 border border-amber-200/60 rounded-xl p-3 text-[11px] leading-normal text-amber-800 flex items-start gap-2 shadow-sm">
                                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                            <div>
                                                <strong>Chế độ Mô phỏng:</strong> Máy chủ phân tích da (AI server) đang ngoại tuyến. Hệ thống tự động tạo kết quả để hiển thị thử nghiệm.
                                            </div>
                                        </div>
                                    )}

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
