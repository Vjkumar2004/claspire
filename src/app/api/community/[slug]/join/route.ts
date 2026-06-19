import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  getCommunityDisplayCounts,
  syncCommunityCounts,
  resolveCommunityCollegeId,
  normalizeCollegeRelation,
} from '@/lib/community-stats'
import { getAuthenticatedUser } from '@/lib/session'
import { createNotification } from '@/lib/notifications'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // SECURITY: Use signed session verification instead of direct cookie parsing
    // Direct JSON.parse(cookie.value) is unsafe because cookies can be modified
    // via DevTools or proxy tools, allowing session hijacking and privilege escalation
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const userId = user.id
    const userRole = user.role

    // Get community
    const { data: community } = await supabase
      .from('communities')
      .select('id, college_id, slug, colleges ( id )')
      .eq('slug', slug)
      .single()

    if (!community) {
      return NextResponse.json(
        { error: 'Community not found' },
        { status: 404 }
      )
    }

    const collegeId = await resolveCommunityCollegeId(
      supabase,
      community,
      normalizeCollegeRelation((community as { colleges?: unknown }).colleges)
    )

    // Check already member
    const { data: existing } = await supabase
      .from('community_members')
      .select('id, membership_type')
      .eq('community_id', community.id)
      .eq('user_id', userId)
      .maybeSingle()

    if (existing) {
      const { totalMembers, seniorCount } = await getCommunityDisplayCounts(
        supabase,
        community.id,
        collegeId
      )
      return NextResponse.json({
        success: true,
        message: 'Already a member',
        alreadyMember: true,
        memberCount: totalMembers,
        seniorCount,
      })
    }

    // Get user college to determine type
    const { data: userData } = await supabase
      .from('users')
      .select('college_id, is_verified')
      .eq('id', userId)
      .single()

    const isOwnCollege = !!collegeId && userData?.college_id === collegeId

    // Insert member
    const { error: insertError } = await supabase
      .from('community_members')
      .insert({
        community_id: community.id,
        user_id: userId,
        membership_type: isOwnCollege ? 'joined' : 'following',
        joined_at: new Date().toISOString()
      })

    if (insertError) {
      console.error('Join insertion error:', insertError)
      return NextResponse.json({ error: 'Failed to join community' }, { status: 500 })
    }

    const { totalMembers, seniorCount } = await syncCommunityCounts(supabase, community.id, collegeId)

    // RP for joining new community
    if (!isOwnCollege) {
      const { data: rpUser } = await supabase
        .from('users')
        .select('rise_points')
        .eq('id', userId)
        .single()

      await supabase
        .from('rise_points_log')
        .insert({
          user_id: userId,
          points: 2,
          reason: `Joined c/${slug} network`,
          created_at: new Date().toISOString()
        })

      await supabase
        .from('users')
        .update({
          rise_points: (rpUser?.rise_points || 0) + 2
        })
        .eq('id', userId)
    }

    // Welcome notification for joining
    try {
      await createNotification({
        receiver_id: userId,
        type: 'post_in_community',
        title: `Welcome to c/${slug} 🎉`,
        message: isOwnCollege
          ? 'You joined your college community! Start exploring posts.'
          : 'You joined this network! Follow discussions and connect with members.',
        link: `/community/c/${slug}`
      })
    } catch (joinNotifErr) {
      console.error('Join notification error:', joinNotifErr)
    }

    return NextResponse.json({
      success: true,
      message: isOwnCollege ? 'Joined community!' : 'Joined network!',
      isJoined: true,
      memberCount: totalMembers,
      seniorCount
    })

  } catch (err: any) {
    console.error('Join error:', err)
    return NextResponse.json(
      { error: 'Failed to join' },
      { status: 500 }
    )
  }
}
