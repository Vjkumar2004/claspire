'use client'
import { useEffect, useRef } from 'react'
import OneSignal from 'react-onesignal'
import { savePlayerIdWithRetry, pollForSubscriptionId } from '@/lib/onesignal-utils'

export default function OneSignalInit() {
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const initOneSignal = async () => {
      try {
        await OneSignal.init({
          appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!,
          allowLocalhostAsSecureOrigin: true,
          autoPrompt: false,
          notifyButton: {
            enable: false,
          } as any,
        })

        console.log('[OneSignal] Initialized successfully')

        // Set external ID for multi-device push targeting
        const userStr = localStorage.getItem('claspire_user')
        let userId: string | null = null
        if (userStr) {
          try {
            const user = JSON.parse(userStr)
            if (user?.id) {
              userId = user.id
              ;(OneSignal.User as any)?.addAlias?.('external_id', user.id)
              console.log('[OneSignal] External ID set:', user.id)
            }
          } catch {}
        }

        // Register subscription change listener FIRST to avoid race conditions
        const handleSubscriptionChange = async (event: any) => {
          const newId: string | null = event.current?.id || null
          const optedIn: boolean = event.current?.optedIn === true

          if (newId) {
            // FIX 4: Skip duplicate saves
            const currentStored = (window as any).__claspire_onesignal_id__ || null
            console.log('[OneSignal] Subscription changed — new player ID:', newId)
            const saved = await savePlayerIdWithRetry(newId, currentStored)
            if (saved) (window as any).__claspire_onesignal_id__ = newId
          } else if (optedIn) {
            // FIX 2 + 3: newId is null but user is opted in — poll for the real ID
            console.log('[OneSignal] Change event returned null ID but user is opted in — polling...')
            const polledId = await pollForSubscriptionId(8, 800)
            if (polledId) {
              const currentStored = (window as any).__claspire_onesignal_id__ || null
              const saved = await savePlayerIdWithRetry(polledId, currentStored)
              if (saved) (window as any).__claspire_onesignal_id__ = polledId
            } else {
              // Polling exhausted and still no ID — user genuinely has no subscription
              console.log('[OneSignal] Polling timed out — not clearing stored ID to avoid false negatives')
            }
          } else {
            // User is not opted in and no ID — subscription was genuinely removed
            console.log('[OneSignal] Subscription removed — clearing player ID')
            await savePlayerIdWithRetry(null)
            ;(window as any).__claspire_onesignal_id__ = null
          }
        }

        OneSignal.User.PushSubscription.addEventListener('change', handleSubscriptionChange)

        // Now check current subscription state (listener is already registered)
        const currentId = OneSignal.User.PushSubscription.id
        if (currentId) {
          console.log('[OneSignal] Push subscription active on init:', currentId)
          const currentStored = (window as any).__claspire_onesignal_id__ || null
          const saved = await savePlayerIdWithRetry(currentId, currentStored)
          if (saved) (window as any).__claspire_onesignal_id__ = currentId
        } else {
          console.log('[OneSignal] No push subscription on init — will wait for subscription change event')
        }

        cleanupRef.current = () => {
          try {
            OneSignal.User.PushSubscription.removeEventListener('change', handleSubscriptionChange)
          } catch {}
        }

      } catch (err) {
        console.error('[OneSignal] Init error:', err)
      }
    }

    const userStr = typeof window !== 'undefined' ? localStorage.getItem('claspire_user') : null
    if (userStr) {
      initOneSignal()
    } else {
      console.log('[OneSignal] Skipping init — user not logged in')
    }

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current()
        console.log('[OneSignal] Cleaned up subscription listener')
      }
    }
  }, [])

  return null
}
