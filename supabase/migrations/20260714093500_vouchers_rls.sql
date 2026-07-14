-- ============================================================================
-- RLS for vouchers — the table had RLS DISABLED while anon/authenticated held
-- full DML grants, so anyone with the public anon key could rewrite or delete
-- promotions (e.g. set discount_value = 100%).
--
-- Access matrix (frontend-audited):
--   SELECT  → everyone. Voucher codes/discounts are public promo data with no
--             PII; the cashier desk, patient invoice views and the landing/
--             chatbot surfaces all read them (some pre-login).
--   INSERT  → admin only (VoucherManagement).
--   UPDATE  → admin (management) + receptionist (BillingCheckout increments
--             "usageCount" after a settlement).
--   DELETE  → admin only.
-- Staff detection reuses the SECURITY DEFINER helper public.current_role_id()
-- (1 ADMIN · 4 RECEPTIONIST) introduced in 20260712093426.
-- ============================================================================

alter table public.vouchers enable row level security;

drop policy if exists "vouchers_select_public" on public.vouchers;
drop policy if exists "vouchers_insert_admin"  on public.vouchers;
drop policy if exists "vouchers_update_staff"  on public.vouchers;
drop policy if exists "vouchers_delete_admin"  on public.vouchers;

create policy "vouchers_select_public" on public.vouchers
  for select using (true);

create policy "vouchers_insert_admin" on public.vouchers
  for insert with check (public.current_role_id() = 1);

create policy "vouchers_update_staff" on public.vouchers
  for update using (public.current_role_id() in (1, 4));

create policy "vouchers_delete_admin" on public.vouchers
  for delete using (public.current_role_id() = 1);
