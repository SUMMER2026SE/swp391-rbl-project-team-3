-- Migration: 2026-06-24 Add structured result columns to service_tickets
-- The technician workspace captures per-metric lab values and a multi-image set,
-- but completion previously only persisted result_notes + a single result_image_url.
-- These JSONB columns let the entered metrics and the full image set survive the
-- round-trip so the "Xem lại kết quả" (review) UI can rehydrate them.

ALTER TABLE public.service_tickets
  ADD COLUMN IF NOT EXISTS result_metrics jsonb,  -- { "<metric name>": "<value>", ... } (may include "fallbackResult")
  ADD COLUMN IF NOT EXISTS result_images  jsonb;  -- [ { id, url, name, timestamp }, ... ]
