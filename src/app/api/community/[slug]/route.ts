import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // 1. Get current user
    let currentUser = null
    const cookie = req.cookies.get('claspire_session')
    if (cookie) {
      try {
        currentUser = JSON.parse(cookie.value)
      } catch {}
    }

    // 2. Fetch community + college
    const { data: community } = await supabase
      .from('communities')
      .select(`
        *,
        colleges (
          id, name, short_name, slug,
          type, location, state
        )
      `)
      .eq('slug', slug)
      .single()

    // If community not found and it's aaacet, return mock data for testing
    if (!community && slug === 'aaacet') {
      const mockCommunity = {
        id: 'mock-aaacet',
        slug: 'aaacet',
        display_name: 'AAA College of Engineering and Technology',
        description: 'Official AAACET community on Claspire — AAA College of Engineering and Technology, Sivakasi',
        member_count: 0,
        senior_count: 0,
        doubt_count: 0,
        colleges: {
          id: 'mock-college-aaacet',
          name: 'AAA College of Engineering and Technology',
          short_name: 'AAACET',
          slug: 'aaacet',
          type: 'Private',
          location: 'Sivakasi',
          state: 'Tamil Nadu'
        }
      }

      const mockPosts = [
        {
          id: 'mock-post-1',
          title: 'What are the placement opportunities for Mechanical students at AAACET?',
          content: 'I\'m a 3rd year Mechanical student at AAACET. I want to know about the placement opportunities and which companies visit our campus for mechanical engineering roles.',
          type: 'doubt',
          upvote_count: 15,
          answer_count: 3,
          view_count: 245,
          is_answered: true,
          is_pinned: false,
          created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          tags: ['placement', 'mechanical', 'aaacet'],
          users: {
            full_name: 'Mohan Prakash',
            unique_id: 'MP2021',
            role: 'student',
            rise_points: 150
          }
        }
      ]

      const mockJobs = [
        {
          id: 'mock-job-1',
          role: 'Junior Design Engineer',
          company_name: 'Larsen & Toubro',
          salary_range: '4-6 LPA',
          location: 'Chennai',
          job_type: 'full_time',
          referral_available: true,
          created_at: new Date().toISOString()
        }
      ]

      const mockWebinars = [
        {
          id: 'mock-webinar-1',
          title: 'Career Guidance for Mechanical Engineers',
          scheduled_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          price: 0,
          max_seats: 100,
          registered_count: 45,
          status: 'upcoming',
          users: {
            full_name: 'Rajesh Kumar',
            designation: 'Senior Design Engineer',
            company: 'L&T'
          }
        }
      ]

      // Mock user as guest for testing
      const userRole = 'guest'
      const canPost = false
      const canViewJobs = false
      const canViewWebinars = false
      const canPostJob = false
      const canHostWebinar = false

      return NextResponse.json({
        community: mockCommunity,
        verifiedJuniors: 1156,
        verifiedSeniors: 89,
        posts: mockPosts,
        jobs: mockJobs,
        webinars: mockWebinars,
        userRole,
        canPost,
        canViewJobs,
        canViewWebinars,
        canPostJob,
        canHostWebinar
      })
    }

    // If still no community, return 404
    if (!community) {
      return NextResponse.json(
        { error: 'Community not found' },
        { status: 404 }
      )
    }

    // 3. Get verified counts
    const { data: members } = await supabase
      .from('community_members')
      .select(`
        membership_type,
        users (
          role, is_verified
        )
      `)
      .eq('community_id', community.id)
      .eq('membership_type', 'joined')

    console.log('All members for community:', community.id, members)

    // Also check all verified users in this college (not just joined members)
    const { data: collegeUsers } = await supabase
      .from('users')
      .select('role, is_verified')
      .eq('college_id', community.colleges.id)
      .eq('is_verified', true)

    console.log('All verified users in college:', community.colleges.id, collegeUsers)

    const verifiedJuniors = members?.filter(
      (m: any) => m.users?.role === 'student' && 
           m.users?.is_verified
    ).length || 0

    const verifiedSeniors = members?.filter(
      (m: any) => m.users?.role === 'senior' && 
           m.users?.is_verified
    ).length || 0

    // Alternative count: count all verified students in the college
    const allVerifiedJuniorsInCollege = collegeUsers?.filter(
      (u: any) => u.role === 'student'
    ).length || 0

    const allVerifiedSeniorsInCollege = collegeUsers?.filter(
      (u: any) => u.role === 'senior'
    ).length || 0

    console.log('Verified juniors count (joined members):', verifiedJuniors)
    console.log('Verified seniors count (joined members):', verifiedSeniors)
    console.log('All verified juniors in college:', allVerifiedJuniorsInCollege)
    console.log('All verified seniors in college:', allVerifiedSeniorsInCollege)

    // Use the broader count if joined members count is 0
    const finalJuniorsCount = verifiedJuniors > 0 ? verifiedJuniors : allVerifiedJuniorsInCollege
    const finalSeniorsCount = verifiedSeniors > 0 ? verifiedSeniors : allVerifiedSeniorsInCollege

    // Check if current user is already a member of this community
    let isAlreadyMember = false
    if (currentUser) {
      console.log('Checking membership for user:', currentUser.id, 'in community:', community.id)
      const { data: userMembership, error } = await supabase
        .from('community_members')
        .select('membership_type')
        .eq('community_id', community.id)
        .eq('user_id', currentUser.id)
        .single()
      
      console.log('User membership result:', { userMembership, error })
      isAlreadyMember = !!userMembership
      console.log('Is already member (from DB):', isAlreadyMember)
    }

    // 4. Compute userRole
    let userRole = 'guest'

    if (currentUser) {
      const isOwnCollege =
        currentUser.college_id ===
        community.colleges.id

      // ADD debug log temporarily:
      console.log('User college_id:', currentUser.college_id)
      console.log('Community college_id:', community.colleges.id)
      console.log('Match:', currentUser.college_id === community.colleges.id)

      const isSenior = currentUser.role === 'senior'
      const isVerified = currentUser.is_verified
      const isPremium = currentUser.is_premium

      if (isOwnCollege && isVerified && isSenior) {
        userRole = 'own_senior'
        // If user is from own college and verified, they're automatically a member
        isAlreadyMember = true
      } else if (isOwnCollege && isVerified) {
        userRole = 'own_junior'
        // If user is from own college and verified, they're automatically a member
        isAlreadyMember = true
      } else if (isPremium) {
        userRole = 'premium'
      } else {
        userRole = 'other_college'
      }
      
      console.log('Final userRole:', userRole)
      console.log('Final isAlreadyMember:', isAlreadyMember)
    }

    // 5. Always fetch posts (all can see feed)
    const { data: posts } = await supabase
      .from('posts')
      .select(`
        id, title, content, type,
        upvote_count, answer_count,
        view_count, is_answered,
        is_pinned, created_at, tags,
        users (
          full_name, unique_id,
          role, rise_points, is_verified
        )
      `)
      .eq('community_id', community.id)
      .eq('is_active', true)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(20)

    // 6. Fetch jobs only if permitted
    let jobs = null
    const canViewJobs = [
      'own_junior', 'own_senior', 'premium'
    ].includes(userRole)

    if (canViewJobs) {
      const { data } = await supabase
        .from('jobs')
        .select('*')
        .eq('community_id', community.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(10)
      jobs = data || []
    }

    // 7. Fetch webinars only if permitted
    let webinars = null
    const canViewWebinars = [
      'own_junior', 'own_senior', 'premium'
    ].includes(userRole)

    if (canViewWebinars) {
      const { data } = await supabase
        .from('webinars')
        .select(`
          *,
          users (
            full_name, designation, company
          )
        `)
        .eq('community_id', community.id)
        .in('status', ['upcoming', 'live'])
        .order('scheduled_at', { ascending: true })
        .limit(5)
      webinars = data || []
    }

    return NextResponse.json({
      success: true,
      community,
      verifiedJuniors: finalJuniorsCount,
      verifiedSeniors: finalSeniorsCount,
      posts: posts || [],
      jobs,
      webinars,
      userRole,
      isAlreadyMember,
      canPost: ['own_junior', 'own_senior']
        .includes(userRole),
      canAnswer: userRole === 'own_senior',
      canPostJob: userRole === 'own_senior',
      canHostWebinar: userRole === 'own_senior',
      canViewJobs,
      canViewWebinars,
    })

  } catch (err: any) {
    console.error('Community fetch error:', err)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}
