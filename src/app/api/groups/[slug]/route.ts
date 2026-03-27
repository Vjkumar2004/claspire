import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
    
    console.log('API: Fetching group with slug:', slug)

    if (!slug) {
      return NextResponse.json({ error: 'Group slug is required' }, { status: 400 })
    }

    // Get group details
    const { data: group, error: groupError } = await supabase
      .from('student_groups')
      .select(`
        *,
        colleges (
          id,
          slug,
          name
        )
      `)
      .eq('slug', slug)
      .single()

    console.log('API: Group data:', group)
    console.log('API: Group error:', groupError)

    if (groupError || !group) {
      console.log('API: Group not found, returning 404')
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Get group members - try proper user join
    const { data: members, error: membersError } = await supabase
      .from('student_group_members')
      .select(`
        id,
        role,
        joined_at,
        users (
          id,
          full_name,
          avatar_url,
          role,
          is_verified
        )
      `)
      .eq('group_id', group.id)
      .order('joined_at', { ascending: true })

    console.log('API: Members data with user join:', members)
    console.log('API: Members error:', membersError)

    // Flatten user data into member object for frontend compatibility
    const flattenedMembers = (members || []).map((member: any) => ({
      id: member.id,
      role: member.role,
      joined_at: member.joined_at,
      membership_role: member.role,
      full_name: member.users?.full_name || 'Unknown User',
      avatar_url: member.users?.avatar_url,
      user_role: member.users?.role,
      is_verified: member.users?.is_verified
    }))

    console.log('API: Flattened members:', flattenedMembers)

    // Get messages
    const { data: messages, error: messagesError } = await supabase
      .from('student_group_messages')
      .select(`
        *,
        sender:users!student_group_messages_sender_id_fkey(id, full_name, avatar_url, role, unique_id)
      `)
      .eq('group_id', group.id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })
      .limit(50)

    if (messagesError) {
      console.error('Messages error:', messagesError)
      // Don't fail the request
    }

    console.log('API: Messages data:', messages)

    // Check user membership and permissions
    let isMember = false
    let isAdmin = false
    let canMessage = false

    // For now, we'll set isMember to true if there are members
    // TODO: Proper authentication check
    if (members && members.length > 0) {
      isMember = true
      canMessage = true
    }

    return NextResponse.json({
      group: {
        id: group.id,
        name: group.name,
        display_name: group.name,
        slug: group.slug,
        description: group.description,
        is_private: group.is_private,
        is_ephemeral: false,
        member_count: group.member_count,
        created_at: group.created_at,
        created_by: group.created_by,
        auto_delete_at: group.auto_delete_at,
        creator: null, // Will be populated on frontend
        creator_role: null,
        college: group.colleges
      },
      members: flattenedMembers ?? [],
      messages: messages || [],
      isMember,
      isAdmin,
      canMessage
    })

  } catch (error) {
    console.error('Group details API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
