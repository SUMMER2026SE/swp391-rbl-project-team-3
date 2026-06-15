-- Migration: add reschedule tracking to appointments
-- Enables the "đổi lịch tối đa 2 lần" (max 2 reschedules) rule, which the
-- frontend already checks via AppointmentModel.reschedule().
--
-- HOW TO APPLY: paste into Supabase Dashboard → SQL Editor → Run.
-- (DDL cannot be executed with the anon key, so the app cannot run this itself.)
-- The code is resilient: reschedule keeps working before this runs, and count
-- tracking turns on automatically once the column exists.

alter table public.appointments
  add column if not exists reschedule_count integer not null default 0;

comment on column public.appointments.reschedule_count
  is 'Number of times the patient has rescheduled this appointment (max 2 enforced in app).';
