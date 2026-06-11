import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser } from '@/lib/session'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Fetch suggested mentors (seniors with high rise_points, not already connected)
    const { data: connectedIds } = await supabase
      .from('connections')
      .select('sender_id, receiver_id')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)

    const excludeIds = new Set<string>([user.id])
    for (const conn of connectedIds || []) {
      excludeIds.add(conn.sender_id === user.id ? conn.receiver_id : conn.sender_id)
    }

    // Suggested Mentors: seniors with highest rise_points
    const { data: mentors } = await supabase
      .from('users')
      .select(`
        id, full_name, unique_id, role, avatar_url, company, designation,
        graduation_year, passout_year, rise_points, last_seen,
        college:college_id (name, short_name)
      `)
      .eq('role', 'senior')
      .order('rise_points', { ascending: false })
      .limit(20)

    const filteredMentors = (mentors || [])
      .filter(m => !excludeIds.has(m.id))
      .slice(0, 5)

    // Trending Communities: top by member_count
    const { data: communities } = await supabase
      .from('communities')
      .select('id, slug, display_name, member_count, senior_count')
      .eq('is_active', true)
      .order('member_count', { ascending: false })
      .limit(5)

    // Platform Stats
    const [studentsResult, seniorsResult, collegesResult, communitiesResult] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'student'),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'senior'),
      supabase.from('colleges').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('communities').select('id', { count: 'exact', head: true }).eq('is_active', true),
    ])

    // Network Growth - daily connections chart (last 7 days)
    const dailyConnections: number[] = [0, 0, 0, 0, 0, 0, 0]
    let prevWeekTotal = 0

    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
    const { data: recentConnections } = await supabase
      .from('connections')
      .select('responded_at')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .eq('status', 'accepted')
      .gte('responded_at', fourteenDaysAgo)

    if (recentConnections && recentConnections.length > 0) {
      const now = Date.now()
      const dayMs = 86400000

      for (const conn of recentConnections) {
        const ts = new Date(conn.responded_at).getTime()
        const daysAgo = Math.floor((now - ts) / dayMs)
        if (daysAgo >= 0 && daysAgo <= 6) {
          dailyConnections[6 - daysAgo]++
        } else if (daysAgo >= 7 && daysAgo <= 13) {
          prevWeekTotal++
        }
      }
    }

    const [profileViewsResult] = await Promise.all([
      supabase
        .from('profile_views')
        .select('id', { count: 'exact', head: true })
        .eq('viewed_user_id', user.id),
    ])

    // Recently joined seniors
    const { data: recentSeniors } = await supabase
      .from('users')
      .select('id, full_name, unique_id, avatar_url, last_seen')
      .eq('role', 'senior')
      .order('created_at', { ascending: false })
      .limit(6)

    return NextResponse.json({
      mentors: filteredMentors,
      communities: communities || [],
      platformStats: {
        students: studentsResult.count ?? 0,
        seniors: seniorsResult.count ?? 0,
        colleges: collegesResult.count ?? 0,
        communities: communitiesResult.count ?? 0,
      },
      networkGrowth: {
        newConnections: dailyConnections.reduce((a, b) => a + b, 0),
        dailyConnections,
        prevWeekTotal,
        profileViews: profileViewsResult.count ?? 0,
      },
      recentSeniors: recentSeniors || [],
    })
  } catch (err: unknown) {
    console.error('Network sidebar API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
