'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

export type GroupListItem = {
  id: string
  name: string
  slug: string
  college_slug: string
  is_private: boolean
  member_count: number
  last_activity_at: string | null
  created_at: string
  membership_role: string
  last_read_at: string | null
  last_message: {
    id: string
    content: string
    created_at: string
    sender_id: string
  } | null
  unread_count: number
}

type GroupsContextType = {
  groups: GroupListItem[]
  activeGroupId: string | null
  setActiveGroupId: (id: string | null) => void
  loading: boolean
  refresh: () => Promise<void>
}

const GroupsContext = createContext<GroupsContextType | undefined>(undefined)

export function GroupsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [groups, setGroups] = useState<GroupListItem[]>([])
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const channelsRef = useRef<Set<string>>(new Set())

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setGroups([])
      setLoading(false)
      return
    }
    try {
      const res = await fetch('/api/groups/my-groups-chat')
      if (res.ok) {
        const data = await res.json()
        setGroups(data.groups || [])
      }
    } catch (err) {
      console.error('Failed to fetch groups:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    setLoading(true)
    refresh()
  }, [refresh])

  useEffect(() => {
    if (!user?.id || groups.length === 0) return

    const groupIds = groups.map(g => g.id)
    const newChannels = new Set(groupIds.map(id => `group-msgs-${id}`))

    for (const ch of newChannels) {
      if (channelsRef.current.has(ch)) continue
      channelsRef.current.add(ch)

      const groupId = ch.replace('group-msgs-', '')
      supabase
        .channel(ch)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'student_group_messages',
            filter: `group_id=eq.${groupId}`,
          },
          () => {
            refresh()
          }
        )
        .subscribe()
    }

    return () => {
      for (const ch of channelsRef.current) {
        supabase.removeChannel(supabase.getChannels().find(c => c.topic === ch) as any)
      }
      channelsRef.current.clear()
    }
  }, [user?.id, groups.length, refresh])

  const markAsRead = useCallback(async (groupId: string) => {
    setGroups(prev =>
      prev.map(g =>
        g.id === groupId ? { ...g, unread_count: 0, last_read_at: new Date().toISOString() } : g
      )
    )
    try {
      await fetch('/api/groups/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId }),
      })
    } catch {
    }
  }, [])

  const setActiveAndRead = useCallback((groupId: string | null) => {
    setActiveGroupId(groupId)
    if (groupId) markAsRead(groupId)
  }, [markAsRead])

  return (
    <GroupsContext.Provider
      value={{
        groups,
        activeGroupId,
        setActiveGroupId: setActiveAndRead,
        loading,
        refresh,
      }}
    >
      {children}
    </GroupsContext.Provider>
  )
}

export function useGroups() {
  const context = useContext(GroupsContext)
  if (!context) {
    throw new Error('useGroups must be used within a GroupsProvider')
  }
  return context
}
