// ─────────────────────────────────────────────────────────────────────────────
// Shared front-desk helpers for the Receptionist portal.
//
// Appointments reach the UI via AppointmentModel.mapAppointment, which spreads the
// raw snake_case row AND adds a few camelCase aliases — so the same record can
// expose `patient_name` OR `patientName`, `service` OR `service_name`, etc.
// `normalizeApt` collapses that into one predictable shape so the Queue and
// Billing modules never have to guess which key is present.
//
// It also produces a guaranteed-unique React `key` (id + index) so lists never
// collide when an `appointment_id` is missing (the classic "undefined id key" bug).
// ─────────────────────────────────────────────────────────────────────────────

// "Today" for the reception portal — the real current date (local), so the
// queue/billing tabs reflect appointments actually scheduled for today, in sync
// with the other portals which use the live Date. (Previously hardcoded to a
// fixed seed date, which hid real same-day appointments.)
export const TODAY_STR = (() => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
})();

// Canonical appointment lifecycle vocabulary (Vietnamese), matching the strings
// AppointmentModel.normalizeStatus emits. We do NOT invent new DB values.
export const APT_STATUS = {
  REQUEST: 'Chờ xác nhận',   // patient-submitted booking awaiting reception approval
  CONFIRMED: 'Đã xác nhận',  // approved, patient not yet arrived
  CHECKED_IN: 'Đang chờ',    // arrived / in clinic (Doctor portal reads this as its queue)
  EXAMINED: 'Đã khám',       // consultation finished → awaiting payment
  PAID: 'Đã thanh toán',     // fully settled
  CANCELLED: 'Đã hủy',
};

export function parseFee(fee, fallback = 0) {
  if (fee === null || fee === undefined) return fallback;
  if (typeof fee === 'number') return Number.isFinite(fee) ? fee : fallback;
  const digits = String(fee).replace(/[^0-9]/g, '');
  const n = parseInt(digits, 10);
  return Number.isFinite(n) ? n : fallback;
}

export function formatVnd(n) {
  return `${Number(n || 0).toLocaleString('vi-VN')} đ`;
}

export function normalizeApt(a = {}, index = 0) {
  const id = a.appointment_id ?? a.id ?? `apt-${index}`;
  return {
    raw: a,
    aptId: id,
    // Composite key: even if two rows share a missing/duplicate id, the index
    // keeps the React key unique.
    key: `${id}::${index}`,
    patientId: a.patient_id ?? a.patientId ?? null,
    patientName: a.patient_name ?? a.patientName ?? 'Khách hàng',
    phone: a.phone ?? a.patient_phone ?? '',
    doctorId: a.doctor_id ?? a.doctorId ?? null,
    doctorName: a.doctor_name ?? a.doctorName ?? 'Chưa phân công',
    serviceId: a.service_id ?? a.serviceId ?? '',
    serviceName: a.service_name ?? a.service ?? 'Khám da liễu tổng quát',
    date: a.appointment_date ?? a.date ?? '',
    time: String(a.start_time ?? a.time ?? '').slice(0, 5),
    fee: a.fee ?? '300,000 VNĐ',
    status: a.status ?? '',
    patientEmail: a.patient_email ?? a.patientEmail ?? '',
  };
}

// Booking deposit already prepaid against an appointment. Only the
// `deposit_amount` portion of the accumulated payments row counts — reschedule
// surcharges also live in that row (final_amount) but are extra charges, not
// prepayments, so they must NOT reduce the bill. Used by Billing to show the
// remaining balance to collect.
export function depositPaidFor(aptId, payments = []) {
  if (!aptId || !Array.isArray(payments)) return 0;
  return payments
    .filter((p) => String(p.appointment_id ?? p.appointmentId) === String(aptId))
    .reduce((sum, p) => sum + parseFee(p.deposit_amount, 0), 0);
}

// Compute the discount a voucher grants on `amount`, honoring percentage caps and
// clamping so a discount never exceeds the bill. Returns { discount, finalAmount }.
export function computeVoucherDiscount(voucher, amount) {
  if (!voucher) return { discount: 0, finalAmount: amount };
  const value = Number(voucher.discountValue ?? voucher.discount_value ?? 0);
  const isPercent =
    voucher.discountType === 'Percentage' || voucher.discount_type === 'Percentage';

  let discount = isPercent ? (amount * value) / 100 : value;

  if (isPercent) {
    const cap = Number(voucher.maxDiscountAmount ?? voucher.max_discount_amount ?? 0);
    if (cap > 0 && discount > cap) discount = cap;
  }
  if (discount > amount) discount = amount;
  discount = Math.max(0, Math.round(discount));
  return { discount, finalAmount: Math.max(0, amount - discount) };
}

// Validate that a voucher can be applied to a given service/amount on `dateStr`.
// Returns { ok: true } or { ok: false, reason }.
export function validateVoucher(voucher, { amount, serviceId, dateStr = TODAY_STR }) {
  if (!voucher) return { ok: false, reason: 'Mã giảm giá không tồn tại.' };

  const active =
    voucher.isActive === true ||
    voucher.status === 'ACTIVE' ||
    voucher.status === 'Hoạt động';
  if (!active) return { ok: false, reason: 'Mã giảm giá đã ngừng hoạt động.' };

  const from = voucher.validFrom ?? voucher.start_date;
  const to = voucher.validTo ?? voucher.end_date;
  if (from && from > dateStr) return { ok: false, reason: 'Mã giảm giá chưa tới ngày áp dụng.' };
  if (to && to < dateStr) return { ok: false, reason: 'Mã giảm giá đã hết hạn.' };

  const used = Number(voucher.usageCount ?? 0);
  const max = Number(voucher.maxUsage ?? voucher.max_usage ?? 0);
  if (max > 0 && used >= max) return { ok: false, reason: 'Mã giảm giá đã hết lượt sử dụng.' };

  const min = Number(voucher.minOrderAmount ?? voucher.min_order_amount ?? 0);
  if (amount < min) {
    return { ok: false, reason: `Hóa đơn tối thiểu ${formatVnd(min)} để dùng mã này.` };
  }

  // applicableServices may be an array, a JSON string, or a comma list. Empty = all.
  let services = voucher.applicableServices ?? voucher.applicable_services ?? [];
  if (typeof services === 'string') {
    const trimmed = services.trim();
    if (trimmed.startsWith('[')) {
      try { services = JSON.parse(trimmed); } catch { services = []; }
    } else if (trimmed) {
      services = trimmed.split(',').map((s) => s.trim());
    } else {
      services = [];
    }
  }
  if (Array.isArray(services) && services.length > 0 && serviceId && !services.includes(serviceId)) {
    return { ok: false, reason: 'Mã giảm giá không áp dụng cho dịch vụ này.' };
  }

  return { ok: true };
}
