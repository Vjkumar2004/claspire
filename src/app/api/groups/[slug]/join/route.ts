import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createNotification, sendPushToUsers } from '@/lib/notifications'
import { getAuthenticatedUser } from '@/lib/session'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    )
    const { slug } = await params

    // Auth check
    // SECURITY: Use signed session verification instead of direct cookie parsing
    // Direct JSON.parse(cookie.value) is unsafe because cookies can be modified
    // via DevTools or proxy tools, allowing session hijacking and privilege escalation
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized - No session found' }, { status: 401 })
    }

    const userId = user.id

    // Get group details by slug
    const { data: group, error: groupError } = await supabase
      .from('student_groups')
      .select('id, name, slug, is_active, member_count, college_id, scope, is_private, created_by, colleges (slug, name)')
      .eq('slug', slug)
      .single()

    if (groupError || !group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    if (!group.is_active) {
      return NextResponse.json({ error: 'Group is not active' }, { status: 400 })
    }

    // Get user's college
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('college_id')
      .eq('id', userId)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Only restrict for college-only groups
    if (group.scope === 'college' && userData.college_id !== group.college_id) {
      return NextResponse.json({ 
        error: 'This group is only available for students from your college',
        collegeRestricted: true 
      }, { status: 403 })
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('student_group_members')
      .select('id')
      .eq('group_id', group.id)
      .eq('user_id', userId)
      .single()

    if (existingMember) {
      return NextResponse.json({ joined: true, alreadyMember: true })
    }

    // If private group, send join request instead
    if (group.is_private || group.scope === 'private') {
      const { error: requestError } = await supabase
        .from('student_group_join_requests')
        .upsert({
          group_id: group.id,
          user_id: userId,
          status: 'pending',
          requested_at: new Date().toISOString()
        }, { onConflict: 'group_id,user_id', ignoreDuplicates: false })

      if (requestError) {
        return NextResponse.json({ error: 'Failed to send request' }, { status: 500 })
      }

      const college = Array.isArray(group.colleges) ? group.colleges[0] : group.colleges
      const communitySlug = college?.slug || college?.name?.toLowerCase().replace(/\s+/g, '-') || 'groups'
      const link = `/community/c/${communitySlug}/group/${group.slug}`
      const requesterName = user.full_name || user.name || 'Someone'

      if (group.created_by && group.created_by !== userId) {
        await createNotification({
          receiver_id: group.created_by,
          sender_id: userId,
          type: 'group_join_request',
          title: 'New private group request',
          message: `${requesterName} requested to join ${group.name}.`,
          link
        })
        await sendPushToUsers(
          [group.created_by],
          'New private group request',
          `${requesterName} requested to join ${group.name}.`,
          link
        )
      }

      return NextResponse.json({ requested: true })
    }

    // Add user to group
    const { error: joinError } = await supabase
      .from('student_group_members')
      .insert({
        group_id: group.id,
        user_id: userId,
        role: 'member'
      })

    if (joinError) {
      console.error('Join error:', joinError)
      return NextResponse.json({ error: 'Failed to join group' }, { status: 500 })
    }

    // Update member count and reset auto_delete_at
    await supabase
      .from('student_groups')
      .update({
        member_count: (group.member_count || 0) + 1,
        auto_delete_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', group.id)

    return NextResponse.json({ joined: true })

  } catch (error) {
    console.error('Join group API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
