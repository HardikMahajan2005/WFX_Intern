-- ============================================================
-- Add confidence_score and reasoning columns to query_logs
-- ============================================================

ALTER TABLE public.query_logs ADD COLUMN IF NOT EXISTS confidence_score integer;
ALTER TABLE public.query_logs ADD COLUMN IF NOT EXISTS reasoning text;
