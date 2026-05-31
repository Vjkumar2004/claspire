'use client'

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

type UnreadMessagesContextType = {
  unreadMessageCount: number
  refreshUnreadCount: () => Promise<void>
}

const UnreadMessagesContext = createContext<UnreadMessagesContextType | undefined>(undefined)

export function UnreadMessagesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)

  const refreshUnreadCount = useCallback(async () => {
    if (!user?.id) {
      setUnreadMessageCount(0)
      return
    }
    try {
      const res = await fetch('/api/messages/unread-count')
      const data = await res.json()
      setUnreadMessageCount(data.count || 0)
    } catch (err) {
      console.error('Failed to fetch unread count:', err)
    }
  }, [user?.id])

  useEffect(() => {
    if (!user?.id) {
      setUnreadMessageCount(0)
      return
    }

    refreshUnreadCount()

    const channel = supabase
      .channel(`unread-messages-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        () => {
          setUnreadMessageCount((prev) => prev + 1)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'direct_messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload: { new: { is_read?: boolean }; old: { is_read?: boolean } }) => {
          if (payload.new.is_read && !payload.old.is_read) {
            setUnreadMessageCount((prev) => Math.max(0, prev - 1))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, refreshUnreadCount])

  return (
    <UnreadMessagesContext.Provider value={{ unreadMessageCount, refreshUnreadCount }}>
      {children}
    </UnreadMessagesContext.Provider>
  )
}

export function useUnreadMessages() {
  const context = useContext(UnreadMessagesContext)
  if (context === undefined) {
    throw new Error('useUnreadMessages must be used within UnreadMessagesProvider')
  }
  return context
}
