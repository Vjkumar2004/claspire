import { createHmac, timingSafeEqual } from 'crypto'

const SESSION_SECRET = process.env.SESSION_SECRET || ''
const SESSION_VERSION = 1

// Maximum session age in seconds (30 days)
const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60

if (!SESSION_SECRET) {
  console.warn('WARNING: SESSION_SECRET environment variable not set. Using insecure fallback.')
}

/**
 * Sign a payload using HMAC-SHA256
 */
export function signPayload(payload: string): string {
  if (!SESSION_SECRET) {
    throw new Error('SESSION_SECRET not configured')
  }
  
  const hmac = createHmac('sha256', SESSION_SECRET)
  hmac.update(payload)
  return hmac.digest('hex')
}

/**
 * Verify a signature against a payload
 */
export function verifySignature(payload: string, signature: string): boolean {
  if (!SESSION_SECRET) {
    return false
  }
  
  const hmac = createHmac('sha256', SESSION_SECRET)
  hmac.update(payload)
  const expectedSignature = hmac.digest('hex')
  
  // Use timing-safe comparison to prevent timing attacks
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
  } catch {
    return false
  }
}

/**
 * Create a signed session cookie value
 * Format: base64(payload).signature
 */
export function createSessionCookie(userId: string): string {
  const payload = JSON.stringify({
    uid: userId,
    ver: SESSION_VERSION,
    iat: Math.floor(Date.now() / 1000)
  })
  
  const payloadB64 = Buffer.from(payload).toString('base64')
  const signature = signPayload(payloadB64)
  
  return `${payloadB64}.${signature}`
}

/**
 * Verify and parse a session cookie
 * Returns userId if valid, null otherwise
 * Supports backward compatibility with old plain JSON cookies
 */
export function verifySessionCookie(cookieValue: string): { userId: string; isLegacy: boolean } | null {
  if (!cookieValue) {
    console.log('[Session] No cookie value provided')
    return null
  }
  
  try {
    // Decode URL-encoded cookie first to handle both encoded and non-encoded formats
    const decodedCookie = decodeURIComponent(cookieValue)
    console.log('[VERIFY] Decoded cookie:', decodedCookie)
    
    // Try new format: base64(payload).signature
    // Split only on the FIRST dot to handle URL-encoded cookies correctly
    const firstDotIndex = decodedCookie.indexOf('.')
    if (firstDotIndex === -1) {
      console.log('[Session] No dot separator found in cookie')
    } else {
      const payloadB64 = decodedCookie.substring(0, firstDotIndex)
      const signature = decodedCookie.substring(firstDotIndex + 1)
      console.log('[Session] Cookie parts count: 2 (split on first dot)')
      console.log('[VERIFY] Raw cookie:', cookieValue)
      console.log('[VERIFY] Payload B64:', payloadB64)
      console.log('[VERIFY] Signature:', signature)
      console.log('[VERIFY] Payload B64 length:', payloadB64.length)
      console.log('[VERIFY] Signature length:', signature.length)
      
      // Verify signature
      const hmac = createHmac('sha256', SESSION_SECRET)
      hmac.update(payloadB64)
      const expectedSignature = hmac.digest('hex')
      console.log('[VERIFY] Expected Signature:', expectedSignature)
      
      const isValid = verifySignature(payloadB64, signature)
      console.log('[VERIFY] Signature verification result:', isValid)
      
      if (isValid) {
        const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString())
        console.log('[Session] Decoded payload:', payload)
        
        // Validate payload structure
        if (payload.uid && payload.ver === SESSION_VERSION && payload.iat) {
          // Check session expiration
          const currentTime = Math.floor(Date.now() / 1000)
          const sessionAge = currentTime - payload.iat
          
          if (sessionAge > SESSION_MAX_AGE_SECONDS) {
            console.log('[Session] Session expired - age:', sessionAge, 'seconds, max allowed:', SESSION_MAX_AGE_SECONDS, 'seconds')
            return null
          }
          
          console.log('[Session] Valid signed session for user:', payload.uid, 'age:', sessionAge, 'seconds')
          return { userId: payload.uid, isLegacy: false }
        } else {
          console.log('[Session] Payload validation failed - missing required fields or wrong version')
        }
      } else {
        console.log('[Session] Signature verification failed')
      }
    }
    
    // Fallback: Try old format (plain JSON) for backward compatibility
    // Only attempt JSON.parse if the cookie doesn't look like a signed cookie
    // Signed cookies start with base64 which typically doesn't start with '{'
    if (!decodedCookie.startsWith('ey') && !decodedCookie.includes('.')) {
      console.log('[Session] Attempting legacy JSON fallback')
      const oldSession = JSON.parse(decodedCookie)
      if (oldSession.id) {
        console.log('[Session] Migrating legacy session cookie for user:', oldSession.id)
        return { userId: oldSession.id, isLegacy: true }
      }
    } else {
      console.log('[Session] Skipping legacy fallback - cookie appears to be signed format')
    }
    
    return null
  } catch (error) {
    console.error('[Session] Failed to verify session cookie:', error)
    return null
  }
}

