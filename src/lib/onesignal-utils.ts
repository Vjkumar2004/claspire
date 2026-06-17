/**
 * Shared OneSignal subscription persistence utilities.
 * Used by both OneSignalInit and NotificationPromptContext.
 */

const MAX_RETRIES = 3
const RETRY_DELAY = 1500

/**
 * Save (or clear) the OneSignal player ID to the database with retry logic.
 * Pass null to clear the stored ID when a subscription is removed.
 * Pass a currentStoredId to skip the PATCH if the value is unchanged.
 */
export async function savePlayerIdWithRetry(
  playerId: string | null,
  currentStoredId?: string | null
): Promise<boolean> {
  // Prevent duplicate PATCH requests when the ID hasn't changed
  if (playerId !== null && playerId === currentStoredId) {
    console.log('[OneSignal] Subscription ID unchanged — skipping update')
    return true
  }

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch('/api/profile/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onesignal_player_id: playerId }),
      })
      if (res.ok) {
        if (playerId) {
          console.log('[OneSignal] Subscription ID saved successfully:', playerId)
        } else {
          console.log('[OneSignal] Subscription ID cleared in database')
        }
        return true
      }
      const text = await res.text().catch(() => '')
      console.warn(`[OneSignal] Save attempt ${attempt + 1}/${MAX_RETRIES} failed (${res.status}): ${text}`)
    } catch (err) {
      console.warn(`[OneSignal] Save attempt ${attempt + 1}/${MAX_RETRIES} error:`, err)
    }
    if (attempt < MAX_RETRIES - 1) {
      await new Promise((r) => setTimeout(r, RETRY_DELAY * (attempt + 1)))
    }
  }
  console.error(`[OneSignal] Failed to save subscription ID after ${MAX_RETRIES} attempts`)
  return false
}

/**
 * Poll OneSignal.User.PushSubscription.id until a non-null value appears.
 * Only polls if the user is opted in.
 * Returns the subscription ID if found within maxAttempts, or null on timeout.
 */
export async function pollForSubscriptionId(
  maxAttempts: number,
  intervalMs: number
): Promise<string | null> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, intervalMs))
    try {
      const optedIn = (window as any).OneSignal?.User?.PushSubscription?.optedIn
      if (!optedIn) {
        console.log('[OneSignal] User not opted in — stopping poll')
        return null
      }
      const id: string | null = (window as any).OneSignal?.User?.PushSubscription?.id || null
      if (id) {
        console.log(`[OneSignal] Subscription ID discovered on poll attempt ${i + 1}:`, id)
        return id
      }
    } catch (err) {
      console.warn('[OneSignal] Poll error:', err)
    }
  }
  console.warn('[OneSignal] Polling timed out — subscription ID not found')
  return null
}
