'use client'
import { useEffect } from 'react'
import OneSignal from 'react-onesignal'

export default function OneSignalInit() {
  useEffect(() => {
    const initOneSignal = async () => {
      try {
        await OneSignal.init({
          appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!,
          allowLocalhostAsSecureOrigin: true,
          notifyButton: {
            enable: false,
            prenotify: false,
            showCredit: false,
            text: {}
          } as any,
        })

        // Wait for subscription
        await new Promise(resolve => setTimeout(resolve, 2000))

        // Get player ID
        const playerId = OneSignal.User.PushSubscription.id

        console.log('OneSignal Player ID:', playerId)

        if (playerId) {
          // Save to DB
          const res = await fetch('/api/profile/update', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              onesignal_player_id: playerId
            })
          })
          const data = await res.json()
          console.log('Player ID saved:', data)
        }

        // Listen for subscription changes
        OneSignal.User.PushSubscription.addEventListener('change', async (event: any) => {
          const newId = event.current.id
          console.log('Subscription changed:', newId)
          if (newId) {
            await fetch('/api/profile/update', {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                onesignal_player_id: newId
              })
            })
          }
        })

      } catch (err) {
        console.error('OneSignal init error:', err)
      }
    }

    // Only init if user logged in
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('claspire_user') : null
    if (userStr) {
      initOneSignal()
    }
  }, [])

  return null
}
