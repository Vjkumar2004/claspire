import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/session'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // SECURITY: Use signed session verification instead of direct cookie parsing
    // Direct JSON.parse(cookie.value) is unsafe because cookies can be modified
    // via DevTools or proxy tools, allowing session hijacking and privilege escalation
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cookieUser = user

    // Get group and verify ownership
    const { data: group, error: groupError } = await supabase
      .from('student_groups')
      .select('id, created_by')
      .eq('slug', slug)
      .single()

    if (groupError || !group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Only creator can delete
    if (group.created_by !== cookieUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete messages first
    const { error: messagesError } = await supabase
      .from('student_group_messages')
      .delete()
      .eq('group_id', group.id)

    if (messagesError) {
      console.error('Messages delete error:', messagesError)
      return NextResponse.json({ error: 'Failed to delete group messages' }, { status: 500 })
    }

    // Delete members
    const { error: membersError } = await supabase
      .from('student_group_members')
      .delete()
      .eq('group_id', group.id)

    if (membersError) {
      console.error('Members delete error:', membersError)
      return NextResponse.json({ error: 'Failed to delete group members' }, { status: 500 })
    }

    // Delete the group itself
    const { error: deleteError } = await supabase
      .from('student_groups')
      .delete()
      .eq('id', group.id)

    if (deleteError) {
      console.error('Group delete error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete group' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Group deleted successfully' })

  } catch (error) {
    console.error('Delete group API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
