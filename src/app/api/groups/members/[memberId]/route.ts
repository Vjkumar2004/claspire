import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser } from '@/lib/session'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const { memberId } = await params
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id

    // Get member details to check group and permissions
    console.log('Looking up member with ID:', memberId)
    const { data: member, error: memberError } = await supabase
      .from('student_group_members')
      .select(`
        id,
        group_id,
        role,
        user_id,
        student_groups!inner(
          created_by,
          member_count
        )
      `)
      .eq('id', memberId)
      .single()

    console.log('Member lookup result:', { member, memberError })

    if (memberError || !member) {
      console.error('Member not found error details:', memberError)
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Check if user is admin or creator
    const { data: userMembership } = await supabase
      .from('student_group_members')
      .select('role')
      .eq('group_id', member.group_id)
      .eq('user_id', userId)
      .single()

    const isAdmin = userMembership?.role === 'admin' || member.student_groups[0].created_by === userId

    if (!isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Cannot remove yourself or other admins
    if (member.user_id === userId || member.role === 'admin') {
      return NextResponse.json({ error: 'Cannot remove this user' }, { status: 400 })
    }

    // Remove member from group
    const { error: deleteError } = await supabase
      .from('student_group_members')
      .delete()
      .eq('id', memberId)

    if (deleteError) {
      console.error('Remove member error:', deleteError)
      return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 })
    }

    // Update group member count
    await supabase
      .from('student_groups')
      .update({ member_count: Math.max(0, (member.student_groups[0].member_count || 0) - 1) })
      .eq('id', member.group_id)

    return NextResponse.json({ 
      success: true,
      message: 'Member removed successfully'
    })

  } catch (error) {
    console.error('Remove member API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
