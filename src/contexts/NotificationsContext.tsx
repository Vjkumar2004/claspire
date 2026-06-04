'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

export type Notification = {
  id: string
  title: string
  message: string
  type: string
  link?: string
  is_read: boolean
  sender_id?: string
  receiver_id?: string
  created_at: string
}

type NotificationsContextType = {
  notifications: Notification[]
  unreadCount: number
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined)

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  console.log('NotificationsProvider render. Current count:', unreadCount, 'User:', user?.id);

  useEffect(() => {
    if (!user?.id) {
      setNotifications([])
      setUnreadCount(0)
      return
    }

    const fetchInitialNotifications = async () => {
      try {
        const res = await fetch('/api/notifications')
        const data = await res.json()
        if (data.notifications) {
          setNotifications(data.notifications)
          setUnreadCount(data.notifications.filter((n: Notification) => !n.is_read).length)
        }
      } catch (err) {
        console.error('Failed to fetch initial notifications:', err)
      }
    }

    fetchInitialNotifications()

    console.log(`NotificationsContext subscribing to notifications for receiver_id=${user.id}`);

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('NotificationsContext INSERT event received:', payload);
          const newNotification = payload.new as Notification
          setNotifications((prev) => [newNotification, ...prev])
          setUnreadCount((prev) => prev + (newNotification.is_read ? 0 : 1))
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('NotificationsContext UPDATE event received:', payload);
          const updated = payload.new as Notification
          const previous = payload.old as Notification
          if (updated.is_read !== previous.is_read) {
            setNotifications((prev) =>
              prev.map((n) =>
                n.id === updated.id ? { ...n, is_read: updated.is_read } : n
              )
            )
            setUnreadCount((prev) =>
              updated.is_read ? Math.max(0, prev - 1) : prev + 1
            )
          }
        }
      )
      .subscribe((status) => {
        console.log('NotificationsContext Realtime status:', status);
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount }}>
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationsContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within NotificationsProvider')
  }
  return context
}
