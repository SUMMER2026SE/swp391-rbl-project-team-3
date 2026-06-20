-- Migration: 2026-06-20 Add doctor_note to service_tickets
-- Add the doctor_note column to service_tickets so technicians can see specific notes/requests from doctors.

ALTER TABLE public.service_tickets 
  ADD COLUMN IF NOT EXISTS doctor_note text;
