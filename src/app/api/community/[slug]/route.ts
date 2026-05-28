import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getCommunityDisplayCounts, resolveCommunityCollegeId } from '@/lib/community-stats'

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

    // 2. Fetch community + college (check both communities and student_groups tables)
    let community = null
    
    // First try communities table
    const { data: mainCommunity } = await supabase
      .from('communities')
      .select(`
        *,
        colleges (
          id, name, short_name, slug,
          type, location, state, logo_url
        )
      `)
      .eq('slug', slug)
      .single()

    if (mainCommunity) {
      community = mainCommunity
    } else {
      // If not found, try student_groups table
      const { data: studentGroup } = await supabase
        .from('student_groups')
        .select(`
          *,
          parent_community:communities(
            *,
            colleges (
              id, name, short_name, slug,
              type, location, state, logo_url
            )
          )
        `)
        .eq('slug', slug)
        .single()

      if (studentGroup) {
        // Transform student group to community format
        community = {
          ...studentGroup,
          display_name: studentGroup.name,
          colleges: studentGroup.parent_community?.colleges || null,
          is_student_group: true
        }
      }
    }

    if (!community) {
      const { data: college } = await supabase
        .from('colleges')
        .select('id, name, short_name, slug, type, location, state, logo_url')
        .eq('slug', slug)
        .single()

      if (college) {
        const { data: collegeUsers } = await supabase
          .from('users')
          .select('role, is_verified')
          .eq('college_id', college.id)

        const { data: createdCommunity } = await supabase
          .from('communities')
          .insert({
            display_name: college.short_name || college.name,
            slug: college.slug,
            description: `${college.name} community on Claspire`,
            college_id: college.id,
            parent_community_id: null,
            is_private: false,
            is_ephemeral: false,
            member_count: collegeUsers?.length || 0,
            senior_count: collegeUsers?.filter((user: any) => user.role === 'senior').length || 0,
            doubt_count: 0,
            updated_at: new Date().toISOString()
          })
          .select(`
            *,
            colleges (
              id, name, short_name, slug,
              type, location, state, logo_url
            )
          `)
          .single()

        community = createdCommunity || {
            id: college.id,
            slug: college.slug,
            display_name: college.short_name || college.name,
            description: `${college.name} community on Claspire`,
            member_count: collegeUsers?.length || 0,
            senior_count: collegeUsers?.filter((user: any) => user.role === 'senior').length || 0,
            doubt_count: 0,
            college_id: college.id,
            colleges: college,
            is_college_fallback: true
          }
      }
    }

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

    const collegeId = await resolveCommunityCollegeId(
      supabase,
      community,
      community.colleges
    )
    const {
      totalMembers,
      seniorCount,
      ownStudentCount,
      otherCollegeStudentCount,
      collegeId: resolvedCollegeId,
    } = await getCommunityDisplayCounts(supabase, community.id, collegeId)

    const { count: communityPostCount } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('community_id', community.id)

    community = {
      ...community,
      member_count: totalMembers,
      senior_count: seniorCount,
      doubt_count: Math.max(community.doubt_count || 0, communityPostCount || 0),
    }

    // Check if current user is already a member of this community
    let isAlreadyMember = false
    let isOwnCollege = false
    
    if (currentUser) {
      console.log('Checking membership for user:', currentUser.id, 'in community:', community.id)
      
      isOwnCollege =
        !!resolvedCollegeId && currentUser.college_id === resolvedCollegeId

      const { data: userMembership } = await supabase
        .from('community_members')
        .select('membership_type')
        .eq('community_id', community.id)
        .eq('user_id', currentUser.id)
        .maybeSingle()
      
      isAlreadyMember = !!userMembership
      console.log('Membership check result:', { userId: currentUser.id, isAlreadyMember, userMembership })
      console.log('Is already member (from DB):', isAlreadyMember)
    }

    // 4. Compute userRole
    let userRole = 'guest'

    if (currentUser) {
      // Fetch latest user data from DB to ensure user status is synced
      const { data: dbUser } = await supabase
        .from('users')
        .select('is_verified, role, college_id')
        .eq('id', currentUser.id)
        .single()

      const userToUse = dbUser || currentUser
      const isSenior = userToUse.role === 'senior'
      const isVerified = userToUse.is_verified
      const userCollegeId = userToUse.college_id

      isOwnCollege =
        !!resolvedCollegeId && userCollegeId === resolvedCollegeId

      console.log('User permissions refreshed from DB:', { isVerified, isOwnCollege, resolvedCollegeId })

      if (isOwnCollege && isVerified && isSenior) {
        userRole = 'own_senior'
        // If user is from own college and verified, they're automatically a member
        isAlreadyMember = true
      } else if (isOwnCollege && isVerified) {
        userRole = 'own_junior'
        // If user is from own college and verified, they're automatically a member
        isAlreadyMember = true
      } else if (isSenior) {
        userRole = 'senior'
        // Seniors can view all communities
      } else {
        userRole = 'other_college'
      }
      
      console.log('Final userRole:', userRole)
      console.log('Final isAlreadyMember:', isAlreadyMember)
    }

    const postSelect = `
        id, title, content, type,
        upvote_count, answer_count,
        view_count, is_answered,
        is_pinned, created_at, tags,
        users!posts_author_id_fkey (
          full_name, unique_id,
          role, is_verified, avatar_url
        )
      `

    // 5. Fetch native community posts (all can see feed)
    const { data: nativePosts } = await supabase
      .from('posts')
      .select(postSelect)
      .eq('community_id', community.id)
      .or(
        isOwnCollege
          ? 'visibility.eq.public,visibility.eq.private'
          : 'visibility.eq.public'
      )
      .order('created_at', { ascending: false })
      .limit(50)

    // Posts from cross-college followers (shown first in feed)
    const { data: followingMembers } = await supabase
      .from('community_members')
      .select('user_id')
      .eq('community_id', community.id)
      .eq('membership_type', 'following')

    const followingUserIds = (followingMembers || []).map((m: { user_id: string }) => m.user_id)

    let networkPosts: any[] = []
    if (followingUserIds.length > 0) {
      const { data: followingAuthors } = await supabase
        .from('users')
        .select('id, college_id')
        .in('id', followingUserIds)

      const collegeIds = [
        ...new Set(
          (followingAuthors || [])
            .map((a: { college_id?: string }) => a.college_id)
            .filter(Boolean)
        ),
      ] as string[]

      if (collegeIds.length > 0) {
        const { data: homeCommunities } = await supabase
          .from('communities')
          .select('id')
          .in('college_id', collegeIds)

        const homeCommunityIds = (homeCommunities || []).map((c: { id: string }) => c.id)

        if (homeCommunityIds.length > 0) {
          const { data: crossPosts } = await supabase
            .from('posts')
            .select(postSelect)
            .in('author_id', followingUserIds)
            .in('community_id', homeCommunityIds)
            .eq('visibility', 'public')
            .order('created_at', { ascending: false })
            .limit(20)

          networkPosts = (crossPosts || []).map((p: any) => ({
            ...p,
            is_network_post: true,
          }))
        }
      }
    }

    const seenPostIds = new Set<string>()
    const posts: any[] = []

    for (const p of networkPosts) {
      if (!seenPostIds.has(p.id)) {
        posts.push(p)
        seenPostIds.add(p.id)
      }
    }

    const sortedNative = [...(nativePosts || [])].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    for (const p of sortedNative) {
      if (!seenPostIds.has(p.id)) {
        posts.push(p)
        seenPostIds.add(p.id)
      }
    }

    // 6. Fetch jobs only if permitted
    let jobs = null
    const canViewJobs = [
      'own_junior', 'own_senior', 'senior'
    ].includes(userRole) || (userRole === 'other_college' && isAlreadyMember)

    if (canViewJobs) {
      const { data } = await supabase
        .from('jobs')
        .select('*')
        .eq('community_id', community.id)
        .order('created_at', { ascending: false })
        .limit(50)

      jobs = data || []
    }

    // 7. Fetch webinars only if permitted
    let webinars = null
    const canViewWebinars = [
      'own_junior', 'own_senior', 'senior'
    ].includes(userRole) || (userRole === 'other_college' && isAlreadyMember)

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
      verifiedJuniors: ownStudentCount,
      verifiedSeniors: seniorCount,
      totalMembers,
      seniorCount,
      ownStudentCount,
      otherCollegeStudentCount,
      posts: posts || [],
      jobs,
      webinars,
      userRole,
      isAlreadyMember,
      isJoined: isAlreadyMember,
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
