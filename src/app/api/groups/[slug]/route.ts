import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser } from '@/lib/session'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    if (!slug) {
      return NextResponse.json({ error: 'Group slug is required' }, { status: 400 })
    }

    // Create admin client for DB queries
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // SECURITY: Use signed session verification instead of direct cookie parsing
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const currentUserId = user.id

    // Get group details
    const { data: group, error: groupError } = await supabase
      .from('student_groups')
      .select(`*, colleges (id, slug, name)`)
      .eq('slug', slug)
      .single()

    if (groupError || !group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Check membership
    let isMember = false
    let isAdmin = false
    let isBlocked = false

    if (currentUserId) {
      const { data: membership } = await supabase
        .from('student_group_members')
        .select('role, is_blocked')
        .eq('group_id', group.id)
        .eq('user_id', currentUserId)
        .single()

      isMember = !!membership
      isAdmin = membership?.role === 'admin' || group.created_by === currentUserId
      isBlocked = membership?.is_blocked || false
    }

    // Get members with user details
    const { data: membersData } = await supabase
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

    const formattedMembers = (membersData ?? []).map((m: any) => ({
      id: m.users?.id || m.id,
      full_name: m.users?.full_name || 'Unknown User',
      avatar_url: m.users?.avatar_url || null,
      role: m.users?.role || 'student',
      is_verified: m.users?.is_verified || false,
      membership_role: m.role,
      joined_at: m.joined_at
    }))

    // Auto-delete messages older than 1 day (lazy cleanup)
    const oneDayAgo = new Date()
    oneDayAgo.setDate(oneDayAgo.getDate() - 1)
    
    await supabase
      .from('student_group_messages')
      .delete()
      .eq('group_id', group.id)
      .lt('created_at', oneDayAgo.toISOString())

    // Get messages with sender details
    const { data: messagesData } = await supabase
      .from('student_group_messages')
      .select(`
        id,
        content,
        created_at,
        sender_id,
        users!student_group_messages_sender_id_fkey (
          id,
          full_name,
          avatar_url,
          role,
          unique_id
        )
      `)
      .eq('group_id', group.id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })
      .limit(50)

    const formattedMessages = (messagesData ?? []).map((m: any) => ({
      id: m.id,
      content: m.content,
      created_at: m.created_at,
      sender: m.users
    }))

    return NextResponse.json({
      group: {
        id: group.id,
        name: group.name,
        display_name: group.name,
        slug: group.slug,
        description: group.description,
        is_private: group.is_private,
        scope: group.scope || 'college',
        is_ephemeral: false,
        member_count: group.member_count,
        created_at: group.created_at,
        created_by: group.created_by,
        auto_delete_at: group.auto_delete_at,
        creator: null,
        creator_role: null,
        college: group.colleges
      },
      members: formattedMembers,
      messages: formattedMessages,
      isMember,
      isAdmin,
      isBlocked,
      canMessage: isMember && !isBlocked
    })

  } catch (error) {
    console.error('Group details API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}