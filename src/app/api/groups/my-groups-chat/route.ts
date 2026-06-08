import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser } from '@/lib/session'

interface MessageRow {
  id: string
  group_id: string
  content: string
  created_at: string
  sender_id: string
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('my-groups-chat: user.id =', user.id)

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Step 1: Get memberships (same pattern as /api/groups/all)
    const { data: memberships, error: memError } = await supabase
      .from('student_group_members')
      .select('group_id, role, last_read_at')
      .eq('user_id', user.id)

    if (memError) {
      console.error('my-groups-chat: membership error =', memError)
      return NextResponse.json({ error: 'Failed to fetch memberships' }, { status: 500 })
    }

    console.log('my-groups-chat: memberships count =', memberships?.length || 0)

    if (!memberships || memberships.length === 0) {
      return NextResponse.json({ groups: [] })
    }

    // Step 2: Get group details (same pattern as /api/groups/[slug])
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

    console.log('my-groups-chat: groupsData count =', groupsData?.length || 0)

    if (!groupsData || groupsData.length === 0) {
      return NextResponse.json({ groups: [] })
    }

    // Step 3: Get latest messages and unread counts
    const { data: allMessages } = await supabase
      .from('student_group_messages')
      .select('id, group_id, content, created_at, sender_id')
      .in('group_id', groupIds)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(1000)

    const msgs = (allMessages || []) as MessageRow[]

    // Build maps
    const groupMap = new Map(groupsData.map(g => [g.id, g]))
    const membershipMap = new Map(memberships.map(m => [m.group_id, m]))
    const latestPerGroup: Record<string, MessageRow> = {}
    const unreadPerGroup: Record<string, number> = {}

    for (const g of groupsData) {
      unreadPerGroup[g.id] = 0
    }

    for (const msg of msgs) {
      if (!latestPerGroup[msg.group_id]) {
        latestPerGroup[msg.group_id] = msg
      }
      const mem = membershipMap.get(msg.group_id)
      const lastRead = mem?.last_read_at
      if (!lastRead || new Date(msg.created_at) > new Date(lastRead)) {
        unreadPerGroup[msg.group_id] = (unreadPerGroup[msg.group_id] || 0) + 1
      }
    }

    // Step 4: Build response (activity = latest message or created_at)
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

    // Step 5: Sort — unread first, then by activity
    result.sort((a, b) => {
      const aUnread = a.unread_count > 0 ? 1 : 0
      const bUnread = b.unread_count > 0 ? 1 : 0
      if (aUnread !== bUnread) return bUnread - aUnread
      const aTime = new Date(a.last_activity_at || a.created_at || 0).getTime()
      const bTime = new Date(b.last_activity_at || b.created_at || 0).getTime()
      return bTime - aTime
    })

    console.log('my-groups-chat: returning', result.length, 'groups')
    if (result.length > 0) {
      console.log('my-groups-chat: first group =', result[0].name, 'slug =', result[0].slug, 'college_slug =', result[0].college_slug)
    }

    return NextResponse.json({ groups: result })

  } catch (error) {
    console.error('my-groups-chat error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
