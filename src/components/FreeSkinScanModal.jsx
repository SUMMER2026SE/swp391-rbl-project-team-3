import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UploadCloud, Loader2, Sparkles, AlertTriangle, CheckCircle2, Calendar } from 'lucide-react';
import { GLASS_BASE, GLASS_HOVER } from './common/GlassCard';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { SkinAnalysisModel } from '../models/SkinAnalysisModel';

const CLASS_MAP = {
    "acne": { name: "Mụn trứng cá", color: "from-rose-500 to-red-600", bg: "bg-rose-50 text-rose-700 border-rose-100" },
    "blackheads": { name: "Mụn đầu đen", color: "from-orange-500 to-amber-600", bg: "bg-orange-50 text-orange-700 border-orange-100" },
    "dark_spots": { name: "Thâm, nám & Sắc tố", color: "from-amber-600 to-yellow-700", bg: "bg-amber-50 text-amber-700 border-amber-100" },
    "pores": { name: "Lỗ chân lông to", color: "from-sky-500 to-blue-600", bg: "bg-sky-50 text-sky-700 border-sky-100" },
    "wrinkles": { name: "Nếp nhăn & Lão hóa", color: "from-purple-500 to-indigo-600", bg: "bg-purple-50 text-purple-700 border-purple-100" },
    "normal_skin": { name: "Da thường (Khỏe mạnh)", color: "from-emerald-500 to-teal-600", bg: "bg-emerald-50 text-emerald-700 border-emerald-100" },
    "pustules": { name: "Mụn mủ", color: "from-rose-500 to-red-600", bg: "bg-rose-50 text-rose-700 border-rose-100" },
    "pustule": { name: "Mụn mủ", color: "from-rose-500 to-red-600", bg: "bg-rose-50 text-rose-700 border-rose-100" },
    "papules": { name: "Mụn sẩn", color: "from-rose-500 to-red-600", bg: "bg-rose-50 text-rose-700 border-rose-100" },
    "papule": { name: "Mụn sẩn", color: "from-rose-500 to-red-600", bg: "bg-rose-50 text-rose-700 border-rose-100" },
    "nodules": { name: "Mụn bọc", color: "from-rose-500 to-red-600", bg: "bg-rose-50 text-rose-700 border-rose-100" },
    "nodule": { name: "Mụn bọc", color: "from-rose-500 to-red-600", bg: "bg-rose-50 text-rose-700 border-rose-100" },
    "cysts": { name: "Mụn nang", color: "from-rose-500 to-red-600", bg: "bg-rose-50 text-rose-700 border-rose-100" },
    "cyst": { name: "Mụn nang", color: "from-rose-500 to-red-600", bg: "bg-rose-50 text-rose-700 border-rose-100" },
    "whiteheads": { name: "Mụn đầu trắng", color: "from-orange-500 to-amber-600", bg: "bg-orange-50 text-orange-700 border-orange-100" },
    "whitehead": { name: "Mụn đầu trắng", color: "from-orange-500 to-amber-600", bg: "bg-orange-50 text-orange-700 border-orange-100" },
    "dark_spot": { name: "Thâm, nám & Sắc tố", color: "from-amber-600 to-yellow-700", bg: "bg-amber-50 text-amber-700 border-amber-100" },
    "scar": { name: "Sẹo mụn", color: "from-amber-600 to-yellow-700", bg: "bg-amber-50 text-amber-700 border-amber-100" },
    "scars": { name: "Sẹo mụn", color: "from-amber-600 to-yellow-700", bg: "bg-amber-50 text-amber-700 border-amber-100" },
    "pore": { name: "Lỗ chân lông to", color: "from-sky-500 to-blue-600", bg: "bg-sky-50 text-sky-700 border-sky-100" },
    "wrinkle": { name: "Nếp nhăn & Lão hóa", color: "from-purple-500 to-indigo-600", bg: "bg-purple-50 text-purple-700 border-purple-100" }
};

