import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { resolveDisplayBio, resolveProfileData } from '@/lib/profile-data'
import { getAuthenticatedUser } from '@/lib/session'

export async function GET(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  try {
    const authenticatedUser = await getAuthenticatedUser(req)
    if (!authenticatedUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const userId = authenticatedUser.id

    const baseSelect = `
      id, full_name, email, role,
      unique_id, rise_points, rp_level,
      doubt_count, answer_count,
      referral_count, webinar_count,
      is_verified, verification_status,
      is_premium,
      avatar_url, banner_url, bio, branch, year,
      passout_year, linkedin_url,
      company, designation, graduation_year,
      last_visit_date,
      colleges (
        id, name, short_name, slug
      )
    `

    const userSelect = `${baseSelect}, profile_data`

    // --- PHASE 1: Fetch all essential data in parallel ---
    const [
      userResult,
      rpLogResult,
      myPostsResult,
      unreadCountResult,
      myReferralsResult,
      joinedCommunitiesResult,
      myJobsResult
    ] = await Promise.all([
      supabase.from('users').select(userSelect).eq('id', userId).single(),
      supabase.from('rise_points_log').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(6),
      supabase.from('posts').select(`
        id, title, content, type, image_url,
        visibility, tags, community_id,
        upvote_count, answer_count,
        is_answered, created_at,
        communities ( display_name, slug ),
        users:author_id ( full_name, avatar_url, unique_id )
      `).eq('author_id', userId).order('created_at', { ascending: false }).limit(5),
      supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('receiver_id', userId).eq('is_read', false),
      supabase.from('referral_requests').select(`
        id, status, created_at,
        job:job_id ( company_name, role ),
        senior:senior_id ( id, full_name, avatar_url, unique_id )
      `).eq('requester_id', userId).order('created_at', { ascending: false }).limit(10),
      supabase.from('community_members').select(`
        id,
        communities ( id, slug, display_name )
      `).eq('user_id', userId).eq('membership_type', 'joined'),
      supabase.from('jobs').select('*').eq('posted_by', userId).order('created_at', { ascending: false })
    ])

    let { data: user, error } = userResult;

    if (error?.message?.includes('profile_data')) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('users')
        .select(baseSelect)
        .eq('id', userId)
        .single()
      if (fallbackError || !fallbackData) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }
      user = { ...fallbackData, profile_data: {} }
    } else if (error || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // --- PHASE 2: Conditional fetches ---
    let pendingDoubts: any[] = []
    let pendingReferrals: any[] = []
    let upcomingWebinars: any[] = []

    const phase2Promises: any[] = []

    const userCollege = Array.isArray(user.colleges) ? user.colleges[0] : user.colleges
    if (user.role === 'senior' && userCollege?.id) {
      phase2Promises.push(
        supabase.from('communities').select('id').eq('college_id', userCollege.id).maybeSingle().then(async (commRes) => {
          if (commRes.data) {
            const [doubtsRes, refRes] = await Promise.all([
              supabase.from('posts').select(`
                id, title, content, created_at,
                users:author_id ( id, full_name, role, avatar_url, unique_id )
              `).eq('community_id', commRes.data.id).eq('type', 'doubt').eq('is_answered', false).neq('author_id', userId).order('created_at', { ascending: false }).limit(5),

              supabase.from('referral_requests').select(`
                id, status, created_at,
                job:job_id ( company_name, role ),
                requester:requester_id ( id, full_name, role, unique_id, avatar_url, colleges(name, short_name) )
              `).eq('senior_id', userId).eq('status', 'pending').order('created_at', { ascending: false }).limit(5)
            ])
            pendingDoubts = doubtsRes.data || []
            pendingReferrals = refRes.data || []
          }
        })
      )
    }

    if (joinedCommunitiesResult.data && joinedCommunitiesResult.data.length > 0) {
      const communityIds = joinedCommunitiesResult.data.map((m: any) => m.communities.id)
      phase2Promises.push(
        supabase.from('webinars').select(`
          id, title, description, scheduled_at, duration,
          communities ( display_name ),
          users:instructor_id ( id, full_name, avatar_url, unique_id )
        `).in('community_id', communityIds).in('status', ['upcoming', 'live']).order('scheduled_at', { ascending: true }).limit(10).then((res) => {
          upcomingWebinars = res.data || []
        })
      )
    }

    await Promise.all(phase2Promises)

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        bio: resolveDisplayBio(user.bio),
        profile_data: resolveProfileData(user),
      },
      rpLog: rpLogResult.data || [],
      myPosts: myPostsResult.data || [],
      pendingDoubts,
      pendingReferrals,
      pendingSeniorConnections: [],
      pendingMessageRequests: [],
      myReferrals: myReferralsResult.data || [],
      myJobs: myJobsResult.data || [],
      joinedCommunities: joinedCommunitiesResult.data || [],
      webinars: upcomingWebinars,
      unreadCount: unreadCountResult.count || 0
    })

  } catch (err: any) {
    console.error('Dashboard error:', err)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}
