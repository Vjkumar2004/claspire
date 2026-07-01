import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser } from '@/lib/session'
import { logCacheFetch } from '@/lib/cache-logger'

interface MessageRow {
  id: string
  group_id: string
  content: string
  created_at: string
  sender_id: string
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    )

    // Step 1: Get memberships
    const { data: memberships, error: memError } = await supabase
      .from('student_group_members')
      .select('group_id, role, last_read_at')
      .eq('user_id', user.id)

    if (memError) {
      console.error('my-groups-chat: membership error =', memError)
      return NextResponse.json({ error: 'Failed to fetch memberships' }, { status: 500 })
    }

    if (!memberships || memberships.length === 0) {
      const duration = Date.now() - startTime
      logCacheFetch('my-groups-chat', duration, { count: 0 })
      return NextResponse.json({ groups: [] })
    }

    // Step 2: Get group details
    const groupIds = memberships.map(m => m.group_id)
    const { data: groupsData, error: groupError } = await supabase
      .from('student_groups')
      .select('id, name, slug, is_private, member_count, created_at, colleges(slug)')
      .in('id', groupIds)
      .eq('is_active', true)

    if (groupError) {
      console.error('my-groups-chat: group error =', groupError)
      return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 })
    }

    if (!groupsData || groupsData.length === 0) {
      const duration = Date.now() - startTime
      logCacheFetch('my-groups-chat', duration, { count: 0 })
      return NextResponse.json({ groups: [] })
    }

    // Step 3: Get latest messages for all groups in a single query using window function
    const { data: latestMessages } = await supabase
      .from('student_group_messages')
      .select('id, group_id, content, created_at, sender_id')
      .in('group_id', groupIds)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })

    // Step 4: Build latest message map (one per group)
    const latestPerGroup: Record<string, MessageRow> = {}
    if (latestMessages) {
      for (const msg of latestMessages) {
        if (!latestPerGroup[msg.group_id]) {
          latestPerGroup[msg.group_id] = msg
        }
      }
    }

    // Step 5: Build membership map for last_read_at
    const membershipMap = new Map(memberships.map(m => [m.group_id, m]))

    // Step 6: Calculate unread counts in memory (JS-side, no I/O)
    const unreadPerGroup: Record<string, number> = {}
    for (const group of groupsData) {
      const mem = membershipMap.get(group.id)
      const lastReadAt = mem?.last_read_at || '1970-01-01T00:00:00Z'
      const lastReadTime = new Date(lastReadAt).getTime()

      // Count messages newer than last_read_at
      let unreadCount = 0
      if (latestMessages) {
        for (const msg of latestMessages) {
          if (msg.group_id === group.id && new Date(msg.created_at).getTime() > lastReadTime) {
            unreadCount++
          }
        }
      }
      unreadPerGroup[group.id] = unreadCount
    }

    // Step 7: Build response
    const result = groupsData.map(g => {
      const mem = membershipMap.get(g.id)
      const lm = latestPerGroup[g.id] || null
      const collegeSlug = (g as any).colleges?.slug || ''
      return {
        id: g.id,
        name: g.name,
        slug: g.slug,
        college_slug: collegeSlug,
        is_private: g.is_private,
        member_count: g.member_count,
        created_at: g.created_at,
        last_activity_at: lm ? lm.created_at : g.created_at,
        membership_role: mem?.role || 'member',
        last_read_at: mem?.last_read_at || null,
        last_message: lm
          ? { id: lm.id, content: lm.content, created_at: lm.created_at, sender_id: lm.sender_id }
          : null,
        unread_count: unreadPerGroup[g.id] || 0,
      }
    })

    // Step 8: Sort — unread first, then by activity
    result.sort((a, b) => {
      const aUnread = a.unread_count > 0 ? 1 : 0
      const bUnread = b.unread_count > 0 ? 1 : 0
      if (aUnread !== bUnread) return bUnread - aUnread
      const aTime = new Date(a.last_activity_at || a.created_at || 0).getTime()
      const bTime = new Date(b.last_activity_at || b.created_at || 0).getTime()
      return bTime - aTime
    })

    const duration = Date.now() - startTime
    logCacheFetch('my-groups-chat', duration, { count: result.length })

    return NextResponse.json({ groups: result })

  } catch (error) {
    console.error('my-groups-chat error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