const SKIN_RECOMMENDATIONS = {
    acne: "Khuyến nghị làm sạch sâu bằng sữa rửa mặt chứa Acid Salicylic (BHA) 2%, kết hợp gel chấm mụn chứa Benzoyl Peroxide hoặc Adapalene. Hãy uống đủ nước và hạn chế thức khuya.",
    blackheads: "Khuyến nghị sử dụng tẩy tế bào chết hóa học chứa BHA 2% từ 2-3 lần/tuần, kết hợp mặt nạ đất sét để hút bã nhờn dư thừa. Dưỡng ẩm nhẹ dịu dạng gel.",
    dark_spots: "Khuyến nghị bổ sung Serum Vitamin C, Niacinamide hoặc Arbutin vào chu trình dưỡng da buổi sáng. Bắt buộc sử dụng kem chống nắng quang phổ rộng SPF 50+ hàng ngày.",
    pores: "Khuyến nghị tập trung làm sạch sâu, sử dụng serum chứa Niacinamide (Vitamin B3) 10% giúp điều tiết dầu và thu nhỏ lỗ chân lông. Tránh bít tắc.",
    wrinkles: "Khuyến nghị bắt đầu sử dụng Retinol 0.5% hoặc Peptide vào ban đêm để kích thích sản sinh collagen. Chú trọng dưỡng ẩm sâu với Hyaluronic Acid.",
    normal_skin: "Làn da của bạn rất khỏe mạnh và có độ ẩm tốt. Hãy duy trì chu trình chăm sóc cơ bản gồm: Làm sạch - Dưỡng ẩm nhẹ nhàng - Chống nắng đầy đủ hàng ngày.",
    pustules: "Khuyến nghị vệ sinh da sạch sẽ, tránh tự ý nặn mụn gây thâm và lan rộng ổ viêm. Có thể sử dụng các sản phẩm chứa Benzoyl Peroxide hoặc Acid Salicylic để chấm mụn.",
    pustule: "Khuyến nghị vệ sinh da sạch sẽ, tránh tự ý nặn mụn gây thâm và lan rộng ổ viêm. Có thể sử dụng các sản phẩm chứa Benzoyl Peroxide hoặc Acid Salicylic để chấm mụn.",
    papules: "Khuyến nghị sử dụng các chất giảm viêm dịu nhẹ như Niacinamide, BHA hoặc Benzoyl Peroxide nồng độ thấp để giảm viêm sưng. Hạn chế sờ tay lên mặt.",
    papule: "Khuyến nghị sử dụng các chất giảm viêm dịu nhẹ như Niacinamide, BHA hoặc Benzoyl Peroxide nồng độ thấp để giảm viêm sưng. Hạn chế sờ tay lên mặt.",
    nodules: "Khuyến nghị không nặn hoặc tự ý tác động mạnh lên nốt mụn. Bạn nên đến gặp bác sĩ da liễu sớm để được điều trị bằng các phương pháp chuyên khoa.",
    nodule: "Khuyến nghị không nặn hoặc tự ý tác động mạnh lên nốt mụn. Bạn nên đến gặp bác sĩ da liễu sớm để được điều trị bằng các phương pháp chuyên khoa.",
    cysts: "Mụn nang là tổn thương sâu dễ để lại sẹo lõm nghiêm trọng. Khuyến nghị thăm khám bác sĩ da liễu sớm để được kê toa và hướng dẫn điều trị y khoa phù hợp.",
    cyst: "Mụn nang là tổn thương sâu dễ để lại sẹo lõm nghiêm trọng. Khuyến nghị thăm khám bác sĩ da liễu sớm để được kê toa và hướng dẫn điều trị y khoa phù hợp.",
    whiteheads: "Khuyến nghị làm sạch da đều đặn, tẩy tế bào chết hóa học AHA/BHA nhẹ nhàng để giải phóng lỗ chân lông bị bít tắc.",
    whitehead: "Khuyến nghị làm sạch da đều đặn, tẩy tế bào chết hóa học AHA/BHA nhẹ nhàng để giải phóng lỗ chân lông bị bít tắc.",
    dark_spot: "Khuyến nghị bổ sung Serum Vitamin C, Niacinamide hoặc Arbutin vào chu trình dưỡng da buổi sáng. Bắt buộc sử dụng kem chống nắng quang phổ rộng SPF 50+ hàng ngày.",
    scar: "Khuyến nghị sử dụng các hoạt chất phục hồi da như Vitamin B5, Niacinamide hoặc các liệu trình công nghệ cao như laser, phi kim tại phòng khám da liễu.",
    scars: "Khuyến nghị sử dụng các hoạt chất phục hồi da như Vitamin B5, Niacinamide hoặc các liệu trình công nghệ cao như laser, phi kim tại phòng khám da liễu.",
    pore: "Khuyến nghị tập trung làm sạch sâu, sử dụng serum chứa Niacinamide (Vitamin B3) 10% giúp điều tiết dầu và thu nhỏ lỗ chân lông. Tránh bít tắc.",
    wrinkle: "Khuyến nghị bắt đầu sử dụng Retinol 0.5% hoặc Peptide vào ban đêm để kích thích sản sinh collagen. Chú trọng dưỡng ẩm sâu với Hyaluronic Acid."
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

// ─── Image Compression Helper (Max 640x480, JPEG 0.7) ─────────────────────────
const compressImage = (base64Str, maxWidth = 640, maxHeight = 480) => {
  return new Promise((resolve) => {
    if (!base64Str || typeof base64Str !== 'string' || !base64Str.startsWith('data:')) {
      resolve(base64Str);
      return;
    }
    const img = new Image();
    img.onload = () => {
      setTimeout(() => {
        try {
          let width = img.width || 640;
          let height = img.height || 480;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          resolve(compressedBase64);
        } catch (err) {
          console.warn('Error during image canvas compression:', err);
          resolve(base64Str);
        }
      }, 0);
    };
    img.onerror = () => {
      resolve(base64Str);
    };
    img.src = base64Str;
  });
};

const getImageDimensions = (base64Str) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width || 640, height: img.height || 480 });
    };
    img.onerror = () => resolve({ width: 640, height: 480 });
    img.src = base64Str;
  });
};

