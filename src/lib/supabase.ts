import { createClient } from '@supabase/supabase-js'

let getAccessToken: (() => Promise<string | null>) | null = null

export function setAccessTokenProvider(provider: () => Promise<string | null>) {
  getAccessToken = provider
}

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    accessToken: async () => {
      if (getAccessToken) {
        return getAccessToken()
      }
      return null
    }
  }
)

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
