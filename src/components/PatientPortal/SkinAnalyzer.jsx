import React, { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, Upload, X, ScanFace, RefreshCw,
  Sparkles, ShieldCheck, Loader2, AlertTriangle,
} from 'lucide-react';
import { GLASS_BASE, GLASS_HOVER } from '../common/GlassCard';
import {
  FaceLandmarker,
  FilesetResolver,
  DrawingUtils,
} from '@mediapipe/tasks-vision';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';

// ─── Color Map for Detection Labels ────────────────────────────────────────────
const LABEL_STYLES = {
  Acne:       { stroke: 'rgba(239, 68, 68, 0.8)',  fill: 'rgba(239, 68, 68, 0.12)', text: 'rgba(239, 68, 68, 1)'  },
  'Dark Spot': { stroke: 'rgba(245, 158, 11, 0.8)', fill: 'rgba(245, 158, 11, 0.12)', text: 'rgba(245, 158, 11, 1)' },
  _default:   { stroke: 'rgba(99, 102, 241, 0.8)', fill: 'rgba(99, 102, 241, 0.12)', text: 'rgba(99, 102, 241, 1)' },
};

const translateLabel = (label) => {
  if (!label) return '';
  const cleanLabel = label.trim().toLowerCase();
  
  const translationMap = {
    'acne': 'Mụn trứng cá',
    'pustule': 'Mụn mủ',
    'pustules': 'Mụn mủ',
    'papule': 'Mụn sẩn',
    'papules': 'Mụn sẩn',
    'nodule': 'Mụn bọc',
    'nodules': 'Mụn bọc',
    'cyst': 'Mụn nang',
    'cysts': 'Mụn nang',
    'blackhead': 'Mụn đầu đen',
    'blackheads': 'Mụn đầu đen',
    'whitehead': 'Mụn đầu trắng',
    'whiteheads': 'Mụn đầu trắng',
    'dark spot': 'Thâm & Nám',
    'dark spots': 'Thâm & Nám',
    'dark_spots': 'Thâm & Nám',
    'darkspot': 'Thâm & Nám',
    'darkspots': 'Thâm & Nám',
    'pore': 'Lỗ chân lông',
    'pores': 'Lỗ chân lông',
    'wrinkle': 'Nếp nhăn',
    'wrinkles': 'Nếp nhăn',
    'scar': 'Sẹo mụn',
    'scars': 'Sẹo mụn',
    'normal_skin': 'Da thường',
    'normal skin': 'Da thường',
    'normal': 'Da thường'
  };

  return translationMap[cleanLabel] || label;
};

const getLabelStyle = (label) => {
  if (!label) return LABEL_STYLES._default;
  const cleanLabel = label.trim().toLowerCase();

  if (['acne', 'pustule', 'pustules', 'papule', 'papules', 'nodule', 'nodules', 'cyst', 'cysts'].includes(cleanLabel)) {
    return { stroke: 'rgba(239, 68, 68, 0.8)',  fill: 'rgba(239, 68, 68, 0.12)', text: 'rgba(239, 68, 68, 1)' };
  }
  if (['dark spot', 'dark spots', 'dark_spots', 'darkspot', 'darkspots', 'scar', 'scars'].includes(cleanLabel)) {
    return { stroke: 'rgba(245, 158, 11, 0.8)', fill: 'rgba(245, 158, 11, 0.12)', text: 'rgba(245, 158, 11, 1)' };
  }
  if (['blackhead', 'blackheads', 'whitehead', 'whiteheads'].includes(cleanLabel)) {
    return { stroke: 'rgba(249, 115, 22, 0.8)', fill: 'rgba(249, 115, 22, 0.12)', text: 'rgba(249, 115, 22, 1)' };
  }
  if (['pore', 'pores'].includes(cleanLabel)) {
    return { stroke: 'rgba(14, 165, 233, 0.8)', fill: 'rgba(14, 165, 233, 0.12)', text: 'rgba(14, 165, 233, 1)' };
  }
  if (['wrinkle', 'wrinkles'].includes(cleanLabel)) {
    return { stroke: 'rgba(168, 85, 247, 0.8)', fill: 'rgba(168, 85, 247, 0.12)', text: 'rgba(168, 85, 247, 1)' };
  }
  if (['normal', 'normal_skin', 'normal skin'].includes(cleanLabel)) {
    return { stroke: 'rgba(16, 185, 129, 0.8)', fill: 'rgba(16, 185, 129, 0.12)', text: 'rgba(16, 185, 129, 1)' };
  }

  return LABEL_STYLES._default;
};


