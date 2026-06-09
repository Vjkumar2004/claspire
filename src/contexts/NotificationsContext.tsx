'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { useNetworkRequestCount } from './NetworkRequestCountContext'

const MESSAGE_NOTIFICATION_TYPES = new Set([
  'direct_message',
  'message',
  'message_request',
  'message_request_accepted',
  'message_request_rejected',
  'referral_request',
])

function isMessageNotificationType(type: string): boolean {
  return MESSAGE_NOTIFICATION_TYPES.has(type)
}

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
  pendingNetworkRequestsCount: number
  loadMore: () => Promise<void>
  hasMore: boolean
  loading: boolean
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined)

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const { pendingCount } = useNetworkRequestCount()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)

  const loadMore = useCallback(async () => {
    if (!cursor || loading) return
    setLoading(true)
    try {
      const res = await fetch(`/api/notifications?cursor=${encodeURIComponent(cursor)}`)
      const data = await res.json()
      if (data.notifications?.length) {
        setNotifications((prev) => [...prev, ...data.notifications])
        setCursor(data.nextCursor)
        setHasMore(data.nextCursor !== null)
      } else {
        setHasMore(false)
      }
    } catch (err) {
      console.error('Failed to load more notifications:', err)
    } finally {
      setLoading(false)
    }
  }, [cursor, loading])

  useEffect(() => {
    setUnreadCount(
      notifications.filter((n) => !n.is_read && !isMessageNotificationType(n.type)).length
    )
  }, [notifications])

  useEffect(() => {
    if (!user?.id) {
      setNotifications([])
      setUnreadCount(0)
      setCursor(null)
      setHasMore(false)
      return
    }

    const fetchInitialNotifications = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/notifications')
        const data = await res.json()
        if (data.notifications) {
          setNotifications(data.notifications)
          setCursor(data.nextCursor)
          setHasMore(data.nextCursor !== null)
        }
      } catch (err) {
        console.error('Failed to fetch initial notifications:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchInitialNotifications()

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          if (payload.new?.receiver_id !== user?.id) {
            return
          }
          const newNotification = payload.new as Notification
          setNotifications((prev) => [newNotification, ...prev])
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
          const updated = payload.new as Notification
          const previous = payload.old as Notification
          if (updated.is_read !== previous.is_read) {
            setNotifications((prev) =>
              prev.map((n) =>
                n.id === updated.id ? { ...n, is_read: updated.is_read } : n
              )
            )
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          const deletedId = payload.old.id as string
          setNotifications((prev) => prev.filter((n) => n.id !== deletedId))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, pendingNetworkRequestsCount: pendingCount, loadMore, hasMore, loading }}>
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
