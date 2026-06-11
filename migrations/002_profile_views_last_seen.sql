-- Profile Views table for tracking who viewed whose profile
CREATE TABLE IF NOT EXISTS public.profile_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  viewed_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Prevent duplicate views within 24 hours
CREATE UNIQUE INDEX IF NOT EXISTS idx_profile_views_viewer_viewed_date
  ON public.profile_views (viewer_id, viewed_user_id, (created_at::date));

-- Quick count queries for a given user's total views
CREATE INDEX IF NOT EXISTS idx_profile_views_viewed_user_id
  ON public.profile_views (viewed_user_id);

-- Recent visitors lookup (latest first)
CREATE INDEX IF NOT EXISTS idx_profile_views_viewed_user_created
  ON public.profile_views (viewed_user_id, created_at DESC);

-- Check if a specific viewer already viewed today (for the unique index above)

-- Add last_seen column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_seen timestamptz;

-- Index for last_seen queries (active users, etc.)
CREATE INDEX IF NOT EXISTS idx_users_last_seen ON public.users (last_seen DESC);

-- Enable RLS on profile_views
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

-- Policies:
-- Anyone authenticated can insert (handled by service role in API, but policy for direct access)
CREATE POLICY "Users can insert their own profile views"
  ON public.profile_views FOR INSERT
  TO authenticated
  WITH CHECK (viewer_id = auth.uid());

-- Users can see who viewed their own profile
CREATE POLICY "Users can view their own profile visitors"
  ON public.profile_views FOR SELECT
  TO authenticated
  USING (viewed_user_id = auth.uid());

-- Users can see profiles they viewed
CREATE POLICY "Users can see profiles they viewed"
  ON public.profile_views FOR SELECT
  TO authenticated
  USING (viewer_id = auth.uid());
