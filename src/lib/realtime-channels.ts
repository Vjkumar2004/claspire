'use client'

import { supabase } from '@/lib/supabase'

type RealtimeEventHandler = (event: 'INSERT' | 'UPDATE' | 'DELETE', payload: any) => void

interface ChannelEntry {
  channel: ReturnType<typeof supabase.channel>
  handlers: Set<RealtimeEventHandler>
}

const activeChannels = new Map<string, ChannelEntry>()

function getChannelEntry(topic: string, config: { table: string; filter: string }) {
  let entry = activeChannels.get(topic)
  if (entry) return entry

  const handlers = new Set<RealtimeEventHandler>()
  const channel = supabase
    .channel(topic)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: config.table, filter: config.filter },
      (p) => { for (const h of handlers) h('INSERT', p) }
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: config.table, filter: config.filter },
      (p) => { for (const h of handlers) h('UPDATE', p) }
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: config.table, filter: config.filter },
      (p) => { for (const h of handlers) h('DELETE', p) }
    )
    .subscribe()

  entry = { channel, handlers }
  activeChannels.set(topic, entry)
  return entry
}

export function subscribeToGroupMessages(
  groupId: string,
  handler: RealtimeEventHandler
): () => void {
  const topic = `group-msgs-${groupId}`
  const entry = getChannelEntry(topic, {
    table: 'student_group_messages',
    filter: `group_id=eq.${groupId}`,
  })
  entry.handlers.add(handler)

  return () => {
    entry.handlers.delete(handler)
    if (entry.handlers.size === 0) {
      supabase.removeChannel(entry.channel)
      activeChannels.delete(topic)
    }
  }
}

export function clearAllSubscriptions(): void {
  for (const [topic, entry] of activeChannels) {
    supabase.removeChannel(entry.channel)
    activeChannels.delete(topic)
  }
}
