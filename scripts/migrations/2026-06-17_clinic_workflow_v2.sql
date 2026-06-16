-- Migration: 2026-06-17 clinic workflow enhancements v2

-- 1. Update medical_records
ALTER TABLE public.medical_records
  ADD COLUMN IF NOT EXISTS appointment_id bigint REFERENCES public.appointments(appointment_id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS diagnosis text,
  ADD COLUMN IF NOT EXISTS follow_up_date date;

-- 2. Create prescriptions
CREATE TABLE IF NOT EXISTS public.prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medical_record_id bigint REFERENCES public.medical_records(id) ON DELETE CASCADE,
  medicine_name text NOT NULL,
  dosage text NOT NULL,
  quantity integer NOT NULL,
  instructions text,
  created_at timestamptz DEFAULT now()
);

-- 3. Create service_tickets
CREATE TABLE IF NOT EXISTS public.service_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id bigint REFERENCES public.appointments(appointment_id) ON DELETE CASCADE,
  service_name text NOT NULL,
  status text NOT NULL DEFAULT 'PENDING',
  technician_id text,
  result_notes text,
  result_image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. Create invoices
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id bigint REFERENCES public.appointments(appointment_id) ON DELETE CASCADE,
  patient_id text NOT NULL,
  total_amount numeric(12, 2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'UNPAID',
  payment_method text,
  transaction_id text,
  created_at timestamptz DEFAULT now(),
  paid_at timestamptz
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_medical_records_appointment ON public.medical_records(appointment_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_record ON public.prescriptions(medical_record_id);
CREATE INDEX IF NOT EXISTS idx_service_tickets_appointment ON public.service_tickets(appointment_id);
CREATE INDEX IF NOT EXISTS idx_invoices_appointment ON public.invoices(appointment_id);
CREATE INDEX IF NOT EXISTS idx_invoices_patient ON public.invoices(patient_id);

-- Row Level Security (RLS)
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Permissive policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prescriptions' AND policyname = 'prescriptions_all_access') THEN
    CREATE POLICY prescriptions_all_access ON public.prescriptions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'service_tickets' AND policyname = 'service_tickets_all_access') THEN
    CREATE POLICY service_tickets_all_access ON public.service_tickets FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'invoices' AND policyname = 'invoices_all_access') THEN
    CREATE POLICY invoices_all_access ON public.invoices FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.prescriptions TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_tickets TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO anon, authenticated;
