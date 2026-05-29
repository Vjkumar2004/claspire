import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
    const today = new Date().toISOString().split('T')[0]

    // Fetch user + college
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        id, full_name, email, role,
        unique_id, rise_points, rp_level,
        doubt_count, answer_count,
        referral_count, webinar_count,
        is_verified, verification_status,
        is_premium,
        avatar_url,
        last_visit_date,
        colleges (
          id, name, short_name, slug
        )
      `)
      .eq('id', userId)
      .single()

    if (error || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // ── Rise Points Log (last 6) ──
    const { data: rpLog } = await supabase
      .from('rise_points_log')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(6)

    // ── My Posts (last 5) ──
    const { data: myPosts } = await supabase
      .from('posts')
      .select(`
        id, title, content, type, image_url,
        visibility, tags, community_id,
        upvote_count, answer_count,
        is_answered, created_at,
        communities ( display_name, slug ),
        users:author_id ( full_name, avatar_url, unique_id )
      `)
      .eq('author_id', userId)
      .order('created_at', { ascending: false })
      .limit(5)

    // Sync doubt_count if desynced
    const { count: actualDoubtCount } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', userId)
      .eq('type', 'doubt')

    if (actualDoubtCount !== null && actualDoubtCount !== user.doubt_count) {
      await supabase
        .from('users')
        .update({ doubt_count: actualDoubtCount })
        .eq('id', userId)
      user.doubt_count = actualDoubtCount
    }

    // Sync referral_count for juniors based on approved referral requests
    if (user.role !== 'senior') {
      const { count: actualReferralCount } = await supabase
        .from('referral_requests')
        .select('*', { count: 'exact', head: true })
        .eq('requester_id', userId)
        .eq('status', 'approved')

      if (actualReferralCount !== null && actualReferralCount !== user.referral_count) {
        await supabase
          .from('users')
          .update({ referral_count: actualReferralCount })
          .eq('id', userId)
        user.referral_count = actualReferralCount
      }
    }

    // ── Unread notifications ──
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', userId)
      .eq('is_read', false)

    // ── Pending Doubts, Referrals & Senior Connect Requests (for Seniors) ──
    let pendingDoubts: any[] = []
    let pendingReferrals: any[] = []
    let pendingSeniorConnections: any[] = []
    const userCollege = Array.isArray(user.colleges) ? user.colleges[0] : user.colleges

    if (user.role === 'senior') {
      const { data: srReqs } = await supabaseAdmin
        .from('senior_message_requests')
        .select('*')
        .eq('receiver_id', userId)
        .in('status', ['pending', 'Pending'])
        .order('created_at', { ascending: false })

      if (srReqs && srReqs.length > 0) {
        const senderIds = srReqs.map((r) => r.sender_id)
        const { data: senders } = await supabaseAdmin
          .from('users')
          .select('id, full_name, unique_id, avatar_url, company, designation')
          .in('id', senderIds)

        pendingSeniorConnections = srReqs.map((req) => ({
          ...req,
          sender: senders?.find((s) => s.id === req.sender_id) || null,
        }))
      }
    }

    if (user.role === 'senior' && userCollege?.id) {
      // Find the community for this college
      const { data: comm } = await supabase
        .from('communities')
        .select('id')
        .eq('college_id', userCollege.id)
        .single()

      if (comm) {
        // Fetch Doubts
        const { data: doubts } = await supabase
          .from('posts')
          .select(`
            id, title, content, created_at,
            users:author_id ( id, full_name, role, avatar_url, unique_id )
          `)
          .eq('community_id', comm.id)
          .eq('type', 'doubt')
          .eq('is_answered', false)
          .neq('author_id', userId)
          .order('created_at', { ascending: false })
          .limit(5)
        
        pendingDoubts = doubts || []

        // Fetch Referral Requests
        const { data: referrals } = await supabase
          .from('referral_requests')
          .select(`
            id, status, created_at,
            job:job_id ( company_name, role ),
            requester:requester_id ( id, full_name, role, unique_id, avatar_url, colleges(name, short_name) )
          `)
          .eq('senior_id', userId)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(5)
        
        pendingReferrals = referrals || []
      }
    }

    // ── My Referral Requests (for Juniors/Students to track) ──
    const { data: myReferrals } = await supabase
      .from('referral_requests')
      .select(`
        id, status, created_at,
        job:job_id ( company_name, role ),
        senior:senior_id ( id, full_name, avatar_url, unique_id )
      `)
      .eq('requester_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)

    // ── Joined Communities ──
    const { data: joinedCommunities } = await supabase
      .from('community_members')
      .select(`
        id,
        communities ( id, slug, display_name )
      `)
      .eq('user_id', userId)
      .eq('membership_type', 'joined')

    // ── Available Webinars ──
    let upcomingWebinars: any[] = []
    if (joinedCommunities && joinedCommunities.length > 0) {
      const communityIds = joinedCommunities.map((m: any) => m.communities.id)
      const { data: webinars } = await supabase
        .from('webinars')
        .select(`
          id, title, description, scheduled_at, duration,
          communities ( display_name ),
          users:instructor_id ( id, full_name, avatar_url, unique_id )
        `)
        .in('community_id', communityIds)
        .in('status', ['upcoming', 'live'])
        .order('scheduled_at', { ascending: true })
        .limit(10)
      upcomingWebinars = webinars || []
    }

    return NextResponse.json({
      success: true,
      user,
      rpLog: rpLog || [],
      myPosts: myPosts || [],
      pendingDoubts,
      pendingReferrals,
      pendingSeniorConnections,
      myReferrals: myReferrals || [],
      joinedCommunities: joinedCommunities || [],
      webinars: upcomingWebinars,
      unreadCount: unreadCount || 0
    })

  } catch (err: any) {
    console.error('Dashboard error:', err)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}
