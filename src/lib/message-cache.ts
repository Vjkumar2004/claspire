const TTL = 5 * 60 * 1000

type CacheEntry = {
  messages: unknown[]
  timestamp: number
}

const store = new Map<string, CacheEntry>()

export function getCachedMessages<T = unknown>(conversationId: string): T[] | null {
  const entry = store.get(conversationId)
  if (!entry) return null
  if (Date.now() - entry.timestamp > TTL) {
    store.delete(conversationId)
    return null
  }
  return entry.messages as T[]
}

export function setCachedMessages<T = unknown>(conversationId: string, messages: T[]): void {
  store.set(conversationId, { messages, timestamp: Date.now() })
}

export function updateCachedMessages<T = unknown>(
  conversationId: string,
  updater: (messages: T[]) => T[]
): void {
  const entry = store.get(conversationId)
  if (!entry) return
  entry.messages = updater(entry.messages as T[])
  entry.timestamp = Date.now()
}

export function clearCachedMessages(conversationId: string): void {
  store.delete(conversationId)
}
