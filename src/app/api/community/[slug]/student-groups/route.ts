import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // Get the main community (college)
    const { data: community, error: communityError } = await supabase
      .from('communities')
      .select('id, college_id')
      .eq('slug', slug)
      .is('parent_community_id', null)
      .single()

    if (communityError || !community) {
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
        member_count,
        created_at,
        created_by,
        creator:users!student_groups_created_by_fkey(id, full_name, avatar_url, role, unique_id)
      `)
      .eq('parent_community_id', community.id)
      .is('is_active', true)
      .order('created_at', { ascending: false })

    if (groupsError) {
      console.error('Groups error:', groupsError)
      return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 })
    }

    // Format groups
    const formattedGroups = (groups || []).map(group => ({
      id: group.id,
      name: group.name,
      display_name: group.name, // Use name as display_name for student groups
      slug: group.slug,
      description: group.description,
      is_private: group.is_private,
      is_ephemeral: false, // Student groups are not ephemeral
      member_count: group.member_count,
      created_at: group.created_at,
      creator_role: group.creator?.[0]?.role || 'student', // Get role from creator array
      creator: group.creator?.[0] || null // Get first creator from array
    }))

    return NextResponse.json({
      groups: formattedGroups,
      total: formattedGroups.length
    })

  } catch (error) {
    console.error('Student groups API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
