-- Add position column to project files for per-image framing
ALTER TABLE public."ProjectFile"
  ADD COLUMN IF NOT EXISTS position varchar(16) NOT NULL DEFAULT 'center';

UPDATE public."ProjectFile"
SET position = 'center'
WHERE position IS NULL;
