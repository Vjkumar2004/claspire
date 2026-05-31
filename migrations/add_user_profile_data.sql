ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS profile_data jsonb DEFAULT '{}'::jsonb;
