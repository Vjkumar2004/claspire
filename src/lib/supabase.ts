import { createClient } from '@supabase/supabase-js'

// ─── Token cache ────────────────────────────────────────────────────────────
// The JWT issued by /api/auth/supabase-token is valid for 3600s (1 hour).
// We cache it in memory and reuse it until 30s before it expires,
// reducing round-trips from N-per-page-load to ~1 per hour.
let _rawProvider: (() => Promise<string | null>) | null = null
let _cachedToken: string | null = null
let _tokenExpiry: number = 0  // Unix seconds

const isDev = process.env.NODE_ENV === 'development'

function clearCache() {
  _cachedToken = null
  _tokenExpiry = 0
}

/**
 * Register an async function that fetches a fresh JWT from the server.
 * Pass null to clear the provider and cache (e.g. on logout).
 */
export function setAccessTokenProvider(
  provider: (() => Promise<string | null>) | null
) {
  _rawProvider = provider
  // Always clear the cache when the provider changes (incl. logout)
  clearCache()
  if (isDev) {
    console.debug('[supabase-token] provider updated, cache cleared')
  }
}

/**
 * Returns a cached JWT, refreshing it only when within 30s of expiry.
 * Called by the Supabase JS client on every query via the `accessToken` hook.
 */
async function getCachedAccessToken(): Promise<string | null> {
  if (!_rawProvider) return null

  const nowSecs = Date.now() / 1000
  const secsUntilExpiry = _tokenExpiry - nowSecs

  // Cache HIT: token is still valid for more than 30s
  if (_cachedToken && secsUntilExpiry > 30) {
    if (isDev) {
      console.debug(
        `[supabase-token] cache HIT — expires in ${Math.round(secsUntilExpiry)}s`
      )
    }
    return _cachedToken
  }

  // Cache MISS: fetch a fresh token
  if (isDev) {
    const reason = !_cachedToken ? 'no cached token' : `expires in ${Math.round(secsUntilExpiry)}s`
    console.debug(`[supabase-token] cache MISS (${reason}) — fetching fresh token`)
  }

  const token = await _rawProvider()
  if (token) {
    _cachedToken = token
    // JWT exp is now + 3600 (set by /api/auth/supabase-token)
    _tokenExpiry = nowSecs + 3600
    if (isDev) {
      console.debug('[supabase-token] new token cached, valid for 3600s')
    }
  }

  return token
}

// ─── Supabase clients ────────────────────────────────────────────────────────

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    accessToken: getCachedAccessToken,
  }
)

// NOTE: This uses NEXT_PUBLIC_SUPABASE_ANON_KEY, NOT a privileged service-role key.
// It has the same row-level security restrictions as the public client.
// Renamed from supabaseAdmin to avoid implying admin privileges.
// If admin-level access is needed, create a dedicated client with SUPABASE_SECRET_KEY.
export const supabaseAnonClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
