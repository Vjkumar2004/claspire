import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser } from '@/lib/session'

const FIVE_MIN = 5 * 60 * 1000

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    )

    const user = await getAuthenticatedUser(request)
    const currentUserId = user?.id || null

    const onlineSince = new Date(Date.now() - FIVE_MIN).toISOString()

    const membershipsPromise = currentUserId
      ? supabase.from('student_group_members').select('group_id').eq('user_id', currentUserId)
      : Promise.resolve({ data: [] as { group_id: string }[] })

    const [
      activeGroupsCount,
      totalMembersCount,
      totalMessagesCount,
      { data: onlineMembers },
      { data: trendingGroups },
      { data: allGroups },
      { data: recentActivity },
      membershipsResult,
    ] = await Promise.all([
      supabase.from('student_groups')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true),

      supabase.from('student_group_members')
        .select('*', { count: 'exact', head: true }),

      supabase.from('student_group_messages')
        .select('*', { count: 'exact', head: true }),

      supabase.from('users')
        .select('id, full_name, avatar_url, unique_id, role')
        .gte('last_seen', onlineSince)
        .limit(5),

      supabase.from('student_groups')
        .select('id, name, slug, description, scope, member_count, created_at, created_by, college_id, colleges(slug, short_name)')
        .eq('is_active', true)
        .order('member_count', { ascending: false })
        .limit(5),

      supabase.from('student_groups')
        .select('id, name, slug, description, scope, member_count, created_at, created_by, college_id, colleges(slug, short_name)')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(50),

      supabase.from('student_group_messages')
        .select(`
          id, content, created_at, group_id,
          sender:users!student_group_messages_sender_id_fkey(id, full_name, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .limit(5),

      membershipsPromise,
    ])

    console.log('[discover] activeGroupsCount:', activeGroupsCount.count)
    console.log('[discover] trendingGroups count:', trendingGroups?.length || 0)
    console.log('[discover] allGroups count:', allGroups?.length || 0)
    console.log('[discover] recentActivity count:', recentActivity?.length || 0)

    const joinedGroupIds = new Set((membershipsResult.data || []).map(m => m.group_id))

    const allCreatorIds = [
      ...new Set([
        ...(trendingGroups || []).map(g => g.created_by),
        ...(allGroups || []).map(g => g.created_by),
      ]),
    ]

    let creatorsMap: Record<string, any> = {}
    if (allCreatorIds.length > 0) {
      const { data: creators } = await supabase
        .from('users')
        .select('id, full_name, avatar_url, unique_id, role')
        .in('id', allCreatorIds)
      if (creators) {
        creatorsMap = Object.fromEntries(creators.map(c => [c.id, c]))
      }
    }

    const enrichGroup = (g: any) => {
      const college = Array.isArray(g.colleges) ? g.colleges[0] : g.colleges
      return {
        id: g.id,
        name: g.name,
        slug: g.slug,
        description: g.description,
        scope: g.scope || 'public',
        member_count: g.member_count || 0,
        created_at: g.created_at,
        created_by: g.created_by,
        creator: creatorsMap[g.created_by] || null,
        is_joined: joinedGroupIds.has(g.id),
        community_slug: college?.slug || g.slug,
      }
    }

    const response = {
      success: true,
      data: {
        stats: {
          activeGroups: activeGroupsCount.count || 0,
          totalMembers: totalMembersCount.count || 0,
          totalMessages: totalMessagesCount.count || 0,
          onlineNow: onlineMembers?.length || 0,
        },
        trendingGroups: (trendingGroups || []).map(enrichGroup),
        onlineMembers: onlineMembers || [],
        recentActivity: (recentActivity || []).map(a => ({
          id: a.id,
          content: a.content,
          created_at: a.created_at,
          group_id: a.group_id,
          sender: a.sender,
        })),
        groups: (allGroups || []).map(enrichGroup),
        categories: [
          'All', 'Placement', 'Coding', 'AI & ML',
          'Interview Prep', 'College Groups', 'General Chat',
        ],
      },
    }

    console.log('[discover] response groups count:', response.data.groups.length)
    return Response.json(response)
  } catch (error) {
    console.error('[discover] API error:', error)
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch discover data',
    }, { status: 500 })
  }
}

