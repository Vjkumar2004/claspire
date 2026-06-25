import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser } from '@/lib/session'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    )
    const { memberId } = await params
    const { is_blocked } = await request.json()

    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id

    // Get member details to check group and permissions
    const { data: member, error: memberError } = await supabase
      .from('student_group_members')
      .select(`
        group_id,
        user_id,
        role,
        student_groups!inner(
          created_by
        )
      `)
      .eq('id', memberId)
      .single()

    if (memberError || !member) {
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

    // Cannot block yourself or other admins
    if (member.user_id === userId || member.role === 'admin') {
      return NextResponse.json({ error: 'Cannot block this user' }, { status: 400 })
    }

    // Update member block status
    const { error: updateError } = await supabase
      .from('student_group_members')
      .update({ is_blocked })
      .eq('id', memberId)

    if (updateError) {
      console.error('Block update error:', updateError)
      
      // If the error is about is_blocked column, it means the column doesn't exist
      if (updateError.message?.includes('is_blocked')) {
        return NextResponse.json({ 
          error: 'Blocking feature is not available. Please add the is_blocked column to the database.',
          needsDatabaseUpdate: true
        }, { status: 400 })
      }
      
      return NextResponse.json({ error: 'Failed to update member status' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: is_blocked ? 'Member blocked successfully' : 'Member unblocked successfully'
    })

  } catch (error) {
    console.error('Block member API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
