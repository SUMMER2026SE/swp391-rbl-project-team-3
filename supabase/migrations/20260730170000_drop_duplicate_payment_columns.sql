-- ============================================================================
-- ⚠️  CHUA AP DUNG — CHI CHAY SAU KHI FRONTEND DA DEPLOY LEN VERCEL
--
-- Xoa 2 cot TRUNG LAP cua bang payments:
--     payments.method  === payments.payment_method
--     payments.status  === payments.payment_status
--
-- TAI SAO PHAI CHO DEPLOY TRUOC:
--   Ban frontend dang chay tren Vercel VAN dang ghi `method` va `status` trong
--   AppointmentModel.addPayment(). Neu DROP cot truoc khi deploy, PostgREST se
--   tra loi "column payments.method does not exist" va MOI GIAO DICH THANH TOAN
--   SE THAT BAI — le tan khong thu tien duoc.
--
--   Thu tu bat buoc:
--     1. (xong) Sua code + 3 RPC guest de ngung ghi 2 cot nay
--     2. git push  ->  Vercel build & deploy xong
--     3. MOI chay migration nay
--
-- DA KIEM CHUNG TRUOC KHI VIET (2026-07-30):
--   * 42/42 dong: payment_method & payment_status deu co gia tri
--   * 0 dong co du lieu chi nam o `method`/`status` (khong mat thong tin)
--   * 0 view, 0 index phu thuoc 2 cot nay
--   * Moi cho doc trong code deu dung cot chuan hoac da co fallback:
--       - RevenueStatistics.jsx : p.payment_method || p.method
--       - BillingCheckout.jsx   : paidRecord?.payment_method
--       - AppointmentsTab.jsx   : payment?.payment_method
-- ============================================================================

alter table public.payments drop column if exists method;
alter table public.payments drop column if exists status;