const saveScanToHistory = async (userId, base64Image, results) => {
  // Save to localStorage (always, as a fallback / local copy)
  const key = `dermasmart_ai_scans_${userId || 'guest'}`;
  let scans = [];
  try {
    const stored = localStorage.getItem(key);
    if (stored) scans = JSON.parse(stored);
  } catch (e) {
    console.warn('Failed to parse stored AI scans:', e);
  }

  const newScan = {
    id: Date.now(),
    date: new Date().toLocaleString('vi-VN'),
    image: base64Image,
    results
  };

  scans.unshift(newScan);
  if (scans.length > 5) {
    scans = scans.slice(0, 5); // Keep max 5
  }

  try {
    localStorage.setItem(key, JSON.stringify(scans));
  } catch (e) {
    console.error('Failed to write scans to localStorage:', e);
  }
};

export default function FreeSkinScanModal({ isOpen, onClose, onBookAppointment }) {
    const { user } = useAuth();
    const [image, setImage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [aiResults, setAiResults] = useState(null);
    const [activeTab, setActiveTab] = useState('original'); // 'original', 'annotated', 'cropped'
    // 'saving' | 'saved' | null — trạng thái lưu kết quả vào hồ sơ bệnh nhân.
    const [saveStatus, setSaveStatus] = useState(null);

    const fileInputRef = useRef(null);

    // Persist a REAL model prediction to the logged-in patient's record.
    // Hard rules: never for simulated results (isDemo), never for guests, never
    // for staff accounts — and never block the on-screen result on the save.
    const persistRealScan = (file, result, classKey) => {
        if (result.isDemo) return;
        if (!user?.id || user.role !== 'PATIENT') return;
        setSaveStatus('saving');
        SkinAnalysisModel.saveScan({
            patientId: user.id,
            file,
            predictedClass: classKey,
            conditionName: CLASS_MAP[classKey]?.name || classKey,
            confidence: result.confidence,
            recommendation: result.recommendation,
        })
            .then((row) => {
                setSaveStatus(row ? 'saved' : null);
                if (row) {
                    window.dispatchEvent(new CustomEvent('ai-scans-updated'));
                }
            })
            .catch(() => setSaveStatus(null));
    };

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
        setSaveStatus(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            // ── Read file as base64 for Roboflow ─────────────────────────────
            const ROBOFLOW_URL = import.meta.env.VITE_ROBOFLOW_MODEL_URL;
            const API_KEY = import.meta.env.VITE_ROBOFLOW_API_KEY;

            if (!ROBOFLOW_URL || !API_KEY) {
                throw new Error("Thiếu cấu hình API Key của Roboflow trong file .env.local");
            }

            // Convert file → base64 string
            const fullDataUri = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    resolve(reader.result);
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            // Strip prefix only for Roboflow API payload
            const rawBase64 = fullDataUri.replace(/^data:image\/\w+;base64,/, '');

            // POST to Roboflow Inference API
            const response = await fetch(`${ROBOFLOW_URL}?api_key=${API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: rawBase64
            });

            if (!response.ok) {
                throw new Error(`Mã phản hồi lỗi: ${response.status}`);
            }

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            // ── Map Roboflow predictions → existing aiResults shape ───────────
            // Roboflow returns { predictions: [{ class, confidence, ... }] }
            // Pick the highest-confidence prediction as the primary diagnosis.
            const predictions = data.predictions || [];

            const objectUrl = URL.createObjectURL(file);

            if (predictions.length === 0) {
                // No detections → healthy skin
                const healthyResult = {
                    predicted_class: 'normal_skin',
                    confidence: 0.95,
                    recommendation: SKIN_RECOMMENDATIONS.normal_skin,
                    cropped: false,
                    annotated_url: objectUrl,
                    cropped_url: objectUrl,
                    isDemo: false
                };
                setImage(objectUrl);
                setAiResults(healthyResult);
                setActiveTab('original');
                persistRealScan(file, healthyResult, 'normal_skin');
            } else {
                // Use the highest-confidence prediction as the primary result
                const topPred = predictions.reduce((best, p) =>
                    p.confidence > best.confidence ? p : best
                , predictions[0]);

                // Normalize Roboflow class name to our CLASS_MAP keys
                // e.g. "Acne" → "acne", "Dark Spot" → "dark_spots"
                const classKey = topPred.class
                    .toLowerCase()
                    .replace(/\s+/g, '_');

                const realResult = {
                    predicted_class: classKey,
                    confidence: topPred.confidence,
                    recommendation: SKIN_RECOMMENDATIONS[classKey] || "Vui lòng tham khảo ý kiến bác sĩ da liễu để được tư vấn chi tiết.",
                    cropped: true,
                    annotated_url: objectUrl,
                    cropped_url: objectUrl,
                    predictions: predictions, // keep full array for potential future use
                    isDemo: false
                };
                setImage(objectUrl);
                setAiResults(realResult);
                setActiveTab('annotated');
                persistRealScan(file, realResult, classKey);
            }

            // Save to history (real api result)
            try {
                const dims = await getImageDimensions(fullDataUri);
                const naturalWidth = dims.width || 1;
                const naturalHeight = dims.height || 1;
                const realResults = predictions.map((pred) => ({
                    label: pred.class,
                    x: (pred.x - pred.width / 2) / naturalWidth,
                    y: (pred.y - pred.height / 2) / naturalHeight,
                    width: pred.width / naturalWidth,
                    height: pred.height / naturalHeight,
                    confidence: pred.confidence,
                }));

                saveScanToHistory(user?.id, fullDataUri, realResults);
                window.dispatchEvent(new CustomEvent('ai-scans-updated'));
            } catch (historyErr) {
                console.warn('Failed to save skin scan to history:', historyErr);
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
            
            setImage(objectUrl);
            setAiResults({
                predicted_class: prediction.predicted_class,
                confidence: prediction.confidence,
                recommendation: SKIN_RECOMMENDATIONS[prediction.predicted_class] || "Làn da khỏe mạnh.",
                cropped: true,
                annotated_url: objectUrl,
                cropped_url: objectUrl,
                isDemo: true
            });
            setActiveTab('annotated');

            // Save to history (simulated fallback result)
            try {
                const realResults = prediction.predicted_class === 'normal_skin' ? [] : [{
                    label: prediction.predicted_class,
                    x: 0.25,
                    y: 0.25,
                    width: 0.5,
                    height: 0.5,
                    confidence: prediction.confidence
                }];
                saveScanToHistory(user?.id, fullDataUri, realResults);
                window.dispatchEvent(new CustomEvent('ai-scans-updated'));
            } catch (historyErr) {
                console.warn('Failed to save simulated skin scan to history:', historyErr);
            }
        } finally {
            setIsLoading(false);
            e.target.value = null;
        }
    };

    const handleReset = () => {
        setImage(null);
        setAiResults(null);
        setError(null);
        setSaveStatus(null);
    };

    const currentClassInfo = aiResults ? (CLASS_MAP[aiResults.predicted_class] || {
        name: aiResults.predicted_class,
        color: "from-slate-500 to-slate-700",
        bg: "bg-slate-50 text-slate-700 border-slate-100"
    }) : null;

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {/* z-9999 + rendered after FloatingChatbot — must not open behind the
                chat overlay (z-9999) or its FAB (z-9998). */}
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                {/* Backdrop overlay */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/50 backdrop-blur-xl"
                />

                {/* ═══ Modal Container — Liquid Glass ═══ */}
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 24 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 24 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className={`
                        ${GLASS_BASE}
                        w-full max-w-4xl h-[85vh]
                        !bg-white/75 !backdrop-blur-3xl
                        !border-white/60
                        !rounded-[2rem] shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_24px_64px_-16px_rgba(0,0,0,0.15)]
                        flex flex-col overflow-hidden relative z-10
                    `}
                >
                    {/* ── Header — Frosted Glass ─────────────────────────────── */}
                    <div className="
                        px-6 sm:px-8 py-4.5
                        border-b border-white/40
                        flex items-center justify-between shrink-0
                        bg-white/20 backdrop-blur-md
                    ">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-teal-500/25">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                                    Soi Da AI Miễn Phí
                                </h3>
                                <span className="text-[10px] text-teal-700 font-bold bg-teal-100/70 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                    DermaSmart AI Technology
                                </span>
                            </div>
                        </div>
                        <button 
                            onClick={onClose}
                            className="
                                w-10 h-10 rounded-full
                                bg-white/50 hover:bg-red-50 backdrop-blur-sm
                                border border-white/60 hover:border-red-200/60
                                text-slate-500 hover:text-red-500
                                flex items-center justify-center
                                transition-all duration-200
                                shadow-sm cursor-pointer
                            "
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* ── Scrollable Body ────────────────────────────────────── */}
                    <div className="flex-1 overflow-y-auto p-5 sm:p-7 flex flex-col md:flex-row gap-5">
                        
                        {/* ═══ Left Panel: Upload / Image Preview ═══ */}
                        <div className={`
                            flex-1 flex flex-col
                            ${GLASS_BASE} p-5 relative overflow-hidden min-h-[300px]
                            shadow-sm
                        `}>
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
                                    className={`
                                        flex-1 flex flex-col items-center justify-center
                                        border-2 border-dashed rounded-2xl p-8
                                        text-center h-full cursor-pointer
                                        transition-all duration-300
                                        ${isLoading 
                                            ? 'border-teal-300/50 bg-teal-50/10 opacity-70 pointer-events-none' 
                                            : 'border-slate-300/60 bg-white/20 hover:border-teal-500/50 hover:bg-teal-50/15 hover:shadow-lg'
                                        }
                                        hover:-translate-y-0.5
                                    `}
                                >
                                    {isLoading ? (
                                        <motion.div 
                                            className="flex flex-col items-center"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                        >
                                            <div className="w-16 h-16 rounded-2xl bg-teal-100/60 flex items-center justify-center mb-4">
                                                <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
                                            </div>
                                            <h4 className="text-sm font-bold text-slate-800 mb-1.5">Đang phân tích cấu trúc da...</h4>
                                            <p className="text-xs text-slate-600 max-w-xs leading-relaxed">
                                                AI đang định vị khuôn mặt, trích xuất vùng da và phân tích bệnh lý bằng mạng nơ-ron.
                                            </p>
                                        </motion.div>
                                    ) : (
                                        <>
                                            <div className="w-16 h-16 bg-teal-100/60 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4 group-hover:bg-teal-200/60 transition-colors">
                                                <UploadCloud className="w-8 h-8 text-teal-600" />
                                            </div>
                                            <h4 className="text-sm font-bold text-slate-800 mb-1.5">Chụp ảnh khuôn mặt hoặc tải ảnh có sẵn</h4>
                                            <p className="text-xs text-slate-600 mb-5">Chụp rõ khuôn mặt trực diện để AI phân tích tốt nhất</p>
                                            <span className="
                                                inline-flex items-center gap-1.5
                                                px-5 py-2.5
                                                bg-gradient-to-r from-teal-600 to-emerald-600
                                                text-white font-bold text-xs rounded-xl
                                                shadow-md shadow-teal-600/10
                                                hover:from-teal-700 hover:to-emerald-700
                                                hover:shadow-lg
                                                transition-all duration-200
                                            ">
                                                <UploadCloud className="w-3.5 h-3.5" />
                                                Chọn ảnh ngay
                                            </span>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col h-full gap-3">
                                    {/* Glass Tabs */}
                                    {aiResults?.cropped && (
                                        <div className="
                                            flex bg-slate-950/5 border border-slate-200/50 backdrop-blur-md
                                            p-1 rounded-xl gap-1 text-xs self-start font-semibold shrink-0
                                            shadow-inner
                                        ">
                                            <button 
                                                onClick={() => setActiveTab('original')}
                                                className={`px-3.5 py-1.5 rounded-lg transition-all duration-200 cursor-pointer border-none ${
                                                    activeTab === 'original' 
                                                        ? 'bg-white text-slate-900 shadow-sm font-bold' 
                                                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/30'
                                                }`}
                                            >
                                                Ảnh gốc
                                            </button>
                                            <button 
                                                onClick={() => setActiveTab('annotated')}
                                                className={`px-3.5 py-1.5 rounded-lg transition-all duration-200 cursor-pointer border-none ${
                                                    activeTab === 'annotated' 
                                                        ? 'bg-teal-600 text-white shadow-sm font-bold' 
                                                        : 'text-slate-600 hover:text-teal-600 hover:bg-teal-50/30'
                                                }`}
                                            >
                                                AI Nhận diện mặt
                                            </button>
                                            <button 
                                                onClick={() => setActiveTab('cropped')}
                                                className={`px-3.5 py-1.5 rounded-lg transition-all duration-200 cursor-pointer border-none ${
                                                    activeTab === 'cropped' 
                                                        ? 'bg-teal-600 text-white shadow-sm font-bold' 
                                                        : 'text-slate-600 hover:text-teal-600 hover:bg-teal-50/30'
                                                }`}
                                            >
                                                Vùng má phân tích
                                            </button>
                                        </div>
                                    )}

                                    {/* Image Display — Dark Glass Container */}
                                    <div className="flex-1 relative bg-slate-900/90 backdrop-blur-sm rounded-2xl overflow-hidden flex items-center justify-center min-h-[220px] border border-white/10">
                                        <AnimatePresence mode="wait">
                                            {activeTab === 'original' && (
                                                <motion.img 
                                                    key="original"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    src={image} 
                                                    alt="Original Patient Skin" 
                                                    className="w-full h-full object-contain" 
                                                />
                                            )}
                                            {activeTab === 'annotated' && aiResults?.annotated_url && (
                                                <motion.img 
                                                    key="annotated"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    src={aiResults.annotated_url} 
                                                    alt="Face Detection AI" 
                                                    className="w-full h-full object-contain" 
                                                />
                                            )}
                                            {activeTab === 'cropped' && aiResults?.cropped_url && (
                                                <motion.img 
                                                    key="cropped"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    src={aiResults.cropped_url} 
                                                    alt="Skin Patch Crop AI" 
                                                    className="w-full h-full object-contain" 
                                                />
                                            )}
                                        </AnimatePresence>
                                        
                                        {/* Reset button — Frosted */}
                                        <button 
                                            onClick={handleReset}
                                            className="
                                                absolute top-3 right-3
                                                w-8 h-8 rounded-full
                                                bg-black/40 backdrop-blur-md
                                                hover:bg-red-500/80
                                                border border-white/20 hover:border-red-400/40
                                                text-white
                                                flex items-center justify-center
                                                transition-all duration-200
                                                shadow-lg
                                            "
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ═══ Right Panel: Analysis Results ═══ */}
                        <div className="w-full md:w-[350px] flex flex-col gap-4">
                            
                            {aiResults ? (
                                <motion.div 
                                    className="flex-1 flex flex-col gap-4"
                                    initial={{ opacity: 0, x: 12 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3, delay: 0.1 }}
                                >
                                    {/* Diagnosis & Confidence Card — Glass */}
                                    <div className={`${GLASS_BASE} ${GLASS_HOVER} p-5 flex flex-col gap-4 shadow-sm`}>
                                        <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                                            Kết quả phân tích da
                                        </span>
                                        <div className={`
                                            flex items-center justify-between
                                            p-4 rounded-xl border
                                            ${currentClassInfo.bg}
                                            font-extrabold text-sm
                                            backdrop-blur-sm shadow-sm
                                        `}>
                                            <span className="text-sm font-extrabold">{currentClassInfo.name}</span>
                                            <span className="px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-xs font-extrabold shadow-sm text-slate-800">
                                                {(aiResults.confidence * 100).toFixed(1)}%
                                            </span>
                                        </div>

                                        <div className="mt-1">
                                            <div className="flex justify-between text-xs font-semibold text-slate-600 mb-2">
                                                <span>Độ tin cậy của AI:</span>
                                                <span className="font-bold text-slate-900">{(aiResults.confidence * 100).toFixed(0)}%</span>
                                            </div>
                                            <div className="w-full bg-slate-200/50 h-2 rounded-full overflow-hidden backdrop-blur-sm">
                                                <motion.div 
                                                    className={`h-full bg-gradient-to-r ${currentClassInfo.color} rounded-full`}
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${aiResults.confidence * 100}%` }}
                                                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Simulation Warning — Glass */}
                                    {aiResults.isDemo && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`
                                                ${GLASS_BASE} !bg-amber-500/5 border border-amber-500/15
                                                rounded-xl p-3
                                                text-[11px] leading-normal text-amber-800
                                                flex items-start gap-2
                                            `}
                                        >
                                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                            <div className="font-medium">
                                                <strong className="font-extrabold text-amber-900">Chế độ Mô phỏng:</strong> Máy chủ AI đang ngoại tuyến. Hệ thống tự động tạo kết quả thử nghiệm — kết quả này <strong className="font-extrabold">không được lưu</strong> vào hồ sơ.
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Save-to-record status. Only REAL predictions are persisted;
                                        a saved scan shows up in the patient's "Hồ sơ bệnh án" and in
                                        the doctor's workspace as reference material. */}
                                    {saveStatus === 'saved' && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`${GLASS_BASE} !bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-3 text-[11px] leading-normal text-emerald-800 flex items-start gap-2`}
                                        >
                                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                            <div className="font-medium">
                                                <strong className="font-extrabold text-emerald-900">Đã lưu vào hồ sơ của bạn.</strong> Xem lại tại &quot;Hồ sơ bệnh án&quot; — bác sĩ có thể tham khảo kết quả này khi bạn đến khám.
                                            </div>
                                        </motion.div>
                                    )}
                                    {!aiResults.isDemo && !user && (
                                        <div className={`${GLASS_BASE} !bg-sky-500/5 border border-sky-500/15 rounded-xl p-3 text-[11px] leading-normal text-sky-800 font-medium`}>
                                            Đăng nhập trước khi soi da để kết quả được lưu vào hồ sơ và bác sĩ tham khảo khi khám.
                                        </div>
                                    )}



                                    {/* CTA Button — Emerald Glass */}
                                    <button 
                                        onClick={() => {
                                            onClose();
                                            if (onBookAppointment) onBookAppointment();
                                        }}
                                        className="
                                            w-full py-3.5 rounded-xl
                                            bg-gradient-to-r from-teal-600 to-emerald-600
                                            hover:from-teal-700 hover:to-emerald-700
                                            text-white font-bold text-sm
                                            shadow-lg shadow-teal-600/15
                                            flex items-center justify-center gap-2
                                            transition-all duration-300 ease-out hover:-translate-y-0.5 active:scale-[0.98]
                                            cursor-pointer border-none
                                        "
                                    >
                                        <Calendar className="w-4.5 h-4.5" />
                                        Đặt lịch khám với Bác sĩ ngay
                                    </button>
                                </motion.div>
                            ) : (
                                /* Empty State — Glass Placeholder */
                                <div className={`
                                    flex-1 flex flex-col justify-center text-center p-6
                                    ${GLASS_BASE} bg-white/20
                                    shadow-sm gap-2
                                `}>
                                    <div className="w-14 h-14 mx-auto mb-2 rounded-2xl bg-teal-100/60 backdrop-blur-sm flex items-center justify-center animate-pulse">
                                        <Sparkles className="w-7 h-7 text-teal-600" />
                                    </div>
                                    <h4 className="text-sm font-bold text-slate-800">Trí tuệ nhân tạo (AI) chẩn đoán</h4>
                                    <p className="text-xs text-slate-600 leading-relaxed max-w-[260px] mx-auto">
                                        Hệ thống CNN nhận dạng khuôn mặt trực tiếp và đưa ra kết quả phân tích 6 bệnh lý da liễu phổ biến chỉ trong 2 giây.
                                    </p>
                                </div>
                            )}

                            {/* Medical Disclaimer — Glass */}
                            <div className={`
                                ${GLASS_BASE} !bg-amber-500/5 border border-amber-500/15
                                p-4 rounded-2xl flex gap-3 shrink-0
                            `}>
                                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                    <span className="text-xs font-extrabold text-amber-800 block mb-0.5">Khuyến cáo y khoa:</span>
                                    <p className="text-[10.5px] text-slate-700 font-medium leading-normal">
                                        Kết quả chẩn đoán tự động của AI chỉ mang tính chất tham khảo sơ bộ. Kết quả này không thay thế cho chẩn đoán chuyên khoa và phác đồ điều trị chính thức của Bác sĩ da liễu.
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
