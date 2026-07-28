import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GLASS_BASE } from './common/GlassCard';

/**
 * Privacy / terms notice for the landing-page footer.
 *
 * Those three footer links used to be `href="#"` — clicking them jumped to the
 * top of the page. The text below describes how this system actually handles
 * data (Supabase Postgres, row-level security, the roles that can read a record)
 * rather than boilerplate; replace it with the clinic's reviewed legal copy
 * before a real launch.
 */

const SECTIONS = {
  privacy: {
    title: 'Chính sách bảo mật',
    intro:
      'DermaSmart lưu trữ dữ liệu khám chữa bệnh trên hạ tầng Supabase (PostgreSQL) đặt tại khu vực Singapore. Trang này mô tả đúng cách hệ thống đang vận hành.',
    items: [
      ['Dữ liệu chúng tôi lưu', 'Họ tên, email, số điện thoại, giới tính, ngày sinh, lịch hẹn, hồ sơ bệnh án, đơn thuốc, ảnh soi da và lịch sử thanh toán của bạn.'],
      ['Ai được xem', 'Bạn luôn xem được hồ sơ của chính mình. Bác sĩ, kỹ thuật viên, lễ tân và quản trị viên của phòng khám xem được hồ sơ phục vụ điều trị. Người chưa đăng nhập chỉ xem được thông tin công khai (danh sách bác sĩ, bảng giá, lịch trống).'],
      ['Cơ chế kỹ thuật', 'Mọi truy vấn đi qua Row Level Security của PostgreSQL — quyền đọc/ghi được kiểm tra ở tầng cơ sở dữ liệu, không phụ thuộc vào giao diện.'],
      ['Đường truyền', 'Toàn bộ kết nối dùng HTTPS/TLS. Mật khẩu do Supabase Auth quản lý và được băm, hệ thống không lưu mật khẩu dạng gốc.'],
      ['Dịch vụ bên thứ ba', 'Trợ lý AI (Google Gemini) nhận nội dung tin nhắn bạn gửi cho chatbot; ảnh soi da được gửi tới dịch vụ phân tích ảnh; email xác nhận gửi qua nhà cung cấp email giao dịch; thanh toán chuyển khoản xử lý qua PayOS.'],
      ['Quyền của bạn', 'Bạn có thể yêu cầu xem, sửa hoặc xoá dữ liệu cá nhân bằng cách liên hệ phòng khám qua khung chat "Gặp Lễ tân".'],
    ],
  },
  terms: {
    title: 'Điều khoản dịch vụ',
    intro:
      'Khi sử dụng DermaSmart, bạn đồng ý với các điều khoản dưới đây.',
    items: [
      ['Mục đích sử dụng', 'Nền tảng hỗ trợ đặt lịch, quản lý hồ sơ và theo dõi điều trị da liễu. Tài khoản chỉ dành cho cá nhân sở hữu, không chia sẻ cho người khác.'],
      ['Giá trị của kết quả AI', 'Kết quả soi da AI và câu trả lời của chatbot chỉ mang tính tham khảo, KHÔNG thay thế chẩn đoán của bác sĩ. Mọi quyết định điều trị phải do bác sĩ đưa ra sau khi thăm khám.'],
      ['Lịch hẹn', 'Lịch hẹn chỉ có hiệu lực sau khi được phòng khám xác nhận. Vui lòng huỷ hoặc đổi lịch sớm để nhường chỗ cho bệnh nhân khác.'],
      ['Thanh toán', 'Phí khám và phí dịch vụ hiển thị trước khi xác nhận. Giao dịch chuyển khoản được xử lý qua cổng thanh toán PayOS.'],
      ['Nội dung bạn gửi lên', 'Bạn chịu trách nhiệm về ảnh và thông tin mình cung cấp, và cam kết đó là dữ liệu của chính mình.'],
      ['Trường hợp khẩn cấp', 'Hệ thống không phục vụ cấp cứu. Nếu có dấu hiệu nguy hiểm, hãy tới cơ sở y tế gần nhất hoặc gọi 115.'],
    ],
  },
};

export default function LegalNoticeModal({ doc, onClose }) {
  const content = doc ? SECTIONS[doc] : null;

  return (
    <AnimatePresence>
      {content && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className={`w-[95%] md:w-[640px] max-h-[85vh] ${GLASS_BASE} relative overflow-hidden flex flex-col p-8 md:p-10`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-slate-100/80 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors border-none cursor-pointer"
              onClick={onClose}
              aria-label="Đóng"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <h2 className="text-2xl font-bold text-slate-900 mb-2 pr-12">{content.title}</h2>
            <p className="text-sm text-slate-600 mb-6">{content.intro}</p>

            <div className="overflow-y-auto pr-2 flex flex-col gap-4">
              {content.items.map(([heading, body]) => (
                <div key={heading}>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-1">{heading}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{body}</p>
                </div>
              ))}
              <p className="text-xs text-slate-400 mt-2">Cập nhật lần cuối: 28/07/2026</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