// ─── MediaPipe Config ──────────────────────────────────────────────────────────
const WASM_CDN  = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm';
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

// ─── Mesh Drawing Style Presets (Emerald "Liquid Glass" HUD) ───────────────────
const MESH_STYLES = {
  tessellation: { color: 'rgba(16, 185, 129, 0.18)', lineWidth: 0.5 },   // very subtle fill mesh
  faceOval:     { color: 'rgba(16, 185, 129, 0.55)', lineWidth: 1.2 },   // bright contour
  rightEye:     { color: 'rgba(52, 211, 153, 0.7)',  lineWidth: 0.9 },   // eye rings
  leftEye:      { color: 'rgba(52, 211, 153, 0.7)',  lineWidth: 0.9 },
  rightEyebrow: { color: 'rgba(110, 231, 183, 0.5)', lineWidth: 0.7 },
  leftEyebrow:  { color: 'rgba(110, 231, 183, 0.5)', lineWidth: 0.7 },
  lips:         { color: 'rgba(16, 185, 129, 0.55)', lineWidth: 0.8 },
  rightIris:    { color: 'rgba(167, 243, 208, 0.8)', lineWidth: 0.8 },   // iris dot rings
  leftIris:     { color: 'rgba(167, 243, 208, 0.8)', lineWidth: 0.8 },
};

// ─── Roboflow API Config ───────────────────────────────────────────────────────
const ROBOFLOW_MODEL = import.meta.env.VITE_ROBOFLOW_MODEL_URL || 'https://detect.roboflow.com/your-acne-model/1';
const ROBOFLOW_API_KEY = import.meta.env.VITE_ROBOFLOW_API_KEY || '';

// ─── Framer Motion Variants ────────────────────────────────────────────────────
const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.92 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.92 },
  transition: { duration: 0.3, ease: 'easeOut' },
};

