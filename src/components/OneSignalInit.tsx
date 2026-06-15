'use client'
import { useEffect, useRef } from 'react'
import OneSignal from 'react-onesignal'

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

        const playerId = OneSignal.User.PushSubscription.id

        // Set external ID for multi-device push targeting
        const userStr = localStorage.getItem('claspire_user')
        if (userStr) {
          try {
            const user = JSON.parse(userStr)
            if (user?.id) {
              ;(OneSignal.User as any)?.addAlias?.('external_id', user.id)
              console.log('[OneSignal] External ID set:', user.id)
            }
          } catch {}
        }

        if (playerId) {
          console.log('[OneSignal] Push subscription active:', playerId)
          await fetch('/api/profile/update', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ onesignal_player_id: playerId })
          })
        } else {
          // Permission not granted — clear stale player ID if any
          const userStr = localStorage.getItem('claspire_user')
          if (userStr) {
            try {
              const user = JSON.parse(userStr)
              if (user?.id) {
                console.log('[OneSignal] No push subscription yet — clearing stale player ID')
                await fetch('/api/profile/update', {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ onesignal_player_id: null })
                })
              }
            } catch {}
          }
        }

        const handleSubscriptionChange = async (event: any) => {
          const newId = event.current?.id
          if (newId) {
            console.log('[OneSignal] Subscription changed — new player ID:', newId)
            await fetch('/api/profile/update', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ onesignal_player_id: newId })
            })
          } else {
            console.log('[OneSignal] Subscription removed — clearing player ID')
            await fetch('/api/profile/update', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ onesignal_player_id: null })
            })
          }
        }

        OneSignal.User.PushSubscription.addEventListener('change', handleSubscriptionChange)

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
