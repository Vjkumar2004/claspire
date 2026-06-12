import { createClient } from '@supabase/supabase-js'

// Create a single Supabase client for both client and server side
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// NOTE: This uses NEXT_PUBLIC_SUPABASE_ANON_KEY, NOT a privileged service-role key.
// It has the same row-level security restrictions as the public client.
// Renamed from supabaseAdmin to avoid implying admin privileges.
// If admin-level access is needed, create a dedicated client with SUPABASE_SECRET_KEY.
export const supabaseAnonClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
