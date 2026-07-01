import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUserIdFromRequest } from '@/lib/session'
import { logCacheFetch } from '@/lib/cache-logger'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function GET(req: NextRequest) {
  const startTime = Date.now()
  try {
    const userId = getUserIdFromRequest(req)
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()

    // Fire all independent queries in parallel (no N+1 patterns)
    const [
      connectedResult,
      mentorsResult,
      communitiesResult,
      [studentsResult, seniorsResult, collegesResult, communitiesCountResult],
      recentConnectionsResult,
      profileViewsResult,
      recentSeniorsResult,
    ] = await Promise.all([
      supabase
        .from('connections')
        .select('sender_id, receiver_id')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`),
      supabase
        .from('users')
        .select(`
          id, full_name, unique_id, role, avatar_url, company, designation,
          graduation_year, passout_year, rise_points, last_seen, profile_data,
          college:college_id (name, short_name)
        `)
        .eq('role', 'senior')
        .order('rise_points', { ascending: false })
        .limit(20),
      supabase
        .from('communities')
        .select('id, slug, display_name, member_count, senior_count, college_id, colleges ( logo_url, short_name )')
        .eq('is_active', true)
        .order('member_count', { ascending: false })
        .limit(5),
      Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'senior'),
        supabase.from('colleges').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('communities').select('id', { count: 'exact', head: true }).eq('is_active', true),
      ]),
      supabase
        .from('connections')
        .select('responded_at')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .eq('status', 'accepted')
        .gte('responded_at', fourteenDaysAgo),
      supabase
        .from('profile_views')
        .select('id', { count: 'exact', head: true })
        .eq('viewed_user_id', userId),
      supabase
        .from('users')
        .select('id, full_name, unique_id, avatar_url, last_seen')
        .eq('role', 'senior')
        .order('created_at', { ascending: false })
        .limit(6),
    ])

    // Build exclusion set from connections (JS-side, no I/O)
    const excludeIds = new Set<string>([userId])
    for (const conn of connectedResult.data || []) {
      excludeIds.add(conn.sender_id === userId ? conn.receiver_id : conn.sender_id)
    }

    // Filter mentors to exclude already-connected users
    const filteredMentors = (mentorsResult.data || [])
      .filter(m => !excludeIds.has(m.id))
      .slice(0, 5)

    // Process network growth chart (JS-side, no I/O)
    const dailyConnections: number[] = [0, 0, 0, 0, 0, 0, 0]
    let prevWeekTotal = 0
    if (recentConnectionsResult.data && recentConnectionsResult.data.length > 0) {
      const now = Date.now()
      const dayMs = 86400000
      for (const conn of recentConnectionsResult.data) {
        const ts = new Date(conn.responded_at).getTime()
        const daysAgo = Math.floor((now - ts) / dayMs)
        if (daysAgo >= 0 && daysAgo <= 6) {
          dailyConnections[6 - daysAgo]++
        } else if (daysAgo >= 7 && daysAgo <= 13) {
          prevWeekTotal++
        }
      }
    }

    // Use communities table member_count and senior_count directly (kept up-to-date by syncCommunityCounts)
    // No N+1 queries needed
    const enrichedCommunities = (communitiesResult.data || []).map((comm: any) => ({
      ...comm,
      member_count: comm.member_count || 0,
      senior_count: comm.senior_count || 0,
    }))

    const duration = Date.now() - startTime
    logCacheFetch('network-sidebar', duration, { userId, communitiesCount: enrichedCommunities.length })

    return NextResponse.json({
      mentors: filteredMentors,
      communities: enrichedCommunities,
      platformStats: {
        students: studentsResult.count ?? 0,
        seniors: seniorsResult.count ?? 0,
        colleges: collegesResult.count ?? 0,
        communities: communitiesCountResult.count ?? 0,
      },
      networkGrowth: {
        newConnections: dailyConnections.reduce((a, b) => a + b, 0),
        dailyConnections,
        prevWeekTotal,
        profileViews: profileViewsResult.count ?? 0,
      },
      recentSeniors: recentSeniorsResult.data || [],
    })
  } catch (err: unknown) {
    console.error('Network sidebar API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
