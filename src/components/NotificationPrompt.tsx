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
    <div className="fixed bottom-[88px] left-1/2 -translate-x-1/2 w-[320px] z-[9999]">
      <div className="bg-white dark:bg-[#283036] border border-gray-200 dark:border-[#38434F] rounded-xl p-4 shadow-[0_4px_24px_rgba(0,0,0,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)] flex gap-3 items-start">
        <div className="w-[38px] h-[38px] bg-purple-600/10 rounded-lg flex items-center justify-center text-lg flex-shrink-0">
          🔔
        </div>
        <div className="flex-1">
          <p className="text-[13px] font-semibold text-gray-900 dark:text-white mb-[3px]">
            Don't miss senior replies
          </p>
          <p className="text-[12px] text-gray-500 dark:text-[#B0B7BE] mb-[10px] leading-relaxed">
            Get notified instantly when a senior answers your doubt or sends a referral.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleEnable}
              className="bg-[#7C3AED] text-white border-none rounded-md px-4 py-1.5 text-xs font-semibold cursor-pointer"
            >
              Enable Notifications
            </button>
            <button
              onClick={handleLater}
              className="bg-transparent text-gray-500 dark:text-[#B0B7BE] border border-gray-200 dark:border-[#38434F] rounded-md px-3 py-1.5 text-xs cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1D2226] transition-colors"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
