import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer, Receipt, CreditCard, CheckCircle2 } from 'lucide-react';

const formatVnd = (amount) => {
  if (typeof amount === 'string' && amount.includes('VNĐ')) return amount;
  return Number(amount || 0).toLocaleString('vi-VN') + ' VNĐ';
};

export default function InvoiceDetailModal({ invoice, onClose }) {
  if (!invoice) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 font-sans"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 250 }}
          className="w-full max-w-md bg-white border border-slate-200 shadow-2xl rounded-[2rem] p-6 relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-transparent border-none text-slate-400 hover:text-slate-700 hover:bg-slate-100/50 p-2 rounded-full flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Receipt View (Printable style) */}
          <div id="invoice-print-area" className="bg-slate-50/50 border border-slate-150 rounded-2xl p-5 space-y-4 text-xs">
            {/* Clinic Header */}
            <div className="text-center space-y-1 pb-1">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2 border border-emerald-100">
                <Receipt className="w-5 h-5" />
              </div>
              <h4 className="font-extrabold text-[13px] uppercase tracking-wider text-slate-900">
                PHÒNG KHÁM DA LIỄU DERMASMART
              </h4>
              <p className="text-[10px] text-slate-400 font-medium">
                123 Đường Ba Tháng Hai, Quận 10, TP.HCM
              </p>
              <div className="border-b-2 border-double border-slate-200 my-2" />
              <h5 className="font-extrabold text-xs uppercase tracking-widest text-emerald-700 py-0.5">
                HÓA ĐƠN THANH TOÁN
              </h5>
              <p className="text-[9px] text-slate-400 font-bold">
                Mã HĐ: HD-{String(invoice.aptId).replace(/\D/g, '').slice(-6) || '100001'}
              </p>
            </div>

            {/* General Info */}
            <div className="space-y-1.5 text-[10px] text-slate-600 font-semibold border-b border-dashed border-slate-200 pb-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Thời gian:</span>
                <span className="text-slate-700">{invoice.paidAt ? invoice.paidAt.toLocaleString('vi-VN') : '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-450">Thu ngân:</span>
                <span className="text-slate-700">Lễ tân ({invoice.receptionistId || 'staff'})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-450">Phương thức:</span>
                <span className="inline-flex items-center gap-1 text-slate-700">
                  <CreditCard className="w-3 h-3 text-slate-450" />
                  {invoice.method}
                </span>
              </div>
            </div>

            {/* Client and Doctor Details */}
            <div className="space-y-2 text-[11px] text-slate-700 font-semibold border-b border-dashed border-slate-200 pb-3 pt-1">
              <div className="flex items-start gap-1">
                <span className="text-slate-400 w-24 shrink-0 font-bold">Khách hàng:</span>
                <strong className="text-slate-800">{invoice.patientName}</strong>
              </div>
              <div className="flex items-start gap-1">
                <span className="text-slate-400 w-24 shrink-0 font-bold">Bác sĩ khám:</span>
                <span className="text-slate-700">{invoice.doctorName}</span>
              </div>
            </div>

            {/* Costs breakdown */}
            <div className="space-y-1.5 text-[10px] font-semibold text-slate-650">
              <div className="flex justify-between">
                <span className="text-slate-400">Khám: {invoice.serviceName}</span>
                <span className="text-slate-700 font-bold">{formatVnd(invoice.baseTotal || invoice.total)}</span>
              </div>
              {invoice.usedServices && invoice.usedServices.map((s, idx) => (
                <div key={idx} className="flex justify-between">
                  <span className="text-slate-400">DV: {s.name}</span>
                  <span className="text-slate-700 font-bold">{formatVnd(s.price)}</span>
                </div>
              ))}
              {invoice.followUpFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Đặt lịch tái khám:</span>
                  <span className="text-slate-700 font-bold">{formatVnd(invoice.followUpFee)}</span>
                </div>
              )}
              <div className="border-t border-slate-200 mt-2 pt-2 flex justify-between">
                <span className="text-slate-500 font-bold">Cộng tiền dịch vụ:</span>
                <span className="text-slate-700 font-bold">{formatVnd(invoice.total)}</span>
              </div>
              {invoice.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Ưu đãi {invoice.voucherCode ? `(${invoice.voucherCode})` : ''}:</span>
                  <span className="font-bold">−{formatVnd(invoice.discount)}</span>
                </div>
              )}
              
              <div className="border-t border-slate-200 pt-3 flex justify-between items-center text-xs font-black text-slate-800">
                <span className="text-slate-900 uppercase">TỔNG ĐÃ THU:</span>
                <span className="text-[14px] text-emerald-600 font-black">{formatVnd(invoice.netPayable)}</span>
              </div>
            </div>

            {/* Success Badge */}
            <div className="flex items-center justify-center gap-1.5 bg-emerald-50 border border-emerald-100 rounded-xl py-2 px-3 text-emerald-700 text-[10px] font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              ĐÃ THANH TOÁN THÀNH CÔNG
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 active:scale-95 transition-all cursor-pointer bg-white"
            >
              Đóng lại
            </button>
            <button
              onClick={() => {
                const printWindow = window.open('', '_blank');
                printWindow.document.write(`
                  <html>
                    <head>
                      <title>Hoa don thanh toan - ${invoice.patientName}</title>
                      <style>
                        body { font-family: monospace; padding: 20px; color: #333; max-width: 400px; margin: 0 auto; }
                        .text-center { text-align: center; }
                        .flex { display: flex; justify-content: space-between; }
                        .border-b { border-bottom: 1px dashed #ccc; margin: 10px 0; }
                        .border-double { border-bottom: 3px double #333; margin: 10px 0; }
                        .font-bold { font-weight: bold; }
                        .text-emerald { color: #16a34a; }
                      </style>
                    </head>
                    <body>
                      <div class="text-center">
                        <h3>PHONG KHAM DA LIEU DERMASMART</h3>
                        <p style="font-size: 10px; color: #666;">123 Duong Ba Thang Hai, Quan 10, TP.HCM</p>
                        <div class="border-double"></div>
                        <h4>HOA DON THANH TOAN</h4>
                        <p style="font-size: 10px;">Ma HD: HD-${String(invoice.aptId).replace(/\D/g, '').slice(-6)}</p>
                      </div>
                      <div style="font-size: 11px; line-height: 1.6;">
                        <div class="flex"><span>Thoi gian:</span><span>${invoice.paidAt ? invoice.paidAt.toLocaleString('vi-VN') : ''}</span></div>
                        <div class="flex"><span>Thu ngan:</span><span>Le tan (${invoice.receptionistId})</span></div>
                        <div class="flex"><span>Phuong thuc:</span><span>${invoice.method}</span></div>
                        <div class="border-b"></div>
                        <p><b>Khach hang:</b> ${invoice.patientName}</p>
                        <p><b>Bac si:</b> ${invoice.doctorName}</p>
                        <div class="border-double"></div>
                        <div class="flex"><span>Kham: ${invoice.serviceName}</span><span>${formatVnd(invoice.baseTotal || invoice.total)}</span></div>
                        ${invoice.usedServices ? invoice.usedServices.map(s => `<div class="flex"><span>DV: ${s.name}</span><span>${formatVnd(s.price)}</span></div>`).join('') : ''}
                        ${invoice.followUpFee > 0 ? `<div class="flex"><span>Dat lich tai kham:</span><span>${formatVnd(invoice.followUpFee)}</span></div>` : ''}
                        <div class="border-b"></div>
                        <div class="flex"><span>Cong tien dich vu:</span><span>${formatVnd(invoice.total)}</span></div>
                        \${invoice.discount > 0 ? \`<div class="flex text-emerald"><span>Uu dai:</span><span>-\${formatVnd(invoice.discount)}</span></div>\` : ''}
                        <div class="border-b"></div>
                        <div class="flex" style="font-weight: bold; font-size: 13px;">
                          <span>TONG DA THU:</span>
                          <span>\${formatVnd(invoice.netPayable)}</span>
                        </div>
                      </div>
                      <div class="text-center" style="margin-top: 20px; font-size: 10px; color: #888;">
                        Cam on quy khach da tin tuong DermaSmart!
                      </div>
                      <script>
                        window.onload = function() {
                          window.print();
                          window.close();
                        };
                      </script>
                    </body>
                  </html>
                `);
                printWindow.document.close();
              }}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold hover:shadow-lg active:scale-95 transition-all cursor-pointer border-none flex justify-center items-center gap-1.5"
            >
              <Printer className="w-4 h-4" /> In hóa đơn
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
