import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // Get session from cookie for auth
    const session = request.cookies.get('claspire_session')
    
    if (!session?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let cookieUser
    try {
      cookieUser = JSON.parse(session.value)
    } catch (parseError) {
      return NextResponse.json({ error: 'Invalid session data' }, { status: 401 })
    }

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
