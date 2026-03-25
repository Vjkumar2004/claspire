// Simple in-memory rate limiter for development
// In production, use Redis or a proper rate limiting solution

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export function rateLimit({
  identifier,
  windowMs = 15 * 60 * 1000, // 15 minutes
  maxAttempts = 5,
}: {
  identifier: string;
  windowMs?: number;
  maxAttempts?: number;
}) {
  const now = Date.now();
  const key = identifier;

  // Clean up expired entries
  for (const [entryKey, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(entryKey);
    }
  }

  const entry = rateLimitStore.get(key);

  if (!entry) {
    // First request
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return { success: true, remainingAttempts: maxAttempts - 1 };
  }

  if (now > entry.resetTime) {
    // Window reset, start fresh
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return { success: true, remainingAttempts: maxAttempts - 1 };
  }

  if (entry.count >= maxAttempts) {
    // Rate limited
    return {
      success: false,
      remainingAttempts: 0,
      resetTime: entry.resetTime,
    };
  }

  // Increment count
  entry.count++;
  return {
    success: true,
    remainingAttempts: maxAttempts - entry.count,
    resetTime: entry.resetTime,
  };
}

export function getClientIdentifier(req: Request): string {
  // Try to get IP from various headers
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const ip = req.headers.get('x-client-ip');
  
  const clientIp = forwarded?.split(',')[0] || realIp || ip || 'unknown';
  
  // For additional security, you could include User-Agent
  const userAgent = req.headers.get('user-agent') || 'unknown';
  
  return `${clientIp}:${userAgent}`;
}