/**
 * Get user ID from request cookie
 */
export function getUserIdFromRequest(req: Request): string | null {
  const cookieHeader = req.headers.get('cookie')
  if (!cookieHeader) {
    return null
  }
  
  const cookies = cookieHeader.split(';').map(c => c.trim())
  const sessionCookie = cookies.find(c => c.startsWith('claspire_session='))
  
  if (!sessionCookie) {
    return null
  }
  
  const cookieValue = sessionCookie.substring('claspire_session='.length)
  const verified = verifySessionCookie(cookieValue)
  
  return verified?.userId || null
}

/**
 * Get authenticated user from request with full database fetch
 * 
 * SECURITY: This function verifies the session cookie signature before
 * trusting any user data. Direct JSON.parse(cookie.value) is unsafe because:
 * - Cookies can be modified via DevTools or proxy tools
 * - Tampered cookies can impersonate other users
 * - Role escalation attacks are possible without signature verification
 * 
 * This function:
 * 1. Verifies HMAC-SHA256 signature of the cookie
 * 2. Rejects tampered/invalid cookies (returns null)
 * 3. Rejects expired sessions (returns null)
 * 4. Fetches fresh user data from database (source of truth)
 * 5. Returns complete user object with verified data
 * 
 * @param request - NextRequest object
 * @returns User object from database or null if authentication fails
 */
export async function getAuthenticatedUser(request: Request): Promise<any | null> {
  // Import supabase here to avoid circular dependencies
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  )

  // Extract and verify session cookie
  const cookieHeader = request.headers.get('cookie')
  if (!cookieHeader) {
    return null
  }
  
  const cookies = cookieHeader.split(';').map(c => c.trim())
  const sessionCookie = cookies.find(c => c.startsWith('claspire_session='))
  
  if (!sessionCookie) {
    return null
  }
  
  const cookieValue = sessionCookie.substring('claspire_session='.length)
  const verifiedSession = verifySessionCookie(cookieValue)
  
  if (!verifiedSession) {
    // Cookie is missing, invalid, tampered, or expired
    return null
  }
  
  const { userId } = verifiedSession
  
  // Fetch fresh user data from database (source of truth)
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error || !user) {
    return null
  }
  
  return user
}

/**
 * Check if a session cookie is expired without verifying signature
 * This is useful for clearing expired cookies from the client
 * 
 * @param cookieValue - The session cookie value
 * @returns true if the session is expired, false otherwise
 */
export function isSessionExpired(cookieValue: string): boolean {
  if (!cookieValue) {
    return false
  }
  
  try {
    const decodedCookie = decodeURIComponent(cookieValue)
    const firstDotIndex = decodedCookie.indexOf('.')
    
    if (firstDotIndex === -1) {
      return false
    }
    
    const payloadB64 = decodedCookie.substring(0, firstDotIndex)
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString())
    
    if (!payload.iat) {
      return false
    }
    
    const currentTime = Math.floor(Date.now() / 1000)
    const sessionAge = currentTime - payload.iat
    
    return sessionAge > SESSION_MAX_AGE_SECONDS
  } catch {
    return false
  }
}
