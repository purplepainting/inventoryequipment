-- Add type column to tools table
ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS type TEXT;
