import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; requestId: string }> }
) {
  try {
    const { slug, requestId } = await params
    const { action } = await request.json() // 'accept' or 'reject'

    const cookiesStore = await cookies()
    const sessionCookie = cookiesStore.get('claspire_session')

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cookieUser = JSON.parse(sessionCookie.value)

    // Verify admin
    const { data: group } = await supabase
      .from('student_groups')
      .select('id, created_by, member_count')
      .eq('slug', slug)
      .single()

    if (!group || group.created_by !== cookieUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get request
    const { data: joinRequest } = await supabase
      .from('student_group_join_requests')
      .select('id, user_id, status')
      .eq('id', requestId)
      .single()

    if (!joinRequest || joinRequest.status !== 'pending') {
      return NextResponse.json({ error: 'Request not found or already processed' }, { status: 404 })
    }

    // Update request status
    await supabase
      .from('student_group_join_requests')
      .update({
        status: action === 'accept' ? 'accepted' : 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewed_by: cookieUser.id
      })
      .eq('id', requestId)

    // If accepted, add to members
    if (action === 'accept') {
      await supabase
        .from('student_group_members')
        .insert({
          group_id: group.id,
          user_id: joinRequest.user_id,
          role: 'member'
        })

      await supabase
        .from('student_groups')
        .update({ member_count: (group.member_count || 0) + 1 })
        .eq('id', group.id)
    }

    return NextResponse.json({ success: true, action })

  } catch (error) {
    console.error('Review request error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
