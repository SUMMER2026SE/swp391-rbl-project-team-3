import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Ticket, Plus, Search, Edit3, Trash2, Power, Copy,
  CheckCircle2, AlertCircle, X, Tag, Calendar, Percent,
  DollarSign, Users, Layers, Info, TrendingUp, Clock,
  ChevronDown, Filter,
} from 'lucide-react';
import { useVoucherController } from '../../controllers/useVoucherController';
import { mockServices } from '../../mockData';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_STYLES = {
  'Hoạt động': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Tạm dừng':  'bg-amber-50  text-amber-700  border-amber-200',
  'Hết hạn':   'bg-slate-100 text-slate-500  border-slate-200',
  'Hết lượt':  'bg-rose-50   text-rose-600   border-rose-200',
};

// Event tag → gradient/color mapping
const EVENT_STYLES = {
  'Ngày Thầy Thuốc Việt Nam': { gradient: 'from-sky-400 to-blue-500',    light: 'bg-sky-50 border-sky-200 text-sky-700' },
  'Quốc tế Phụ nữ 8/3':      { gradient: 'from-rose-400 to-pink-500',   light: 'bg-rose-50 border-rose-200 text-rose-700' },
  'Ngày Phụ nữ Việt Nam 20/10':{ gradient: 'from-pink-400 to-rose-500',  light: 'bg-pink-50 border-pink-200 text-pink-700' },
  'Tết Nguyên Đán':            { gradient: 'from-red-500 to-orange-500', light: 'bg-red-50 border-red-200 text-red-700' },
  'Giáng Sinh':                { gradient: 'from-green-500 to-emerald-500', light: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  'Kỷ niệm thành lập':         { gradient: 'from-amber-400 to-yellow-500', light: 'bg-amber-50 border-amber-200 text-amber-700' },
  'Black Friday':               { gradient: 'from-slate-700 to-slate-900', light: 'bg-slate-100 border-slate-300 text-slate-800' },
  'Mùa hè':                    { gradient: 'from-orange-400 to-amber-500', light: 'bg-orange-50 border-orange-200 text-orange-700' },
};

function formatCurrency(n) {
  return Number(n).toLocaleString('vi-VN') + ' VNĐ';
}

function formatDiscount(v) {
  if (v.discountType === 'Percentage') return `-${v.discountValue}%`;
  return `-${formatCurrency(v.discountValue)}`;
}

function usagePercent(v) {
  if (!v.maxUsage) return 0;
  return Math.min(100, Math.round((v.usageCount / v.maxUsage) * 100));
}

function computeVoucherStatus(v) {
  const today = new Date().toISOString().split('T')[0];
  if (v.validTo < today) return 'Hết hạn';
  if (v.usageCount >= v.maxUsage) return 'Hết lượt';
  return v.status;
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-white font-semibold text-sm ${
        type === 'success' ? 'bg-emerald-600' :
        type === 'error'   ? 'bg-rose-600'    : 'bg-sky-600'
      }`}
    >
      {type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
      {msg}
      <button onClick={onClose} className="ml-2 border-none bg-transparent text-white/70 cursor-pointer hover:text-white p-0">
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

// ─── Initial form state ───────────────────────────────────────────────────────
const EMPTY_FORM = {
  code: '',
  name: '',
  description: '',
  discountType: 'Percentage',
  discountValue: '',
  maxDiscountAmount: '',
  minOrderAmount: '',
  validFrom: new Date().toISOString().split('T')[0],
  validTo: '',
  applicableServices: [],
  maxUsage: '',
  perUserLimit: '1',
  eventTag: null,
};

// ─── Voucher Form Modal ───────────────────────────────────────────────────────
function VoucherFormModal({ initial, onClose, onSave }) {
  const isEdit = !!initial?.id;
  const [form, setForm] = useState(initial ? {
    code: initial.code,
    name: initial.name,
    description: initial.description || '',
    discountType: initial.discountType,
    discountValue: String(initial.discountValue),
    maxDiscountAmount: String(initial.maxDiscountAmount || ''),
    minOrderAmount: String(initial.minOrderAmount || ''),
    validFrom: initial.validFrom,
    validTo: initial.validTo,
    applicableServices: initial.applicableServices || [],
    maxUsage: String(initial.maxUsage),
    perUserLimit: String(initial.perUserLimit || 1),
    eventTag: initial.eventTag || null,
  } : { ...EMPTY_FORM });
  const [error, setError] = useState('');

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const toggleService = (svcId) => {
    setForm(p => ({
      ...p,
      applicableServices: p.applicableServices.includes(svcId)
        ? p.applicableServices.filter(s => s !== svcId)
        : [...p.applicableServices, svcId],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    const res = onSave(form);
    if (!res.success) setError(res.error);
  };

  const inputCls = "w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all";
  const labelCls = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5";

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.93, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.93, y: 20 }}
        transition={{ type: 'spring', damping: 26, stiffness: 200 }}
        className="w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-7 pt-6 pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 rounded-xl border border-indigo-100">
              <Ticket className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isEdit ? 'Chỉnh sửa voucher' : 'Tạo voucher mới'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {isEdit ? `Đang sửa: ${initial.code}` : 'Điền đầy đủ thông tin để tạo chương trình khuyến mãi'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 border-none bg-transparent text-slate-400 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-7 py-5 space-y-5">
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Row 1: code + name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Mã voucher <span className="text-rose-400">*</span></label>
              <input
                value={form.code} onChange={e => set('code', e.target.value.toUpperCase())}
                placeholder="VD: SUMMER30" required
                className={inputCls + ' font-mono tracking-widest uppercase'}
              />
              <p className="text-[10px] text-slate-400 mt-1">Chỉ chữ cái, số, - và _</p>
            </div>
            <div>
              <label className={labelCls}>Tên chương trình <span className="text-rose-400">*</span></label>
              <input
                value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="VD: Khuyến mãi hè 2026" required
                className={inputCls}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={labelCls}>Mô tả (tuỳ chọn)</label>
            <textarea
              value={form.description} onChange={e => set('description', e.target.value)}
              placeholder="Mô tả ngắn gọn về chương trình khuyến mãi..."
              rows={2} maxLength={200}
              className={inputCls + ' resize-none'}
            />
          </div>

          {/* Discount type + value */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Loại giảm giá <span className="text-rose-400">*</span></label>
              <div className="flex gap-2">
                {['Percentage', 'Fixed'].map(t => (
                  <button
                    key={t} type="button"
                    onClick={() => set('discountType', t)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      form.discountType === t
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    {t === 'Percentage' ? '% Phần trăm' : '₫ Cố định'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelCls}>
                Giá trị giảm <span className="text-rose-400">*</span>
                <span className="ml-1 text-indigo-400 normal-case">{form.discountType === 'Percentage' ? '(%)' : '(VNĐ)'}</span>
              </label>
              <input
                type="number" min="1" max={form.discountType === 'Percentage' ? 100 : undefined}
                value={form.discountValue} onChange={e => set('discountValue', e.target.value)}
                placeholder={form.discountType === 'Percentage' ? 'VD: 20' : 'VD: 500000'}
                required className={inputCls}
              />
            </div>
            {form.discountType === 'Percentage' && (
              <div>
                <label className={labelCls}>Giảm tối đa (VNĐ)</label>
                <input
                  type="number" min="0"
                  value={form.maxDiscountAmount} onChange={e => set('maxDiscountAmount', e.target.value)}
                  placeholder="VD: 300000 (0 = không giới hạn)"
                  className={inputCls}
                />
              </div>
            )}
          </div>

          {/* Order minimum + usage limit */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Đơn tối thiểu (VNĐ)</label>
              <input
                type="number" min="0"
                value={form.minOrderAmount} onChange={e => set('minOrderAmount', e.target.value)}
                placeholder="0 = không yêu cầu"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Tổng lượt dùng <span className="text-rose-400">*</span></label>
              <input
                type="number" min="1"
                value={form.maxUsage} onChange={e => set('maxUsage', e.target.value)}
                placeholder="VD: 100"
                required className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Lượt/người dùng</label>
              <input
                type="number" min="1"
                value={form.perUserLimit} onChange={e => set('perUserLimit', e.target.value)}
                placeholder="VD: 1"
                className={inputCls}
              />
            </div>
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Ngày bắt đầu <span className="text-rose-400">*</span></label>
              <input type="date" value={form.validFrom} onChange={e => set('validFrom', e.target.value)} required className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Ngày kết thúc <span className="text-rose-400">*</span></label>
              <input type="date" value={form.validTo} onChange={e => set('validTo', e.target.value)} required className={inputCls} />
            </div>
          </div>

          {/* Event tag */}
          <div>
            <label className={labelCls}>Gắn sự kiện đặc biệt (tuỳ chọn)</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { tag: null,                            emoji: '🏷️', label: 'Không' },
                { tag: 'Ngày Thầy Thuốc Việt Nam',     emoji: '🩺', label: 'Ngày Thầy Thuốc 27/02' },
                { tag: 'Quốc tế Phụ nữ 8/3',           emoji: '🌸', label: 'Quốc tế Phụ nữ 8/3' },
                { tag: 'Ngày Phụ nữ Việt Nam 20/10',   emoji: '💐', label: 'Phụ nữ VN 20/10' },
                { tag: 'Tết Nguyên Đán',                emoji: '🧧', label: 'Tết Nguyên Đán' },
                { tag: 'Giáng Sinh',                    emoji: '🎄', label: 'Giáng Sinh' },
                { tag: 'Kỷ niệm thành lập',             emoji: '🎂', label: 'Kỷ niệm thành lập' },
                { tag: 'Black Friday',                  emoji: '🖤', label: 'Black Friday' },
                { tag: 'Mùa hè',                        emoji: '☀️', label: 'Mùa hè' },
              ].map(opt => {
                const isSelected = (form.eventTag || null) === opt.tag;
                return (
                  <button
                    key={String(opt.tag)}
                    type="button"
                    onClick={() => set('eventTag', opt.tag)}
                    className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-200 hover:bg-slate-50'
                    }`}
                  >
                    <span>{opt.emoji}</span>
                    <span className="truncate">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Applicable services */}
          <div>
            <label className={labelCls}>
              Dịch vụ áp dụng
              <span className="ml-2 font-normal normal-case text-slate-400">
                {form.applicableServices.length === 0 ? '(Tất cả dịch vụ)' : `(${form.applicableServices.length} dịch vụ)`}
              </span>
            </label>            <div className="grid grid-cols-2 gap-2">
              {mockServices.map(svc => {
                const checked = form.applicableServices.includes(svc.id);
                return (
                  <button
                    key={svc.id} type="button"
                    onClick={() => toggleService(svc.id)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                      checked
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${checked ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300'}`}>
                      {checked && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                    <span className="truncate">{svc.name}</span>
                  </button>
                );
              })}
            </div>
            {form.applicableServices.length === 0 && (
              <p className="text-[11px] text-indigo-500 mt-2 flex items-center gap-1">
                <Info className="w-3 h-3" /> Không chọn dịch vụ = áp dụng cho tất cả dịch vụ
              </p>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="px-7 py-4 border-t border-slate-100 flex gap-3 shrink-0">
          <button
            type="submit"
            onClick={handleSubmit}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-sky-500 text-white font-bold text-sm shadow-md shadow-indigo-500/20 hover:shadow-lg hover:-translate-y-0.5 transition-all border-none cursor-pointer"
          >
            {isEdit ? 'Lưu thay đổi' : 'Tạo voucher'}
          </button>
          <button
            type="button" onClick={onClose}
            className="px-6 py-3 rounded-xl bg-white border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all cursor-pointer"
          >
            Hủy
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
function DeleteModal({ voucher, onClose, onConfirm, error }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-full max-w-md bg-white rounded-2xl p-7 shadow-2xl border border-slate-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-7 h-7 text-rose-500" />
        </div>
        <h4 className="text-lg font-bold text-slate-800 text-center mb-1">Xóa voucher?</h4>
        <p className="text-sm text-slate-500 text-center mb-2">
          Bạn sắp xóa voucher <span className="font-bold text-slate-700 font-mono">{voucher.code}</span>.
        </p>
        {voucher.usageCount > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-xs text-amber-700 text-center font-semibold">
            Voucher này đã được sử dụng {voucher.usageCount} lần và không thể xóa.
          </div>
        )}
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 mb-4 text-xs text-rose-700 text-center">
            {error}
          </div>
        )}
        <div className="flex gap-3 mt-5">
          <button
            onClick={onConfirm}
            disabled={voucher.usageCount > 0}
            className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all border-none cursor-pointer ${
              voucher.usageCount > 0
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-rose-500 text-white hover:bg-rose-600 shadow-md shadow-rose-500/20'
            }`}
          >
            Xác nhận xóa
          </button>
          <button onClick={onClose} className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm cursor-pointer bg-white hover:bg-slate-50">
            Hủy
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Voucher Card ─────────────────────────────────────────────────────────────
function VoucherCard({ v, onEdit, onToggle, onDelete, onCopy, idx }) {
  const displayStatus = computeVoucherStatus(v);
  const pct = usagePercent(v);
  const isActive = displayStatus === 'Hoạt động';
  const isExpiredOrFull = displayStatus === 'Hết hạn' || displayStatus === 'Hết lượt';
  const serviceNames = v.applicableServices.length > 0
    ? v.applicableServices.map(id => mockServices.find(s => s.id === id)?.name || id).join(', ')
    : 'Tất cả dịch vụ';

  const eventStyle = v.eventTag ? (EVENT_STYLES[v.eventTag] || EVENT_STYLES['Mùa hè']) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05 }}
      className={`bg-white border rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden ${
        isExpiredOrFull ? 'opacity-70 border-slate-200' :
        eventStyle ? 'border-transparent ring-1 ring-inset ring-slate-200 hover:ring-indigo-200' :
        'border-slate-200 hover:border-indigo-200'
      }`}
    >
      {/* Top accent bar — gradient cho event, solid cho normal */}
      <div className={`h-1.5 ${
        eventStyle ? `bg-gradient-to-r ${eventStyle.gradient}` :
        isActive ? 'bg-gradient-to-r from-indigo-500 to-sky-500' :
        'bg-slate-200'
      }`} />

      <div className="p-5">
        {/* Event badge */}
        {v.eventTag && (
          <div className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border mb-3 ${eventStyle?.light || 'bg-slate-100 border-slate-200 text-slate-600'}`}>
            <span>{v.eventEmoji}</span>
            {v.eventTag}
          </div>
        )}

        {/* Row 1: code + status + discount badge */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-base font-black text-slate-900 tracking-widest">
                {v.code}
              </span>
              <button
                onClick={() => onCopy(v.code)}
                title="Copy mã"
                className="p-1 rounded-lg hover:bg-slate-100 border-none bg-transparent cursor-pointer text-slate-400 hover:text-indigo-600 transition-all"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs font-semibold text-slate-700 leading-snug">{v.name}</p>
            {v.description && (
              <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">{v.description}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span className={`text-lg font-black px-3 py-1 rounded-xl border-2 ${
              isActive && eventStyle
                ? `bg-gradient-to-r ${eventStyle.gradient} text-white border-transparent`
                : isActive
                  ? 'text-indigo-600 bg-indigo-50 border-indigo-200'
                  : 'text-slate-500 bg-slate-100 border-slate-200'
            }`}>
              {formatDiscount(v)}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_STYLES[displayStatus] || STATUS_STYLES['Tạm dừng']}`}>
              {displayStatus}
            </span>
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
          <div className="bg-slate-50 rounded-xl p-2.5 flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hiệu lực</p>
              <p className="text-slate-700 font-semibold truncate">{v.validFrom} → {v.validTo}</p>
            </div>
          </div>
          <div className="bg-slate-50 rounded-xl p-2.5 flex items-center gap-2">
            <DollarSign className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Đơn tối thiểu</p>
              <p className="text-slate-700 font-semibold">{v.minOrderAmount > 0 ? formatCurrency(v.minOrderAmount) : 'Không yêu cầu'}</p>
            </div>
          </div>
          {v.discountType === 'Percentage' && v.maxDiscountAmount > 0 && (
            <div className="bg-slate-50 rounded-xl p-2.5 flex items-center gap-2">
              <Percent className="w-3.5 h-3.5 text-violet-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Giảm tối đa</p>
                <p className="text-slate-700 font-semibold">{formatCurrency(v.maxDiscountAmount)}</p>
              </div>
            </div>
          )}
          <div className="bg-slate-50 rounded-xl p-2.5 flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lượt/người</p>
              <p className="text-slate-700 font-semibold">{v.perUserLimit} lượt</p>
            </div>
          </div>
        </div>

        {/* Service tags */}
        <div className="flex items-start gap-1.5 mb-3">
          <Layers className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
          <span className="text-[10px] text-slate-500 font-semibold leading-relaxed">{serviceNames}</span>
        </div>

        {/* Usage progress */}
        <div className="mb-4">
          <div className="flex justify-between text-[10px] font-semibold text-slate-500 mb-1.5">
            <span>Lượt dùng: {v.usageCount}/{v.maxUsage}</span>
            <span className={pct >= 90 ? 'text-rose-500' : pct >= 70 ? 'text-amber-500' : 'text-emerald-600'}>
              {pct}%
            </span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={`h-full rounded-full ${
                pct >= 90 ? 'bg-rose-400' :
                pct >= 70 ? 'bg-amber-400' :
                eventStyle ? `bg-gradient-to-r ${eventStyle.gradient}` :
                'bg-gradient-to-r from-indigo-400 to-sky-400'
              }`}
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(v)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold hover:bg-indigo-100 transition-all cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" /> Sửa
          </button>
          <button
            onClick={() => onToggle(v.id)}
            disabled={isExpiredOrFull}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              isExpiredOrFull
                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                : isActive
                  ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            {isActive ? 'Tạm dừng' : 'Kích hoạt'}
          </button>
          <button
            onClick={() => onDelete(v)}
            className="p-2 rounded-xl bg-rose-50 text-rose-500 border border-rose-200 hover:bg-rose-100 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main VoucherManagement ───────────────────────────────────────────────────
export default function VoucherManagement() {
  const { vouchers, createVoucher, updateVoucher, toggleStatus, deleteVoucher, getStats } = useVoucherController();
  const stats = getStats();

  const [search, setSearch]           = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType]   = useState('all'); // 'all' | 'event' | 'normal'
  const [showForm, setShowForm]       = useState(false);
  const [editTarget, setEditTarget]   = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [toast, setToast]             = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const filtered = vouchers.filter(v => {
    const q = search.toLowerCase();
    const display = computeVoucherStatus(v);
    const matchSearch = !q || v.code.toLowerCase().includes(q) || v.name.toLowerCase().includes(q) || (v.eventTag || '').toLowerCase().includes(q);
    const matchStatus = filterStatus === 'all' || display === filterStatus;
    const matchType   = filterType === 'all' || (filterType === 'event' ? !!v.eventTag : !v.eventTag);
    return matchSearch && matchStatus && matchType;
  });

  // Group: event vouchers on top
  const eventVouchers  = filtered.filter(v => !!v.eventTag);
  const normalVouchers = filtered.filter(v => !v.eventTag);

  const handleSave = (form) => {
    if (editTarget) {
      const res = updateVoucher(editTarget.id, form);
      if (res.success) { setEditTarget(null); showToast('Đã cập nhật voucher thành công!'); }
      return res;
    } else {
      const res = createVoucher(form);
      if (res.success) { setShowForm(false); showToast(`Đã tạo voucher ${res.voucher.code}!`); }
      return res;
    }
  };

  const handleToggle = (id) => {
    const res = toggleStatus(id);
    if (res.success) showToast('Đã cập nhật trạng thái voucher.');
    else showToast(res.error, 'error');
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    const res = deleteVoucher(deleteTarget.id);
    if (res.success) {
      setDeleteTarget(null);
      showToast('Đã xóa voucher.');
    } else {
      setDeleteError(res.error);
    }
  };

  const handleCopy = (code) => {
    navigator.clipboard?.writeText(code).then(() => showToast(`Đã copy mã ${code}!`, 'info'));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Quản lý Voucher</h2>
          <p className="text-sm text-slate-500 mt-1">Tạo và quản lý các chương trình khuyến mãi cho phòng khám</p>
        </div>
        <button
          onClick={() => { setEditTarget(null); setShowForm(true); }}
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-500 to-sky-500 text-white rounded-2xl font-bold text-sm shadow-md shadow-indigo-500/20 hover:shadow-lg hover:-translate-y-0.5 transition-all border-none cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Tạo voucher mới
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Tổng voucher',   value: stats.total,      color: 'indigo',  icon: Ticket },
          { label: 'Đang hoạt động', value: stats.active,     color: 'emerald', icon: CheckCircle2 },
          { label: 'Tạm dừng',       value: stats.paused,     color: 'amber',   icon: Clock },
          { label: 'Hết hạn',        value: stats.expired,    color: 'rose',    icon: AlertCircle },
          { label: 'Tổng lượt dùng', value: stats.totalUsage, color: 'sky',     icon: TrendingUp },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className={`bg-${s.color}-50 border border-${s.color}-100 rounded-2xl p-4 text-center cursor-pointer hover:shadow-sm transition-all`}
            onClick={() => setFilterStatus(
              s.label === 'Đang hoạt động' ? 'Hoạt động' :
              s.label === 'Tạm dừng' ? 'Tạm dừng' :
              s.label === 'Hết hạn' ? 'Hết hạn' : 'all'
            )}
          >
            <s.icon className={`w-5 h-5 text-${s.color}-500 mx-auto mb-1.5`} />
            <p className={`text-2xl font-black text-${s.color}-700`}>{s.value}</p>
            <p className="text-[10px] font-semibold text-slate-500 mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 items-center bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm mã voucher hoặc tên chương trình..."
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
          />
        </div>

        {/* Type filter */}
        <div className="flex items-center gap-1.5">
          {[
            { key: 'all',    label: 'Tất cả' },
            { key: 'event',  label: '🎉 Sự kiện' },
            { key: 'normal', label: '🏷️ Thường' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setFilterType(t.key)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border-none transition-all cursor-pointer ${
                filterType === t.key
                  ? 'bg-indigo-500 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {['all', 'Hoạt động', 'Tạm dừng', 'Hết hạn', 'Hết lượt'].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border-none transition-all cursor-pointer ${
                filterStatus === s
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s === 'all' ? 'Mọi trạng thái' : s}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-400 font-medium ml-auto">
          {filtered.length}/{vouchers.length} voucher
        </span>
      </div>

      {/* ── Event Vouchers section ── */}
      {eventVouchers.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest px-3 flex items-center gap-1.5">
              🎉 Khuyến mãi sự kiện đặc biệt
              <span className="bg-indigo-100 text-indigo-700 rounded-full px-2 py-0.5 font-black">{eventVouchers.length}</span>
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {eventVouchers.map((v, idx) => (
              <VoucherCard
                key={v.id} v={v} idx={idx}
                onEdit={(v) => { setEditTarget(v); setShowForm(true); }}
                onToggle={handleToggle}
                onDelete={(v) => { setDeleteTarget(v); setDeleteError(''); }}
                onCopy={handleCopy}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Regular Vouchers section ── */}
      {normalVouchers.length > 0 && (
        <div>
          {eventVouchers.length > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest px-3 flex items-center gap-1.5">
                🏷️ Voucher thông thường
                <span className="bg-slate-100 text-slate-600 rounded-full px-2 py-0.5 font-black">{normalVouchers.length}</span>
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {normalVouchers.map((v, idx) => (
              <VoucherCard
                key={v.id} v={v} idx={idx}
                onEdit={(v) => { setEditTarget(v); setShowForm(true); }}
                onToggle={handleToggle}
                onDelete={(v) => { setDeleteTarget(v); setDeleteError(''); }}
                onCopy={handleCopy}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-16 bg-white border border-dashed border-slate-200 rounded-2xl">
          <Ticket className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500 font-semibold">Không tìm thấy voucher nào.</p>
          <p className="text-xs text-slate-400 mt-1">Hãy tạo voucher mới để bắt đầu chương trình khuyến mãi!</p>
          <button
            onClick={() => { setEditTarget(null); setShowForm(true); }}
            className="mt-4 px-5 py-2.5 bg-indigo-500 text-white rounded-xl font-bold text-sm border-none cursor-pointer hover:bg-indigo-600 transition-all"
          >
            + Tạo voucher đầu tiên
          </button>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {(showForm || editTarget) && (
          <VoucherFormModal
            initial={editTarget}
            onClose={() => { setShowForm(false); setEditTarget(null); }}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteTarget && (
          <DeleteModal
            voucher={deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onConfirm={handleDeleteConfirm}
            error={deleteError}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
