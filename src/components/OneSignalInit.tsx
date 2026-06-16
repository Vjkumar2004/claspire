'use client'
import { useEffect, useRef } from 'react'
import OneSignal from 'react-onesignal'

const MAX_RETRIES = 3
const RETRY_DELAY = 1500

async function savePlayerIdWithRetry(playerId: string | null): Promise<boolean> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch('/api/profile/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onesignal_player_id: playerId }),
      })
      if (res.ok) {
        if (playerId) {
          console.log('[OneSignal] Player ID saved successfully')
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
  console.error(`[OneSignal] Failed to save player ID after ${MAX_RETRIES} attempts`)
  return false
}

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
          const newId = event.current?.id
          if (newId) {
            console.log('[OneSignal] Subscription changed — new player ID:', newId)
            await savePlayerIdWithRetry(newId)
          } else {
            console.log('[OneSignal] Subscription removed — clearing player ID')
            await savePlayerIdWithRetry(null)
          }
        }

        OneSignal.User.PushSubscription.addEventListener('change', handleSubscriptionChange)

        // Now check current subscription state (listener is already registered)
        const currentId = OneSignal.User.PushSubscription.id
        if (currentId) {
          console.log('[OneSignal] Push subscription active:', currentId)
          await savePlayerIdWithRetry(currentId)
        } else {
          console.log('[OneSignal] No push subscription yet — will wait for subscription change')
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
