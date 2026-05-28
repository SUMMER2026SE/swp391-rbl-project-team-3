import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, QrCode, Wallet, CheckCircle2, ShieldCheck, RefreshCw } from 'lucide-react';
import { useAppointmentController } from '../controllers/useAppointmentController';
import { useAuth } from '../context/AuthContext';

export default function PaymentModal({ isOpen, onClose, appointment, onSuccess }) {
  const { user } = useAuth();
  const { payAppointment } = useAppointmentController();

  const [activeTab, setActiveTab] = useState('qr'); // 'qr' | 'card' | 'wallet'
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // QR Code States
  const [qrCountdown, setQrCountdown] = useState(6);

  // Credit Card States
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  // Parse Fee
  const parseFee = (feeStr) => {
    if (!feeStr) return 500000;
    const cleanStr = feeStr.replace(/[^0-9]/g, '');
    return parseInt(cleanStr, 10) || 500000;
  };

  const totalAmount = parseFee(appointment?.consultationFee);
  const discountAmount = 0; // Default
  const finalAmount = totalAmount - discountAmount;

  // Auto trigger success for QR code tab mock scanning
  useEffect(() => {
    if (!isOpen || activeTab !== 'qr' || paymentSuccess || isProcessing) return;

    setQrCountdown(6);
    const interval = setInterval(() => {
      setQrCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSuccessCheckout('QR Code');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, activeTab, paymentSuccess, isProcessing]);

  if (!isOpen || !appointment) return null;

  const handleSuccessCheckout = (method) => {
    setIsProcessing(true);
    setTimeout(() => {
      try {
        const payload = {
          appointment_id: appointment.appointment_id,
          patient_id: user?.id || appointment.patient_id || 'mock-patient-123',
          receptionist_id: appointment.receptionist_id || null,
          voucher_id: null,
          total_amount: totalAmount,
          discount_amount: discountAmount,
          final_amount: finalAmount,
          payment_method: method,
          payment_status: 'Paid'
        };

        payAppointment(payload);
        setIsProcessing(false);
        setPaymentSuccess(true);
        
        // Wait and close
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
          setPaymentSuccess(false);
        }, 2500);
      } catch (err) {
        setIsProcessing(false);
        alert('Thanh toán thất bại, vui lòng thử lại.');
      }
    }, 1500); // Spinner simulation
  };

  const handleCreditCardSubmit = (e) => {
    e.preventDefault();
    if (!cardNumber || !cardName || !cardExpiry || !cardCvv) {
      alert('Vui lòng điền đầy đủ thông tin thẻ.');
      return;
    }
    handleSuccessCheckout('Credit Card');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 220 }}
          className="relative w-full max-w-xl bg-white/80 backdrop-blur-2xl border border-white/60 shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-[2.5rem] overflow-hidden flex flex-col p-8 min-h-[480px]"
        >
          {/* Close button */}
          {!paymentSuccess && (
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors border-none cursor-pointer z-50 shadow-sm"
            >
              <X size={16} />
            </button>
          )}

          {/* SUCCESS SCREEN */}
          {paymentSuccess ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-10 space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: 360 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="w-20 h-20 rounded-full bg-emerald-50 border-4 border-emerald-200 flex items-center justify-center text-emerald-500 shadow-lg shadow-emerald-500/10"
              >
                <CheckCircle2 size={44} />
              </motion.div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">Thanh toán thành công!</h3>
              <p className="text-sm text-slate-400 font-semibold max-w-xs">
                Mã giao dịch của bạn đã được ghi nhận. Lịch hẹn của bạn đã chuyển sang trạng thái Đã thanh toán.
              </p>
            </div>
          ) : isProcessing ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-10 space-y-4">
              <RefreshCw className="w-12 h-12 text-teal-500 animate-spin" />
              <h3 className="text-lg font-bold text-slate-800">Đang xử lý giao dịch...</h3>
              <p className="text-xs text-slate-400 font-semibold">Vui lòng không đóng cửa sổ này hoặc tải lại trang.</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="mb-6">
                <span className="text-[10px] font-bold text-teal-600 bg-teal-50 border border-teal-200/50 rounded-full px-3 py-1 uppercase tracking-wider">
                  Cổng thanh toán y tế
                </span>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight mt-2.5">
                  Thanh toán hóa đơn
                </h2>
                <div className="mt-3 p-4 bg-slate-50/60 border border-slate-200/40 rounded-2xl flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-bold text-slate-700">{appointment.doctor_name}</h4>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{appointment.service_name}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tổng cộng</span>
                    <h3 className="text-lg font-black text-slate-800">{appointment.consultationFee}</h3>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex bg-slate-100/80 p-1 rounded-2xl gap-1 mb-6">
                <button
                  onClick={() => setActiveTab('qr')}
                  className={`flex-1 py-3.5 rounded-xl border-none font-bold text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'qr'
                      ? 'bg-white text-teal-700 shadow-sm'
                      : 'bg-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <QrCode size={14} />
                  VietQR quét mã
                </button>
                <button
                  onClick={() => setActiveTab('card')}
                  className={`flex-1 py-3.5 rounded-xl border-none font-bold text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'card'
                      ? 'bg-white text-teal-700 shadow-sm'
                      : 'bg-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <CreditCard size={14} />
                  Thẻ tín dụng
                </button>
                <button
                  onClick={() => setActiveTab('wallet')}
                  className={`flex-1 py-3.5 rounded-xl border-none font-bold text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'wallet'
                      ? 'bg-white text-teal-700 shadow-sm'
                      : 'bg-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Wallet size={14} />
                  Ví MoMo
                </button>
              </div>

              {/* Tab Contents */}
              <div className="flex-1 flex flex-col justify-between">
                {/* 1. VietQR Code Tab */}
                {activeTab === 'qr' && (
                  <div className="flex flex-col items-center text-center space-y-4 py-2">
                    {/* Glowing scanning QR container */}
                    <div className="relative p-3 bg-white rounded-[2rem] border border-slate-200 shadow-md w-44 h-44 flex items-center justify-center overflow-hidden">
                      <img
                        src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=DermaSmartClinicBookingPay"
                        alt="QR Code"
                        className="w-full h-full object-contain"
                      />
                      {/* Laser Beam scanning animation */}
                      <style>{`
                        @keyframes qr-scan {
                          0%, 100% { top: 0%; }
                          50% { top: 100%; }
                        }
                      `}</style>
                      <div
                        className="absolute left-0 right-0 h-0.5 bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.8)] pointer-events-none"
                        style={{ animation: 'qr-scan 2s linear infinite' }}
                      />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700">Mở ứng dụng ngân hàng quét mã để thanh toán</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-1">Hỗ trợ Napas 24/7, VietQR, các ví điện tử</p>
                    </div>

                    <div className="bg-teal-50/50 border border-teal-200/30 rounded-xl px-4 py-2 text-[10px] font-bold text-teal-700 flex items-center gap-2">
                      <RefreshCw size={12} className="animate-spin text-teal-500" />
                      Hệ thống đang kiểm tra giao dịch tự động trong {qrCountdown}s...
                    </div>
                  </div>
                )}

                {/* 2. Credit Card Tab */}
                {activeTab === 'card' && (
                  <div className="space-y-6">
                    {/* Gorgeous 3D glassmorphic Card container */}
                    <div className="perspective-1000 w-full h-40 relative">
                      <div
                        className="w-full h-full duration-700 transform-style-3d relative rounded-2xl shadow-xl"
                        style={{ transform: isCardFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
                      >
                        {/* Front side */}
                        <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-slate-900 to-sky-900 text-white rounded-2xl p-5 flex flex-col justify-between overflow-hidden">
                          <div className="absolute -right-12 -top-12 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl" />
                          <div className="flex justify-between items-start">
                            <span className="font-extrabold text-sm tracking-tight text-teal-400">DermaSmart Platinum</span>
                            <div className="w-10 h-7 rounded-md bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-[10px] font-bold">VISA</div>
                          </div>
                          <div>
                            <div className="text-lg font-black tracking-widest text-slate-200">
                              {cardNumber || '•••• •••• •••• ••••'}
                            </div>
                            <div className="flex justify-between items-end mt-4">
                              <div>
                                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Chủ thẻ</p>
                                <p className="text-xs font-bold truncate max-w-[200px]">{cardName.toUpperCase() || 'TEN CHU THE'}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Hạn dùng</p>
                                <p className="text-xs font-bold">{cardExpiry || 'MM/YY'}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Back side */}
                        <div
                          className="absolute inset-0 backface-hidden bg-gradient-to-br from-slate-900 to-sky-900 text-white rounded-2xl flex flex-col justify-between py-5 overflow-hidden"
                          style={{ transform: 'rotateY(180deg)' }}
                        >
                          <div className="w-full h-8 bg-slate-800 mt-2" />
                          <div className="px-5">
                            <div className="flex justify-end items-center mt-2">
                              <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mr-2">CVV</span>
                              <div className="bg-white text-slate-900 px-3 py-1.5 rounded font-bold text-xs tracking-wider shadow-inner w-12 text-center">
                                {cardCvv || '•••'}
                              </div>
                            </div>
                          </div>
                          <div className="px-5 text-[8px] text-slate-500 font-bold text-right">
                            Hệ thống bảo mật SSL 256-bit chuẩn PCI-DSS
                          </div>
                        </div>
                      </div>
                    </div>

                    <form onSubmit={handleCreditCardSubmit} className="space-y-3">
                      <div>
                        <input
                          type="text"
                          placeholder="Số thẻ tín dụng"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value.replace(/[^0-9 ]/g, '').substring(0, 19))}
                          onFocus={() => setIsCardFlipped(false)}
                          className="w-full bg-white border border-slate-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 text-slate-900 rounded-xl px-4 py-2.5 text-xs outline-none font-semibold shadow-inner"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <input
                          type="text"
                          placeholder="Họ và tên chủ thẻ"
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value.replace(/[^a-zA-Z ]/g, ''))}
                          onFocus={() => setIsCardFlipped(false)}
                          className="col-span-2 w-full bg-white border border-slate-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 text-slate-900 rounded-xl px-4 py-2.5 text-xs outline-none font-semibold shadow-inner"
                        />
                        <input
                          type="text"
                          placeholder="MM/YY"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value.substring(0, 5))}
                          onFocus={() => setIsCardFlipped(false)}
                          className="w-full bg-white border border-slate-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 text-slate-900 rounded-xl px-4 py-2.5 text-xs outline-none font-semibold shadow-inner text-center"
                        />
                      </div>
                      <div>
                        <input
                          type="password"
                          placeholder="Mã bảo mật CVV"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/[^0-9]/g, '').substring(0, 3))}
                          onFocus={() => setIsCardFlipped(true)}
                          onBlur={() => setIsCardFlipped(false)}
                          className="w-full bg-white border border-slate-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 text-slate-900 rounded-xl px-4 py-2.5 text-xs outline-none font-semibold shadow-inner"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-sky-500 text-white font-bold text-xs rounded-xl shadow-md shadow-teal-500/20 hover:shadow-lg hover:scale-[1.01] hover:-translate-y-0.5 border-none cursor-pointer mt-2 transition-all"
                      >
                        Thanh toán ngay qua thẻ
                      </button>
                    </form>
                  </div>
                )}

                {/* 3. MoMo Wallet Tab */}
                {activeTab === 'wallet' && (
                  <div className="flex flex-col items-center justify-center text-center space-y-5 py-4">
                    <div className="w-16 h-16 rounded-2xl bg-fuchsia-100 flex items-center justify-center text-fuchsia-700 border border-fuchsia-200">
                      <Wallet size={36} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Thanh toán siêu tốc qua ví điện tử MoMo</h4>
                      <p className="text-xs text-slate-400 font-semibold mt-1">Xác nhận thanh toán ngay lập tức bằng ứng dụng MoMo trên điện thoại</p>
                    </div>
                    <button
                      onClick={() => handleSuccessCheckout('MoMo')}
                      className="w-full py-3.5 bg-fuchsia-600 text-white font-bold text-xs rounded-xl hover:bg-fuchsia-700 border-none cursor-pointer shadow-md shadow-fuchsia-600/15 transition-colors"
                    >
                      Kết nối &amp; Thanh toán bằng ví MoMo
                    </button>
                  </div>
                )}

                {/* Secure Badge Footer */}
                <div className="mt-6 border-t border-slate-200/50 pt-4 flex items-center justify-center gap-2 text-slate-400">
                  <ShieldCheck size={14} className="text-emerald-500" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider">Thanh toán bảo mật chuẩn PCI-DSS</span>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
