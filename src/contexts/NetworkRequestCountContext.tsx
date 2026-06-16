'use client'

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

type NetworkRequestCountContextType = {
  pendingCount: number
  refreshPendingCount: () => Promise<void>
}

const NetworkRequestCountContext = createContext<NetworkRequestCountContextType | undefined>(undefined)

export function NetworkRequestCountProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [pendingCount, setPendingCount] = useState(0)

  const refreshPendingCount = useCallback(async () => {
    if (!user?.id) {
      setPendingCount(0)
      return
    }
    try {
      const { count } = await supabase
        .from('connections')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('status', 'pending')
      setPendingCount(count ?? 0)
    } catch (err) {
      console.error('Failed to fetch network request count:', err)
    }
  }, [user?.id])

  useEffect(() => {
    if (!user?.id) {
      setPendingCount(0)
      return
    }

    refreshPendingCount()

    const channel = supabase
      .channel(`network-request-count-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'connections',
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new?.status === 'pending') {
            setPendingCount(prev => prev + 1)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'connections',
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          const oldStatus = payload.old?.status
          const newStatus = payload.new?.status
          if (oldStatus === 'pending' && newStatus !== 'pending') {
            setPendingCount(prev => Math.max(0, prev - 1))
          } else if (oldStatus !== 'pending' && newStatus === 'pending') {
            setPendingCount(prev => prev + 1)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'connections',
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.old?.status === 'pending') {
            setPendingCount(prev => Math.max(0, prev - 1))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, refreshPendingCount])

  return (
    <NetworkRequestCountContext.Provider value={{ pendingCount, refreshPendingCount }}>
      {children}
    </NetworkRequestCountContext.Provider>
  )
}

export function useNetworkRequestCount() {
  const context = useContext(NetworkRequestCountContext)
  if (context === undefined) {
    throw new Error('useNetworkRequestCount must be used within NetworkRequestCountProvider')
  }
  return context
}
