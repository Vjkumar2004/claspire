/**
 * Production-grade rate limiting using Upstash Redis
 * 
 * This provides distributed rate limiting that works across:
 * - Multiple server instances
 * - Serverless environments (Vercel)
 * - Server restarts
 * 
 * Uses the sliding window algorithm with Redis INCR and EXPIRE
 */

import { Redis } from '@upstash/redis'

// Initialize Redis client
let redis: Redis | null = null

function getRedisClient(): Redis {
  if (!redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL
    const token = process.env.UPSTASH_REDIS_REST_TOKEN

    if (!url || !token) {
      console.warn('WARNING: Upstash Redis credentials not configured. Rate limiting will be disabled.')
      throw new Error('Upstash Redis not configured')
    }

    redis = new Redis({
      url,
      token,
    })
  }

  return redis
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number // Unix timestamp in seconds
  resetTime?: number // Unix timestamp in milliseconds (for backward compatibility)
}

export interface RateLimitConfig {
  identifier: string
  limit: number // Maximum requests
  window: number // Time window in seconds
}

/**
 * Check rate limit using sliding window algorithm
 * 
 * @param config - Rate limit configuration
 * @returns Rate limit result with success status and metadata
 */
export async function rateLimit(config: RateLimitConfig): Promise<RateLimitResult> {
  const { identifier, limit, window } = config

  try {
    const redis = getRedisClient()
    const now = Math.floor(Date.now() / 1000) // Current time in seconds
    const windowStart = now - window
    const key = `ratelimit:${identifier}`

    // Use Redis pipeline for atomic operations
    const pipeline = redis.pipeline()

    // Remove entries outside the current window
    pipeline.zremrangebyscore(key, 0, windowStart)

    // Count requests in current window
    pipeline.zcard(key)

    // Add current request
    pipeline.zadd(key, { score: now, member: `${now}-${Math.random()}` })

    // Set expiration to window + 1 second to ensure cleanup
    pipeline.expire(key, window + 1)

    const results = await pipeline.exec()

    if (!results) {
      throw new Error('Redis pipeline execution failed')
    }

    const count = results[1] as number
    const remaining = Math.max(0, limit - count)
    const reset = now + window

    return {
      success: count <= limit,
      limit,
      remaining,
      reset,
      resetTime: reset * 1000, // Convert to milliseconds for backward compatibility
    }
  } catch (error) {
    // If Redis is unavailable, fail open (allow request) to not break the app
    console.error('Rate limit error:', error)
    return {
      success: true,
      limit,
      remaining: limit,
      reset: Math.floor(Date.now() / 1000) + window,
      resetTime: Date.now() + window * 1000,
    }
  }
}

/**
 * Get client identifier from request
 * Uses IP address and user agent for better identification
 */
export function getClientIdentifier(req: Request): string {
  // Try to get IP from various headers (in order of preference)
  const forwarded = req.headers.get('x-forwarded-for')
  const realIp = req.headers.get('x-real-ip')
  const cfConnectingIp = req.headers.get('cf-connecting-ip')
  const ip = req.headers.get('x-client-ip')

  // Extract first IP from forwarded header (if present)
  const clientIp = forwarded?.split(',')[0]?.trim() || cfConnectingIp || realIp || ip || 'unknown'

  // For additional security, include User-Agent hash
  const userAgent = req.headers.get('user-agent') || 'unknown'

  return `${clientIp}:${userAgent}`
}

/**
 * Get user identifier from authenticated request
 * Returns user ID if authenticated, otherwise falls back to client identifier
 */
export async function getUserIdentifier(req: Request): Promise<string> {
  const { getAuthenticatedUser } = await import('./session')
  const user = await getAuthenticatedUser(req)

  if (user) {
    return `user:${user.id}`
  }

  return `ip:${getClientIdentifier(req)}`
}

/**
 * Rate limit presets for common use cases
 */
export const RateLimitPresets = {
  // Authentication endpoints
  login: { limit: 5, window: 60 }, // 5 requests per minute per IP
  signup: { limit: 3, window: 3600 }, // 3 requests per hour per IP
  passwordReset: { limit: 3, window: 3600 }, // 3 requests per hour per IP
  otp: { limit: 5, window: 900 }, // 5 requests per 15 minutes per IP

  // Content creation
  createPost: { limit: 10, window: 60 }, // 10 requests per minute per user
  sendMessage: { limit: 30, window: 60 }, // 30 requests per minute per user
  createComment: { limit: 20, window: 60 }, // 20 requests per minute per user

  // Voting
  vote: { limit: 100, window: 60 }, // 100 requests per minute per user

  // General API
  general: { limit: 100, window: 60 }, // 100 requests per minute per IP
}

/**
 * Apply rate limit to an endpoint
 * Returns NextResponse with 429 status if rate limited
 */
export async function applyRateLimit(
  req: Request,
  preset: keyof typeof RateLimitPresets | { limit: number; window: number },
  identifier?: string
): Promise<{ success: boolean; response?: Response }> {
  const config = typeof preset === 'string' ? RateLimitPresets[preset] : preset
  const id = identifier || getClientIdentifier(req)

  const result = await rateLimit({
    identifier: id,
    limit: config.limit,
    window: config.window,
  })

  if (!result.success) {
    return {
      success: false,
      response: new Response(
        JSON.stringify({
          error: 'Too many requests. Please try again later.',
          limit: result.limit,
          remaining: result.remaining,
          reset: result.reset,
          retryAfter: result.reset - Math.floor(Date.now() / 1000),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.reset.toString(),
            'Retry-After': (result.reset - Math.floor(Date.now() / 1000)).toString(),
          },
        }
      ),
    }
  }

  return { success: true }
}
