import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { resolveDisplayBio, resolveProfileData } from '@/lib/profile-data'

export async function GET(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  )
  try {
    const cookie = req.cookies.get('claspire_session')
    if (!cookie) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const session = JSON.parse(cookie.value)
    const userId = session.id

    const baseSelect = `
      id, full_name, email, role,
      unique_id, rise_points, rp_level,
      doubt_count, answer_count,
      referral_count, webinar_count,
      is_verified, verification_status,
      is_premium,
      avatar_url, bio, branch, year,
      passout_year, linkedin_url,
      company, designation, graduation_year,
      last_visit_date,
      colleges (
        id, name, short_name, slug
      )
    `

    // --- PHASE 1: Fetch all user-dependent data in parallel ---
    const [
      userResult,
      rpLogResult,
      myPostsResult,
      actualDoubtCountResult,
      unreadCountResult,
      myReferralsResult,
      joinedCommunitiesResult
    ] = await Promise.all([
      supabase.from('users').select(`${baseSelect}, profile_data`).eq('id', userId).single(),
      supabase.from('rise_points_log').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(6),
      supabase.from('posts').select(`
        id, title, content, type, image_url,
        visibility, tags, community_id,
        upvote_count, answer_count,
        is_answered, created_at,
        communities ( display_name, slug ),
        users:author_id ( full_name, avatar_url, unique_id )
      `).eq('author_id', userId).order('created_at', { ascending: false }).limit(5),
      supabase.from('posts').select('*', { count: 'exact', head: true }).eq('author_id', userId).eq('type', 'doubt'),
      supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('receiver_id', userId).eq('is_read', false),
      supabase.from('referral_requests').select(`
        id, status, created_at,
        job:job_id ( company_name, role ),
        senior:senior_id ( id, full_name, avatar_url, unique_id )
      `).eq('requester_id', userId).order('created_at', { ascending: false }).limit(10),
      supabase.from('community_members').select(`
        id,
        communities ( id, slug, display_name )
      `).eq('user_id', userId).eq('membership_type', 'joined')
    ])

    let { data: user, error } = userResult;

    if (error?.message?.includes('profile_data')) {
      const fallback = await supabase
        .from('users')
        .select(baseSelect)
        .eq('id', userId)
        .single()
      user = fallback.data ? { ...fallback.data, profile_data: {} } : null
      error = fallback.error
    }

    if (error || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // --- PHASE 2: Parallel conditional fetches ---
    let pendingDoubts: any[] = []
    let pendingReferrals: any[] = []
    let pendingSeniorConnections: any[] = []
    let pendingMessageRequests: any[] = []
    let upcomingWebinars: any[] = []
    
    const phase2Promises: any[] = []

    // 1. Sync doubt count
    if (actualDoubtCountResult.count !== null && actualDoubtCountResult.count !== user.doubt_count) {
      phase2Promises.push(
        supabase.from('users').update({ doubt_count: actualDoubtCountResult.count }).eq('id', userId).then(() => {
          user.doubt_count = actualDoubtCountResult.count
        })
      )
    }

    // 2. Sync referral count
    if (user.role !== 'senior') {
      phase2Promises.push(
        supabase.from('referral_requests').select('*', { count: 'exact', head: true }).eq('requester_id', userId).eq('status', 'approved').then(async (res) => {
          if (res.count !== null && res.count !== user.referral_count) {
            await supabase.from('users').update({ referral_count: res.count }).eq('id', userId)
            user.referral_count = res.count
          }
        })
      )
    }

    // 3. Senior specific tasks
    if (user.role === 'senior') {
      // Senior connections
      phase2Promises.push(
        supabaseAdmin.from('senior_message_requests').select('*').eq('receiver_id', userId).in('status', ['pending', 'Pending']).order('created_at', { ascending: false }).then(async (res) => {
          if (res.data && res.data.length > 0) {
            const senderIds = res.data.map((r) => r.sender_id)
            const sendersRes = await supabaseAdmin.from('users').select('id, full_name, unique_id, avatar_url, company, designation').in('id', senderIds)
            pendingSeniorConnections = res.data.map((req) => ({
              ...req,
              sender: sendersRes.data?.find((s) => s.id === req.sender_id) || null,
            }))
          }
        })
      )

      // Message requests
      phase2Promises.push(
        supabase.from('message_requests').select('id, student_id, senior_id, status, created_at, responded_at').eq('senior_id', userId).eq('status', 'pending').order('created_at', { ascending: false }).then(async (res) => {
          if (res.data && res.data.length > 0) {
            const studentIds = res.data.map(r => r.student_id)
            const studentsRes = await supabase.from('users').select('id, full_name, avatar_url, college_id, branch, year, unique_id').in('id', studentIds)
            
            const collegeIds = [...new Set(studentsRes.data?.map(s => s.college_id).filter(Boolean))]
            let colleges: any[] = []
            if (collegeIds.length > 0) {
              const collegeDataRes = await supabase.from('colleges').select('id, name, short_name, location').in('id', collegeIds)
              colleges = collegeDataRes.data || []
            }
            
            pendingMessageRequests = res.data.map(request => {
              const student = studentsRes.data?.find(s => s.id === request.student_id)
              const college = colleges.find(c => c.id === student?.college_id)
              return {
                id: request.id,
                student_id: request.student_id,
                senior_id: request.senior_id,
                status: request.status,
                created_at: request.created_at,
                responded_at: request.responded_at,
                full_name: student?.full_name || 'Unknown',
                avatar_url: student?.avatar_url || null,
                college_id: student?.college_id || null,
                branch: student?.branch || null,
                year: student?.year || null,
                unique_id: student?.unique_id || null,
                college_name: college?.name || null,
                college_short_name: college?.short_name || null,
                college_location: college?.location || null,
              }
            })
          }
        })
      )
    }

    const userCollege = Array.isArray(user.colleges) ? user.colleges[0] : user.colleges
    if (user.role === 'senior' && userCollege?.id) {
      phase2Promises.push(
        supabase.from('communities').select('id').eq('college_id', userCollege.id).single().then(async (commRes) => {
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

    // 4. Webinars
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

    // Await all phase 2 tasks
    await Promise.all(phase2Promises)

    const userWithProfile = {
      ...user,
      bio: resolveDisplayBio(user.bio),
      profile_data: resolveProfileData(user),
    }

    return NextResponse.json({
      success: true,
      user: userWithProfile,
      rpLog: rpLogResult.data || [],
      myPosts: myPostsResult.data || [],
      pendingDoubts,
      pendingReferrals,
      pendingSeniorConnections,
      pendingMessageRequests,
      myReferrals: myReferralsResult.data || [],
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
