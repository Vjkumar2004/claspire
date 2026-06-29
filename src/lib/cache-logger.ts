/**
 * Cache Logger Utility
 * Logs cache hits, misses, and revalidation events for monitoring
 */

type CacheEventType = 'HIT' | 'MISS' | 'REVALIDATE' | 'STALE'

interface CacheLogEntry {
  timestamp: string
  key: string
  event: CacheEventType
  duration?: number
  metadata?: Record<string, any>
}

class CacheLogger {
  private logs: CacheLogEntry[] = []
  private maxLogs = 100

  log(key: string, event: CacheEventType, metadata?: Record<string, any>, duration?: number) {
    const entry: CacheLogEntry = {
      timestamp: new Date().toISOString(),
      key,
      event,
      duration,
      metadata,
    }

    this.logs.push(entry)
    
    // Keep only last N logs
    if (this.logs.length > this.maxLogs) {
      this.logs.shift()
    }

    // Console log with prefix
    const durationStr = duration ? ` (${duration}ms)` : ''
    const metadataStr = metadata ? ` ${JSON.stringify(metadata)}` : ''
    console.log(`[College Cache] ${event}${durationStr} - ${key}${metadataStr}`)
  }

  getLogs(): CacheLogEntry[] {
    return [...this.logs]
  }

  clearLogs() {
    this.logs = []
  }

  getStats() {
    const hits = this.logs.filter(l => l.event === 'HIT').length
    const misses = this.logs.filter(l => l.event === 'MISS').length
    const revalidates = this.logs.filter(l => l.event === 'REVALIDATE').length
    const total = hits + misses

    return {
      hits,
      misses,
      revalidates,
      total,
      hitRate: total > 0 ? ((hits / total) * 100).toFixed(2) + '%' : '0%',
    }
  }
}

// Singleton instance
export const cacheLogger = new CacheLogger()

// Helper functions for common cache operations
export function logCacheHit(key: string, metadata?: Record<string, any>) {
  cacheLogger.log(key, 'HIT', metadata)
}

export function logCacheMiss(key: string, metadata?: Record<string, any>) {
  cacheLogger.log(key, 'MISS', metadata)
}

export function logCacheRevalidate(key: string, metadata?: Record<string, any>) {
  cacheLogger.log(key, 'REVALIDATE', metadata)
}

export function logCacheFetch(key: string, duration: number, metadata?: Record<string, any>) {
  cacheLogger.log(key, 'MISS', metadata, duration)
}
