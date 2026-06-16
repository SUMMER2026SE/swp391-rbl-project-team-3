-- Migration: 2026-06-16 add voucher columns the admin form persists
-- (non-destructive, idempotent). The VoucherManagement form collects these
-- fields but the table lacked columns for them, so creates failed. validFrom/
-- validTo reuse the existing start_date/end_date columns (handled in the model
-- mapping layer); these are the genuinely-missing ones.
alter table public.vouchers
  add column if not exists code                text,
  add column if not exists name                text,
  add column if not exists description         text,
  add column if not exists max_discount_amount numeric,
  add column if not exists min_order_amount    numeric,
  add column if not exists applicable_services jsonb default '[]'::jsonb,
  add column if not exists max_usage           integer,
  add column if not exists per_user_limit      integer default 1,
  add column if not exists event_tag           text;
