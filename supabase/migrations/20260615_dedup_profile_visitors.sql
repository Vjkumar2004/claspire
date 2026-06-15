-- Create a function to get profile visitors deduplicated at the database level.
-- Each visitor appears only once, with their most recent visit timestamp.
-- Run this in Supabase SQL editor or via migration.

create or replace function get_profile_visitors(target_user_id uuid)
returns table (
  viewer_id uuid,
  created_at timestamptz,
  viewer jsonb
)
language sql stable
as $$
  select distinct on (pv.viewer_id)
    pv.viewer_id,
    pv.created_at,
    jsonb_build_object(
      'id', u.id,
      'full_name', u.full_name,
      'unique_id', u.unique_id,
      'avatar_url', u.avatar_url,
      'role', u.role
    ) as viewer
  from profile_views pv
  left join users u on u.id = pv.viewer_id
  where pv.viewed_user_id = target_user_id
  order by pv.viewer_id, pv.created_at desc
  limit 20;
$$;
