'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import OneSignal from 'react-onesignal'

export default function NotificationPrompt() {
  const { user } = useAuth()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!user) return
    if (typeof window === 'undefined') return
    if (typeof Notification === 'undefined') return
    if (Notification.permission === 'granted') return
    if (Notification.permission === 'denied') return
    if (localStorage.getItem('notif_asked')) return

    const timer = setTimeout(() => setShow(true), 30000)
    return () => clearTimeout(timer)
  }, [user])

  const handleEnable = async () => {
    try {
      localStorage.setItem('notif_asked', 'true')
      setShow(false)
      
      // Use OneSignal's proper API to show native prompt
      await OneSignal.Notifications.requestPermission()
    } catch (error) {
      console.error('Failed to request notification permission:', error)
    }
  }

  const handleLater = () => {
    localStorage.setItem('notif_asked', 'true')
    setShow(false)
  }

  if (!show) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: '88px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '320px',
      zIndex: 9999,
    }}>
      <div style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-start',
      }}>
        <div style={{
          width: '38px', height: '38px',
          background: '#7C3AED18',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          flexShrink: 0,
        }}>🔔</div>
        <div style={{ flex: 1 }}>
          <p style={{
            fontSize: '13px',
            fontWeight: '600',
            color: '#111827',
            marginBottom: '3px',
          }}>
            Don't miss senior replies
          </p>
          <p style={{
            fontSize: '12px',
            color: '#6b7280',
            marginBottom: '10px',
            lineHeight: '1.5',
          }}>
            Get notified instantly when a senior answers your doubt or sends a referral.
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleEnable}
              style={{
                background: '#7C3AED',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 16px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Enable Notifications
            </button>
            <button
              onClick={handleLater}
              style={{
                background: 'transparent',
                color: '#6b7280',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
