-- Add claimed_by and claimed_at columns to colleges table
-- These columns track when a college page has been claimed by an official representative

ALTER TABLE public.colleges
ADD COLUMN IF NOT EXISTS claimed_by uuid REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS claimed_at timestamp with time zone;

-- Add comment to document the purpose
COMMENT ON COLUMN public.colleges.claimed_by IS 'User ID of the official representative who claimed this college page';
COMMENT ON COLUMN public.colleges.claimed_at IS 'Timestamp when the college was claimed by an official representative';
