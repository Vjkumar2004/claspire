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

export function getRedisClient(): Redis {
  if (!redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL
    const token = process.env.UPSTASH_REDIS_REST_TOKEN

    if (!url || !token) {
      console.warn('WARNING: Upstash Redis credentials not configured. Redis features (rate limiting, presence, push throttling) will be disabled.')
    }

    // Always create a client, even without credentials, so getRedisClient() never throws
    // Redis operations will fail with network errors which callers should catch gracefully
    redis = new Redis({
      url: url || 'http://redis-not-configured.local',
      token: token || 'placeholder',
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
  login: { limit: 5, window: 600 }, // 5 requests per 10 minutes per IP
  signup: { limit: 3, window: 3600 }, // 3 requests per hour per IP
  passwordReset: { limit: 3, window: 3600 }, // 3 requests per hour per IP
  otp: { limit: 5, window: 900 }, // 5 requests per 15 minutes per IP
  otpVerify: { limit: 5, window: 900 }, // 5 attempts per 15 minutes per IP
  googleAuth: { limit: 5, window: 600 }, // 5 attempts per 10 minutes per IP
  checkAccount: { limit: 10, window: 600 }, // 10 requests per 10 minutes per IP

  // Content creation
  createPost: { limit: 10, window: 60 }, // 10 requests per minute per user
  sendMessage: { limit: 30, window: 60 }, // 30 requests per minute per user
  createComment: { limit: 20, window: 60 }, // 20 requests per minute per user
  createJob: { limit: 5, window: 3600 }, // 5 jobs per hour per user
  createGroup: { limit: 5, window: 3600 }, // 5 groups per hour per user

  // Messaging
  groupMessage: { limit: 10, window: 60 }, // 10 messages per minute per user
  messageRequest: { limit: 30, window: 3600 }, // 30 requests per hour per user

  // Uploads
  upload: { limit: 10, window: 3600 }, // 10 uploads per hour per user
  uploadResume: { limit: 5, window: 3600 }, // 5 uploads per hour per user

  // Network
  connect: { limit: 30, window: 3600 }, // 30 requests per hour per user
  follow: { limit: 50, window: 3600 }, // 50 actions per hour per user
  networkRespond: { limit: 30, window: 3600 }, // 30 actions per hour per user
  communityJoin: { limit: 20, window: 3600 }, // 20 joins per hour per user
  groupJoin: { limit: 20, window: 3600 }, // 20 joins per hour per user
  collegeClaim: { limit: 3, window: 3600 }, // 3 submissions per hour per user

  // Search
  search: { limit: 30, window: 60 }, // 30 requests per minute per IP

  // Admin
  adminCampaign: { limit: 3, window: 3600 }, // 3 campaigns per hour per admin

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

/**
 * Track failed OTP verification attempts with Redis
 * Locks out after threshold exceeded
 */
export async function checkOtpLockout(email: string): Promise<{ locked: boolean; remainingAttempts: number; lockoutDuration: number }> {
  try {
    const redis = getRedisClient()
    const lockoutKey = `otp_lockout:${email}`
    const attemptKey = `otp_attempts:${email}`

    // Check if account is currently locked
    const lockoutTtl = await redis.ttl(lockoutKey)
    if (lockoutTtl > 0) {
      return { locked: true, remainingAttempts: 0, lockoutDuration: lockoutTtl }
    }

    // Check current attempt count
    const attempts = await redis.get<number>(attemptKey)
    const currentAttempts = attempts || 0
    const remainingAttempts = Math.max(0, 10 - currentAttempts)

    return { locked: false, remainingAttempts, lockoutDuration: 0 }
  } catch (error) {
    console.error('OTP lockout check error:', error)
    return { locked: false, remainingAttempts: 10, lockoutDuration: 0 }
  }
}

/**
 * Record a failed OTP attempt
 * Auto-locks after 10 failed attempts for 15 minutes
 */
export async function recordFailedOtpAttempt(email: string): Promise<{ locked: boolean; lockoutDuration: number }> {
  try {
    const redis = getRedisClient()
    const attemptKey = `otp_attempts:${email}`
    const lockoutKey = `otp_lockout:${email}`

    const attempts = await redis.incr(attemptKey)

    // Set TTL on first attempt (15 min window)
    if (attempts === 1) {
      await redis.expire(attemptKey, 900)
    }

    // Lock after 10 failed attempts
    if (attempts >= 10) {
      await redis.set(lockoutKey, '1', { ex: 900 }) // 15 min lockout
      await redis.del(attemptKey) // Reset counter
      return { locked: true, lockoutDuration: 900 }
    }

    return { locked: false, lockoutDuration: 0 }
  } catch (error) {
    console.error('Record failed OTP attempt error:', error)
    return { locked: false, lockoutDuration: 0 }
  }
}

/**
 * Clear failed OTP attempts on successful verification
 */
export async function clearOtpAttempts(email: string): Promise<void> {
  try {
    const redis = getRedisClient()
    await redis.del(`otp_attempts:${email}`)
    await redis.del(`otp_lockout:${email}`)
  } catch (error) {
    console.error('Clear OTP attempts error:', error)
  }
}