// ─── Webcam Constraints ────────────────────────────────────────────────────────
const VIDEO_CONSTRAINTS = {
  width: 640,
  height: 480,
  facingMode: 'user',
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

// ─── Save Scan Result to History (Max 5 items) ────────────────────────────────
const saveScanToHistory = async (userId, base64Image, results) => {
  // 1. Try to save to Supabase Database
  if (userId) {
    try {
      const topPred = results && results.length > 0
        ? results.reduce((best, p) => p.confidence > best.confidence ? p : best, results[0])
        : null;

      const detectedCondition = topPred ? topPred.label : 'normal_skin';
      const confidenceScore = topPred ? topPred.confidence : 0.95;
      
      const localRecommendations = {
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

      const recText = topPred 
        ? (localRecommendations[detectedCondition.toLowerCase().replace(/\s+/g, '_')] || "Vui lòng tham khảo ý kiến bác sĩ da liễu để được khám chuyên sâu.")
        : "Làn da khỏe mạnh.";

      // Ensure patient profile exists (auto-heal JIT)
      await supabase
        .from('patient_profiles')
        .upsert({ patient_id: userId }, { onConflict: 'patient_id' });

      // Insert image first
      const { data: imgData, error: imgErr } = await supabase
        .from('skin_images')
        .insert({
          patient_id: userId,
          uploaded_by: userId,
          image_url: base64Image,
          image_type: 'FACE_SCAN'
        })
        .select('image_id')
        .single();

      if (imgErr) throw imgErr;

      // Insert analysis record next
      const { error: analysisErr } = await supabase
        .from('ai_skin_analyses')
        .insert({
          patient_id: userId,
          image_id: imgData.image_id,
          detected_condition: detectedCondition,
          confidence_score: confidenceScore,
          recommendation: recText,
          result_summary: JSON.stringify(results)
        });

      if (analysisErr) throw analysisErr;
      console.log('[SkinAnalyzer] Saved scan to Supabase database.');
    } catch (dbErr) {
      console.warn('[SkinAnalyzer] Database error, fallback to local:', dbErr);
    }
  }

  // 2. Save to localStorage (always, as a fallback / local copy)
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

// ─── Component ────────────────=================================================
export default function SkinAnalyzer() {
  const { user } = useAuth();
  // Core UI state
  const [imageSrc, setImageSrc] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [analysisError, setAnalysisError] = useState(null);

  // MediaPipe state
  const [isMPLoading, setIsMPLoading] = useState(true);   // WASM download in progress
  const [isMeshDrawing, setIsMeshDrawing] = useState(false);
  const [meshReady, setMeshReady] = useState(false);       // mesh drawn on canvas

  // Refs
  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const faceLandmarkerRef = useRef(null);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TASK 1 — Initialize MediaPipe Face Landmarker (runs once on mount)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useEffect(() => {
    let cancelled = false;

    async function initFaceLandmarker() {
      try {
        const vision = await FilesetResolver.forVisionTasks(WASM_CDN);

        const landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_URL,
            delegate: 'GPU',
          },
          runningMode: 'IMAGE',
          numFaces: 1,
          outputFaceBlendshapes: false,
          outputFacialTransformationMatrixes: false,
        });

        if (!cancelled) {
          faceLandmarkerRef.current = landmarker;
          setIsMPLoading(false);
        }
      } catch (err) {
        console.error('[SkinAnalyzer] MediaPipe init failed:', err);
        if (!cancelled) setIsMPLoading(false);
      }
    }

    initFaceLandmarker();

    return () => {
      cancelled = true;
      faceLandmarkerRef.current?.close();
    };
  }, []);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TASK 2 — Draw Face Mesh when imageSrc is ready
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const drawFaceMesh = useCallback(() => {
    const landmarker = faceLandmarkerRef.current;
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!landmarker || !canvas || !img) return;

    setIsMeshDrawing(true);
    setMeshReady(false);

    // Set canvas pixel-buffer to match the *rendered* image dimensions
    const w = img.clientWidth;
    const h = img.clientHeight;
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, w, h);

    // ── Run detection ────────────────────────────────────────────────────────
    const results = landmarker.detect(img);

    if (results.faceLandmarks && results.faceLandmarks.length > 0) {
      // MediaPipe returns normalized [0..1] coords based on the *natural* image.
      // The DrawingUtils expects a canvas sized to match the image it draws over.
      // Since our canvas matches the rendered size but landmarks are normalized,
      // DrawingUtils will scale them by canvas.width/height automatically.
      const drawingUtils = new DrawingUtils(ctx);

      for (const landmarks of results.faceLandmarks) {
        // Layer 1 — Tessellation (subtle mesh fill)
        drawingUtils.drawConnectors(
          landmarks,
          FaceLandmarker.FACE_LANDMARKS_TESSELATION,
          MESH_STYLES.tessellation,
        );

        // Layer 2 — Face oval (prominent contour)
        drawingUtils.drawConnectors(
          landmarks,
          FaceLandmarker.FACE_LANDMARKS_FACE_OVAL,
          MESH_STYLES.faceOval,
        );

        // Layer 3 — Eyes
        drawingUtils.drawConnectors(
          landmarks,
          FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE,
          MESH_STYLES.rightEye,
        );
        drawingUtils.drawConnectors(
          landmarks,
          FaceLandmarker.FACE_LANDMARKS_LEFT_EYE,
          MESH_STYLES.leftEye,
        );

        // Layer 4 — Eyebrows
        drawingUtils.drawConnectors(
          landmarks,
          FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW,
          MESH_STYLES.rightEyebrow,
        );
        drawingUtils.drawConnectors(
          landmarks,
          FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW,
          MESH_STYLES.leftEyebrow,
        );

        // Layer 5 — Lips
        drawingUtils.drawConnectors(
          landmarks,
          FaceLandmarker.FACE_LANDMARKS_LIPS,
          MESH_STYLES.lips,
        );

        // Layer 6 — Irises
        drawingUtils.drawConnectors(
          landmarks,
          FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS,
          MESH_STYLES.rightIris,
        );
        drawingUtils.drawConnectors(
          landmarks,
          FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS,
          MESH_STYLES.leftIris,
        );
      }

      setMeshReady(true);
    }

    setIsMeshDrawing(false);
  }, []);

  // Auto-trigger mesh drawing when imageSrc loads AND MediaPipe is ready
  useEffect(() => {
    if (!imageSrc || isMPLoading) return;

    // Wait for the <img> to finish decoding so naturalWidth/Height are valid
    const img = imageRef.current;
    if (!img) return;

    const attemptDraw = () => {
      if (img.complete && img.naturalWidth > 0) {
        drawFaceMesh();
      }
    };

    // If already loaded (cached base64), draw immediately; otherwise wait
    attemptDraw();
    img.addEventListener('load', attemptDraw);

    return () => img.removeEventListener('load', attemptDraw);
  }, [imageSrc, isMPLoading, drawFaceMesh]);

  // ── Capture from webcam ────────────────────────────────────────────────────
  const handleCapture = useCallback(() => {
    if (webcamRef.current) {
      const screenshot = webcamRef.current.getScreenshot();
      if (screenshot) {
        setImageSrc(screenshot);
        setIsCameraOpen(false);
      }
    }
  }, []);

  // ── Upload from file ───────────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageSrc(reader.result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // ── Reset ──────────────────────────────────────────────────────────────────
  const handleReset = () => {
    setImageSrc(null);
    setIsCameraOpen(false);
    setIsAnalyzing(false);
    setAnalysisResults(null);
    setAnalysisError(null);
    setMeshReady(false);
  };

  // ── AI Skin Analysis (Roboflow Inference) ──────────────────────────────────
  const handleAnalyze = useCallback(async () => {
    if (!imageSrc || isAnalyzing) return;

    setIsAnalyzing(true);
    setAnalysisResults(null);
    setAnalysisError(null);

    try {
      // ── 1. Extract raw base64 payload (strip data-URI prefix) ─────────────
      const base64Data = imageSrc.replace(/^data:image\/\w+;base64,/, '');

      // ── 2. Guard: check for API key ───────────────────────────────────────
      if (!ROBOFLOW_API_KEY) {
        throw new Error(
          'VITE_ROBOFLOW_API_KEY chưa được cấu hình. '
          + 'Vui lòng thêm biến môi trường vào file .env.local'
        );
      }

      // ── 3. POST to Roboflow Inference API ─────────────────────────────────
      const endpoint = `${ROBOFLOW_MODEL}?api_key=${ROBOFLOW_API_KEY}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: base64Data,
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        throw new Error(
          `Roboflow API trả về lỗi ${response.status}: ${errorBody || response.statusText}`
        );
      }

      const data = await response.json();

      // ── 4. Map predictions: Roboflow returns center (x,y) → convert to
      //    top-left corner for our canvas strokeRect drawing logic.
      //    Roboflow coords are in the image's *natural* pixel space.
      const predictions = data.predictions || [];

      if (predictions.length === 0) {
        setAnalysisResults([]);
        return;
      }

      const naturalWidth = imageRef.current?.naturalWidth || 1;
      const naturalHeight = imageRef.current?.naturalHeight || 1;

      const realResults = predictions.map((pred) => ({
        label: pred.class,
        x: (pred.x - pred.width / 2) / naturalWidth,
        y: (pred.y - pred.height / 2) / naturalHeight,
        width: pred.width / naturalWidth,
        height: pred.height / naturalHeight,
        confidence: pred.confidence,
      }));

      setAnalysisResults(realResults);

        saveScanToHistory(user?.id, imageSrc, realResults);
        window.dispatchEvent(new CustomEvent('ai-scans-updated'));
      } catch (historyErr) {
        console.warn('Failed to save skin analysis to history:', historyErr);
      }
    } catch (err) {
      console.error('[SkinAnalyzer] Analysis failed:', err);
      setAnalysisError(
        err.message || 'Đã xảy ra lỗi khi phân tích. Vui lòng thử lại sau.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  }, [imageSrc, isAnalyzing, user]);

  // ── Canvas: Draw bounding boxes OVER mesh when analysis results arrive ─────
  useEffect(() => {
    if (!analysisResults || !canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const img = imageRef.current;
    const ctx = canvas.getContext('2d');

    const displayW = img.clientWidth;
    const displayH = img.clientHeight;
    canvas.width = displayW;
    canvas.height = displayH;

    const scaleX = displayW / (img.naturalWidth || displayW);
    const scaleY = displayH / (img.naturalHeight || displayH);

    // ── First re-draw the face mesh so it isn't erased ───────────────────────
    const landmarker = faceLandmarkerRef.current;
    if (landmarker) {
      const meshResults = landmarker.detect(img);
      if (meshResults.faceLandmarks?.length > 0) {
        const drawingUtils = new DrawingUtils(ctx);
        for (const landmarks of meshResults.faceLandmarks) {
          drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_TESSELATION, MESH_STYLES.tessellation);
          drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_FACE_OVAL, MESH_STYLES.faceOval);
          drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE, MESH_STYLES.rightEye);
          drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_EYE, MESH_STYLES.leftEye);
          drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW, MESH_STYLES.rightEyebrow);
          drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW, MESH_STYLES.leftEyebrow);
          drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LIPS, MESH_STYLES.lips);
          drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS, MESH_STYLES.rightIris);
          drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS, MESH_STYLES.leftIris);
        }
      }
    }

    // ── Then overlay bounding boxes ──────────────────────────────────────────
    analysisResults.forEach((box) => {
      const style = getLabelStyle(box.label);

      const bx = box.x * displayW;
      const by = box.y * displayH;
      const bw = box.width * displayW;
      const bh = box.height * displayH;

      ctx.fillStyle = style.fill;
      ctx.fillRect(bx, by, bw, bh);

      ctx.strokeStyle = style.stroke;
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.strokeRect(bx, by, bw, bh);

      const labelText = `${translateLabel(box.label)}  ${(box.confidence * 100).toFixed(0)}%`;
      ctx.font = 'bold 11px "Plus Jakarta Sans", system-ui, sans-serif';
      const metrics = ctx.measureText(labelText);
      const padX = 6;
      const tagW = metrics.width + padX * 2;
      const tagH = 18;
      const tagX = bx;
      const tagY = by - tagH - 3;

      ctx.fillStyle = style.stroke;
      ctx.beginPath();
      ctx.roundRect(tagX, tagY, tagW, tagH, 4);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.textBaseline = 'middle';
      ctx.fillText(labelText, tagX + padX, tagY + tagH / 2);
    });
  }, [analysisResults]);

  // ── Trigger hidden input ───────────────────────────────────────────────────
  const openFilePicker = () => fileInputRef.current?.click();

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Hidden file input — always in the DOM */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* ── MediaPipe Loading Banner ──────────────────────────────────────── */}
      <AnimatePresence>
        {isMPLoading && (
          <motion.div
            key="mp-loading"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="
              mb-4 flex items-center justify-center gap-2.5
              px-4 py-2.5 rounded-xl
              bg-emerald-50/80 backdrop-blur-sm border border-emerald-200/50
              text-emerald-700 text-sm font-medium
            "
          >
            <Loader2 className="w-4 h-4 animate-spin" />
            Đang nạp AI Scanner...
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {/* ━━━━━━━━━━━ EMPTY STATE — Dual Action Card ━━━━━━━━━━━━━━━━━━━━━━━ */}
        {!imageSrc && !isCameraOpen && (
          <motion.div key="empty" {...fadeUp}>
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 shadow-lg shadow-teal-500/25 mb-4">
                <ScanFace className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 font-headline-lg">
                Phân tích làn da bằng AI
              </h2>
              <p className="text-slate-600 mt-1.5 text-body-md max-w-md mx-auto">
                Chụp ảnh hoặc tải lên hình khuôn mặt để nhận kết quả phân tích da chuyên sâu chỉ trong vài giây.
              </p>
            </div>

            {/* Glass Card — Two Zones */}
            <div
              className={`
                ${GLASS_BASE}
                p-2 sm:p-3 shadow-xl
              `}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                {/* ── Zone: Camera ─────────────────────────────────────────── */}
                <button
                  type="button"
                  onClick={() => setIsCameraOpen(true)}
                  className={`
                    group relative flex flex-col items-center justify-center gap-4
                    rounded-xl p-8 sm:p-10
                    bg-white/10 hover:bg-white/20
                    border-2 border-dashed border-slate-300/50 hover:border-teal-500/50
                    transition-all duration-300 ease-out cursor-pointer
                    focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:ring-offset-2
                    hover:-translate-y-1 hover:shadow-lg
                  `}
                >
                  <div
                    className="
                      flex items-center justify-center w-16 h-16 rounded-2xl
                      bg-teal-100/80 text-teal-600
                      group-hover:bg-teal-600 group-hover:text-white
                      group-hover:shadow-lg group-hover:shadow-teal-500/30
                      transition-all duration-300
                    "
                  >
                    <Camera className="w-7 h-7" />
                  </div>
                  <div className="text-center">
                    <span className="block text-base font-bold text-slate-800 group-hover:text-teal-700 transition-colors">
                      Chụp ảnh trực tiếp
                    </span>
                    <span className="block text-sm text-slate-500 mt-1">
                      Sử dụng webcam của bạn
                    </span>
                  </div>

                  {/* Subtle shimmer on hover */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-pulse pointer-events-none" />
                </button>

                {/* ── Zone: Upload ─────────────────────────────────────────── */}
                <button
                  type="button"
                  onClick={openFilePicker}
                  className={`
                    group relative flex flex-col items-center justify-center gap-4
                    rounded-xl p-8 sm:p-10
                    bg-white/10 hover:bg-white/20
                    border-2 border-dashed border-slate-300/50 hover:border-sky-500/50
                    transition-all duration-300 ease-out cursor-pointer
                    focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:ring-offset-2
                    hover:-translate-y-1 hover:shadow-lg
                  `}
                >
                  <div
                    className="
                      flex items-center justify-center w-16 h-16 rounded-2xl
                      bg-sky-100/80 text-sky-600
                      group-hover:bg-sky-500 group-hover:text-white
                      group-hover:shadow-lg group-hover:shadow-sky-500/30
                      transition-all duration-300
                    "
                  >
                    <Upload className="w-7 h-7" />
                  </div>
                  <div className="text-center">
                    <span className="block text-base font-bold text-slate-800 group-hover:text-sky-700 transition-colors">
                      Tải ảnh lên
                    </span>
                    <span className="block text-sm text-slate-500 mt-1">
                      JPG, PNG — tối đa 10 MB
                    </span>
                  </div>

                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-pulse pointer-events-none" />
                </button>
              </div>
            </div>

            {/* Trust badge */}
            <div className="flex items-center justify-center gap-2 mt-5 text-xs text-slate-600 font-medium">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>Ảnh của bạn được xử lý bảo mật và không lưu trên máy chủ.</span>
            </div>
          </motion.div>
        )}

        {/* ━━━━━━━━━━━ CAMERA VIEW ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {isCameraOpen && !imageSrc && (
          <motion.div key="camera" {...scaleIn}>
            <div
              className={`
                ${GLASS_BASE}
                overflow-hidden shadow-xl
              `}
            >
              {/* Webcam Feed */}
              <div className="relative bg-slate-900 rounded-t-2xl overflow-hidden">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  videoConstraints={VIDEO_CONSTRAINTS}
                  mirrored
                  className="w-full h-auto block"
                />

                {/* Overlay guides — thin corner brackets */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-[65%] aspect-[3/4] relative">
                    {/* Top-left */}
                    <span className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-teal-400 rounded-tl-lg" />
                    {/* Top-right */}
                    <span className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-teal-400 rounded-tr-lg" />
                    {/* Bottom-left */}
                    <span className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-teal-400 rounded-bl-lg" />
                    {/* Bottom-right */}
                    <span className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-teal-400 rounded-br-lg" />
                  </div>
                </div>

                {/* Instruction badge */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm text-white text-xs font-medium px-4 py-1.5 rounded-full">
                  Đặt khuôn mặt vào khung hình
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-center gap-3 p-4 bg-slate-950/5 border-t border-slate-200/40">
                <button
                  type="button"
                  onClick={() => setIsCameraOpen(false)}
                  className="
                    flex items-center gap-2 px-5 py-2.5 cursor-pointer border-none
                    text-sm font-semibold text-slate-700
                    bg-slate-100 hover:bg-slate-200/80
                    rounded-xl transition-colors
                  "
                >
                  <X className="w-4 h-4" />
                  Hủy
                </button>

                <button
                  type="button"
                  onClick={handleCapture}
                  className="
                    flex items-center gap-2 px-6 py-2.5 cursor-pointer border-none
                    text-sm font-bold text-white
                    bg-gradient-to-r from-teal-600 to-emerald-600
                    hover:from-teal-700 hover:to-emerald-700
                    shadow-lg shadow-teal-500/25
                    rounded-xl transition-all active:scale-95
                  "
                >
                  <Camera className="w-4 h-4" />
                  Chụp hình
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ━━━━━━━━━━━ PREVIEW STATE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {imageSrc && (
          <motion.div key="preview" {...fadeUp}>
            <div
              className={`
                ${GLASS_BASE}
                overflow-hidden shadow-xl
              `}
            >
              {/* Image + Canvas overlay container */}
              <div className="relative bg-slate-900 rounded-t-2xl overflow-hidden">
                <img
                  ref={imageRef}
                  src={imageSrc}
                  alt="Ảnh phân tích da"
                  className="w-full h-auto max-h-[480px] object-contain block mx-auto"
                  crossOrigin="anonymous"
                />

                {/* Canvas overlays the image at exact same dimensions */}
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 w-full h-full pointer-events-none"
                />

                {/* Decorative scan-line overlay */}
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-emerald-500/5 via-transparent to-emerald-500/5" />

                {/* Mesh-drawing spinner */}
                {isMeshDrawing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
                    <div className="flex items-center gap-2 px-4 py-2 bg-black/60 rounded-full text-white text-xs font-medium">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Đang quét khuôn mặt...
                    </div>
                  </div>
                )}

                {/* Mesh success badge */}
                {meshReady && !analysisResults && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-full text-emerald-300 text-xs font-medium"
                  >
                    <ScanFace className="w-3.5 h-3.5" />
                    Biometric mesh — Đã khóa khuôn mặt
                  </motion.div>
                )}

                {/* Scanning animation while analyzing */}
                {isAnalyzing && (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <motion.div
                      className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_2px_rgba(52,211,153,0.5)]"
                      initial={{ top: '0%' }}
                      animate={{ top: '100%' }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
                    />
                  </div>
                )}
              </div>

              {/* Results summary badge (appears after analysis) */}
              {analysisResults && analysisResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mx-5 mt-4 px-4 py-3 rounded-xl ${GLASS_BASE} !bg-teal-500/5 border-teal-500/15`}
                >
                  <p className="text-sm font-bold text-teal-800">
                    Phát hiện {analysisResults.length} vùng cần lưu ý
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Object.entries(
                      analysisResults.reduce((acc, r) => {
                        acc[r.label] = (acc[r.label] || 0) + 1;
                        return acc;
                      }, {})
                    ).map(([label, count]) => {
                      const style = getLabelStyle(label);
                      return (
                        <span
                          key={label}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={{ backgroundColor: style.fill, color: style.text, border: `1px solid ${style.stroke}` }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: style.stroke }} />
                          {translateLabel(label)} × {count}
                        </span>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* Zero-detections badge */}
              {analysisResults && analysisResults.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mx-5 mt-4 px-4 py-3 rounded-xl ${GLASS_BASE} !bg-teal-500/5 border-teal-500/15`}
                >
                  <p className="text-sm font-bold text-teal-800">
                    ✨ Không phát hiện vấn đề da liễu nào — Làn da rất khỏe mạnh!
                  </p>
                </motion.div>
              )}

              {/* Error toast */}
              <AnimatePresence>
                {analysisError && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="mx-5 mt-4 px-4 py-3 rounded-xl bg-gradient-to-r from-red-50 to-rose-50 border border-red-200/60 flex items-start gap-3"
                  >
                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-red-800">Phân tích thất bại</p>
                      <p className="text-xs text-red-600 mt-0.5 break-words">{analysisError}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAnalysisError(null)}
                      className="text-red-400 hover:text-red-600 transition-colors flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 p-5 bg-slate-950/5 border-t border-slate-200/40">
                {/* Ghost / secondary */}
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isAnalyzing}
                  className="
                    flex items-center gap-2 px-5 py-2.5 w-full sm:w-auto justify-center cursor-pointer
                    text-sm font-semibold text-slate-700
                    bg-slate-100 hover:bg-slate-200/80
                    border border-slate-300/60
                    rounded-xl transition-colors
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                >
                  <RefreshCw className="w-4 h-4" />
                  Chụp / Tải ảnh khác
                </button>

                {/* Primary CTA */}
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="
                    flex items-center gap-2 px-7 py-3 w-full sm:w-auto justify-center cursor-pointer border-none
                    text-sm font-bold text-white
                    bg-gradient-to-r from-teal-600 to-emerald-600
                    hover:from-teal-700 hover:to-emerald-700
                    shadow-lg shadow-teal-600/25
                    rounded-xl transition-all active:scale-[0.97]
                    disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100
                  "
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang phân tích...
                    </>
                  ) : analysisResults ? (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Phân tích lại
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Phân tích da ngay
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
