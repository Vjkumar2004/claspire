'use client'
import { useEffect, useState } from 'react'
import OneSignal from 'react-onesignal'
import { Bell, X } from 'lucide-react'

export default function NotificationPrompt() {
  const [show, setShow] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const init = async () => {
      // Small delay to ensure OneSignal is ready
      await new Promise(r => setTimeout(r, 1000))
      
      const asked = localStorage.getItem('notif_asked')
      if (asked) return

      // Don't show if already granted or explicitly denied in browser
      const permission = OneSignal.Notifications.permission
      const nativePermission = typeof window !== 'undefined' ? Notification.permission : 'default'

      if (permission || nativePermission === 'denied') {
        // If true, it's already granted OR explicitly denied
        localStorage.setItem('notif_asked', 'true')
        return
      }

      const timer = setTimeout(() => setShow(true), 3000)
      return () => clearTimeout(timer)
    }
    init()
  }, [])

  const handleAllow = async () => {
    setSaving(true)
    try {
      // Request permission
      await OneSignal.Notifications.requestPermission()

      // Check if permission was granted
      if (OneSignal.Notifications.permission) {
        // Get player ID
        const playerId = OneSignal.User.PushSubscription.id

        if (playerId) {
          // Save to DB
          await fetch('/api/profile/update', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              onesignal_player_id: playerId
            })
          })
        }
        localStorage.setItem('notif_asked', 'true')
      } else {
        // Permission was denied or dismissed
        console.warn('OneSignal: Permission not granted')
        localStorage.setItem('notif_asked', 'dismissed')
      }
      
      setShow(false)
    } catch (err: any) {
      if (err?.message?.includes('dismissed')) {
        console.log('User dismissed the permission prompt')
        localStorage.setItem('notif_asked', 'dismissed')
      } else {
        console.error('Failed to enable notifications:', err)
      }
      setShow(false)
    } finally {
      setSaving(false)
    }
  }

  const handleLater = () => {
    localStorage.setItem('notif_asked', 'later')
    setShow(false)
  }

  if (!show) return null

  return (
    <>
      {/* Backdrop */}
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.3)',
        zIndex: 998,
        backdropFilter: 'blur(2px)'
      }} />

      {/* Prompt Card */}
      <div style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'min(380px, 90vw)',
        background: 'white',
        borderRadius: 20,
        padding: '24px',
        zIndex: 999,
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        fontFamily: 'Plus Jakarta Sans'
      }}>
        {/* Close */}
        <button
          onClick={handleLater}
          style={{
            position: 'absolute',
            top: 14, right: 14,
            width: 28, height: 28,
            borderRadius: '50%',
            border: '1px solid #F3F4F6',
            background: '#F9FAFB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#9CA3AF'
          }}
        >
          <X size={14} />
        </button>

        {/* Icon */}
        <div style={{
          width: 52, height: 52,
          borderRadius: 16,
          background: 'linear-gradient(135deg,#7C3AED,#06B6D4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16
        }}>
          <Bell size={24} color="white" />
        </div>

        {/* Text */}
        <h3 style={{
          fontSize: 16,
          fontWeight: 800,
          color: '#111827',
          margin: '0 0 8px',
          fontFamily: 'Instrument Serif'
        }}>
          Stay in the loop! 🔔
        </h3>
        <p style={{
          fontSize: 13,
          color: '#6B7280',
          margin: '0 0 20px',
          lineHeight: 1.6,
          fontWeight: 500
        }}>
          Get notified when seniors answer your doubts, post referrals, or new opportunities arrive!
        </p>

        {/* Buttons */}
        <div style={{
          display: 'flex',
          gap: 10
        }}>
          <button
            onClick={handleLater}
            style={{
              flex: 1,
              padding: '11px',
              borderRadius: 10,
              border: '1px solid #F3F4F6',
              background: 'white',
              fontSize: 13,
              fontWeight: 600,
              color: '#6B7280',
              cursor: 'pointer',
              fontFamily: 'Plus Jakarta Sans'
            }}
          >
            Later
          </button>
          <button
            onClick={handleAllow}
            disabled={saving}
            style={{
              flex: 2,
              padding: '11px',
              borderRadius: 10,
              border: 'none',
              background: saving
                ? '#C4B5FD'
                : 'linear-gradient(135deg,#7C3AED,#06B6D4)',
              fontSize: 13,
              fontWeight: 700,
              color: 'white',
              cursor: saving
                ? 'wait' : 'pointer',
              fontFamily: 'Plus Jakarta Sans',
              boxShadow: '0 4px 12px rgba(124,58,237,0.3)'
            }}
          >
            {saving ? 'Enabling...' : '🔔 Enable Notifications'}
          </button>
        </div>
      </div>
    </>
  )
}
