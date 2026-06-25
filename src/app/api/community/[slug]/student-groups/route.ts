import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/session'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // SECURITY: Use signed session verification instead of direct cookie parsing
    const user = await getAuthenticatedUser(request)
    const currentUserId = user?.id || null

    // Get the main community (college)
    const { data: community, error: communityError } = await supabase
      .from('communities')
      .select('id, college_id')
      .eq('slug', slug)
      .is('parent_community_id', null)
      .single()

    let communityId = community?.id
    let collegeId = community?.college_id

    if (!communityId) {
      const { data: college } = await supabase
        .from('colleges')
        .select('id, name, short_name, slug')
        .eq('slug', slug)
        .single()

      if (college) {
        const { data: createdCommunity } = await supabase
          .from('communities')
          .insert({
            display_name: college.short_name || college.name,
            slug: college.slug,
            description: `${college.name} community on Claspire`,
            college_id: college.id,
            parent_community_id: null,
            is_private: false,
            is_ephemeral: false
          })
          .select('id, college_id')
          .single()

        communityId = createdCommunity?.id
        collegeId = createdCommunity?.college_id || college.id
      }
    }

    if (!communityId) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 })
    }

    // Get student groups from student_groups table
    const { data: groups, error: groupsError } = await supabase
      .from('student_groups')
      .select(`
        id,
        name,
        slug,
        description,
        is_private,
        scope,
        member_count,
        created_at,
        created_by,
        creator:users!student_groups_created_by_fkey(id, full_name, avatar_url, role, unique_id)
      `)
      .eq('parent_community_id', communityId)
      .is('is_active', true)
      .order('created_at', { ascending: false })
      .limit(50)

    if (groupsError) {
      console.error('Groups error:', groupsError)
      return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 })
    }

    // Check which groups the current user has joined
    let joinedGroupIds: string[] = []
    if (currentUserId && groups && groups.length > 0) {
      const { data: memberships } = await supabase
        .from('student_group_members')
        .select('group_id')
        .eq('user_id', currentUserId)
        .in('group_id', groups.map(g => g.id))

      joinedGroupIds = memberships?.map(m => m.group_id) || []
    }

    // Format groups
    const formattedGroups = (groups || []).map(group => {
      const creator = Array.isArray(group.creator) ? group.creator[0] : group.creator
      return {
        id: group.id,
        name: group.name,
        display_name: group.name,
        slug: group.slug,
        description: group.description,
        is_private: group.is_private,
        scope: group.scope,
        is_ephemeral: false,
        member_count: group.member_count,
        created_at: group.created_at,
        creator_role: creator?.role || 'student',
        creator: creator || null,
        is_joined: joinedGroupIds.includes(group.id)
      }
    })

    return NextResponse.json({
      groups: formattedGroups,
      total: formattedGroups.length
    })

  } catch (error) {
    console.error('Student groups API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
