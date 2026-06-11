'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from './useAuth'

export type ActivityStatus = 'active_now' | 'active_recently' | 'active_today' | 'active_this_week' | 'long_ago'

export function getUserActivityStatus(lastSeen: string | null | undefined): { label: string; color: string } {
  if (!lastSeen) {
    return { label: 'Last seen long ago', color: 'text-gray-400' }
  }

  const now = Date.now()
  const seen = new Date(lastSeen).getTime()
  const diffMs = now - seen
  const diffMin = diffMs / 60000
  const diffHours = diffMin / 60
  const diffDays = diffHours / 24

  if (diffMin < 5) {
    return { label: 'Active Now', color: 'text-emerald-500' }
  }
  if (diffHours < 1) {
    const mins = Math.floor(diffMin)
    return { label: `Active ${mins}m ago`, color: 'text-emerald-500' }
  }
  if (diffHours < 24) {
    const hrs = Math.floor(diffHours)
    return { label: `Active ${hrs}h ago`, color: 'text-amber-500' }
  }
  if (diffDays < 7) {
    const days = Math.floor(diffDays)
    return { label: `Active ${days}d ago`, color: 'text-gray-500' }
  }
  const days = Math.floor(diffDays)
  return { label: `Last seen ${days}d ago`, color: 'text-gray-400' }
}

export function getUserActivityDot(lastSeen: string | null | undefined): string {
  if (!lastSeen) return 'bg-gray-300'

  const now = Date.now()
  const seen = new Date(lastSeen).getTime()
  const diffMin = (now - seen) / 60000

  if (diffMin < 5) return 'bg-emerald-500'
  if (diffMin < 60) return 'bg-emerald-400'
  if (diffMin < 1440) return 'bg-amber-400'
  return 'bg-gray-300'
}

const UPDATE_INTERVAL = 120_000 // 2 minutes

export function useLastSeen() {
  const { user } = useAuth()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastUpdateRef = useRef<number>(0)

  useEffect(() => {
    if (!user) return

    const update = async () => {
      const now = Date.now()
      if (now - lastUpdateRef.current < UPDATE_INTERVAL) return
      lastUpdateRef.current = now
      try {
        await fetch('/api/user/last-seen', { method: 'PATCH' })
      } catch {}
    }

    // Update immediately on mount
    update()

    intervalRef.current = setInterval(update, UPDATE_INTERVAL)

    // Also update on page visibility change (tab becomes active)
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') update()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [user?.id])
}
