'use client'
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import OneSignal from 'react-onesignal'
import { savePlayerIdWithRetry, pollForSubscriptionId } from '@/lib/onesignal-utils'
import { Bell } from 'lucide-react'

type NotificationPromptContextType = {
  trigger: () => void
}

const NotificationPromptContext = createContext<NotificationPromptContextType>({
  trigger: () => {}
})

const DISMISSED_KEY = 'claspire_notif_dismissed'
const TRIGGER_KEY = 'claspire_notif_trigger'
const COOLDOWN_DAYS = 7

const BENEFITS = [
  'New messages',
  'Connection requests',
  'Referral updates',
  'Community replies',
]

function getDismissedDays(): number | null {
  try {
    const val = localStorage.getItem(DISMISSED_KEY)
    if (!val) return null
    const elapsed = Date.now() - parseInt(val, 10)
    return elapsed / (1000 * 60 * 60 * 24)
  } catch {
    return null
  }
}

function canShowPrompt(): boolean {
  if (typeof window === 'undefined') return false
  if (typeof Notification === 'undefined') return false
  if (Notification.permission === 'granted') return false
  if (Notification.permission === 'denied') return false

  const days = getDismissedDays()
  if (days !== null && days < COOLDOWN_DAYS) return false

  return true
}

export function NotificationPromptProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const triggeredRef = useRef(false)

  const trigger = useCallback(() => {
    if (triggeredRef.current) return
    if (!canShowPrompt()) return
    triggeredRef.current = true

    setTimeout(() => setIsOpen(true), 800)
  }, [])

  useEffect(() => {
    if (!user || !canShowPrompt()) return

    const source = sessionStorage.getItem(TRIGGER_KEY)
    if (!source) return

    sessionStorage.removeItem(TRIGGER_KEY)
    trigger()
  }, [user, trigger])

  const handleEnable = async () => {
    setRequesting(true)
    try {
      await OneSignal.Notifications.requestPermission()
      console.log('[OneSignal] Permission granted — polling for subscription ID...')

      // FIX 1: Poll for subscription ID after permission grant.
      // OneSignal assigns the ID server-side asynchronously — it may take 1-8s
      // to become available on OneSignal.User.PushSubscription.id.
      // The change event listener in OneSignalInit may also not yet be registered
      // if init() hasn't fully completed (race condition), so this is a dual-track
      // guarantee that the ID is always saved to the database.
      const subId = await pollForSubscriptionId(10, 800)
      if (subId) {
        console.log('[OneSignal] Subscription ID captured in prompt context:', subId)
        // FIX 4: Compare against window cache to avoid duplicate PATCH
        const currentStored = (window as any).__claspire_onesignal_id__ || null
        const saved = await savePlayerIdWithRetry(subId, currentStored)
        if (saved) (window as any).__claspire_onesignal_id__ = subId
      } else {
        console.warn('[OneSignal] Prompt context polling timed out — change event listener will handle persistence when ID becomes available')
      }

      setIsOpen(false)
    } catch (err) {
      console.error('Notification permission request failed:', err)
    } finally {
      setRequesting(false)
    }
  }

  const handleLater = () => {
    localStorage.setItem(DISMISSED_KEY, Date.now().toString())
    setIsOpen(false)
  }

  return (
    <NotificationPromptContext.Provider value={{ trigger }}>
      {children}
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-surface dark:bg-[#1D2226] rounded-2xl w-[380px] max-w-full shadow-2xl overflow-hidden animate-fade">
            <div className="p-6">
              <div className="w-14 h-14 bg-[#FFF3D6] dark:bg-purple-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Bell className="w-7 h-7 text-[#F4A01C]" />
              </div>

              <h2 className="text-lg font-bold text-center text-gray-900 dark:text-white mb-1">
                Stay Updated with Claspire
              </h2>
              <p className="text-sm text-gray-500 dark:text-[#B0B7BE] text-center mb-5">
                Get notified when it matters most
              </p>

              <ul className="space-y-2.5 mb-6">
                {BENEFITS.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-3 text-sm text-gray-700 dark:text-[#E4E8EC]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F4A01C] flex-shrink-0" />
                    {benefit}
                  </li>
                ))}
              </ul>

              <div className="space-y-2.5">
                <button
                  onClick={handleEnable}
                  disabled={requesting}
                  className="w-full py-3 bg-[#F4A01C] hover:bg-[#E09410] text-white font-semibold text-sm rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {requesting ? 'Requesting…' : 'Enable Notifications'}
                </button>
                <button
                  onClick={handleLater}
                  disabled={requesting}
                  className="w-full py-3 bg-gray-100 dark:bg-[#283036] hover:bg-gray-200 dark:hover:bg-[#38434F] text-gray-600 dark:text-[#B0B7BE] font-semibold text-sm rounded-xl transition-colors cursor-pointer"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </NotificationPromptContext.Provider>
  )
}

export function useNotificationPrompt() {
  return useContext(NotificationPromptContext)
}
