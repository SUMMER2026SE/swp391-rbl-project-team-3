-- Migration: 2026-06-24 Add procedure_details to service_tickets
-- Stores the doctor-specified lab metric configuration for a service ticket so
-- the technician workspace can render the correct metric-entry grid, e.g.:
--   { "type": "LabTest", "metrics": ["Đường huyết", "Men gan"] }

ALTER TABLE public.service_tickets
  ADD COLUMN IF NOT EXISTS procedure_details jsonb;
