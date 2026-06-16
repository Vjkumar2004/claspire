'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { subscribeToGroupMessages } from '@/lib/realtime-channels'

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
  const unsubsRef = useRef<Map<string, () => void>>(new Map())
  const activeGroupIdRef = useRef<string | null>(null)
  activeGroupIdRef.current = activeGroupId

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

  // Shared channel subscription per group — deduplicates with GroupChatPage
  useEffect(() => {
    if (!user?.id) {
      for (const [, unsub] of unsubsRef.current) unsub()
      unsubsRef.current.clear()
      return
    }

    const activeIds = new Set(groups.map(g => g.id))

    // Unsubscribe from groups no longer in the list
    for (const [gid, unsub] of unsubsRef.current) {
      if (!activeIds.has(gid)) {
        unsub()
        unsubsRef.current.delete(gid)
      }
    }

    // Subscribe to new groups
    for (const g of groups) {
      if (unsubsRef.current.has(g.id)) continue

      const unsub = subscribeToGroupMessages(g.id, (event, payload) => {
        if (event !== 'INSERT') return
        const msg = payload.new as { id: string; group_id: string; content: string; created_at: string; sender_id: string }
        if (!msg?.group_id) return
        setGroups(prev => {
          const updated = prev.map(g => {
            if (g.id !== msg.group_id) return g
            return {
              ...g,
              last_message: { id: msg.id, content: msg.content, created_at: msg.created_at, sender_id: msg.sender_id },
              last_activity_at: msg.created_at,
              unread_count: g.id === activeGroupIdRef.current ? g.unread_count : g.unread_count + 1,
            }
          })
          return [...updated].sort((a, b) => {
            const aUnread = a.unread_count > 0 ? 1 : 0
            const bUnread = b.unread_count > 0 ? 1 : 0
            if (aUnread !== bUnread) return bUnread - aUnread
            const aTime = new Date(a.last_activity_at || a.created_at || 0).getTime()
            const bTime = new Date(b.last_activity_at || b.created_at || 0).getTime()
            return bTime - aTime
          })
        })
      })

      unsubsRef.current.set(g.id, unsub)
    }
  }, [user?.id, groups.map(g => g.id).join(',')])

  // Cleanup all subscriptions on unmount
  useEffect(() => {
    return () => {
      for (const [, unsub] of unsubsRef.current) unsub()
      unsubsRef.current.clear()
    }
  }, [])

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
