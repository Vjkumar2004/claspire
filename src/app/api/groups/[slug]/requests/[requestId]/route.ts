import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser } from '@/lib/session'
import { createNotification, sendPushToUsers } from '@/lib/notifications'

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

    // SECURITY: Use signed session verification instead of direct cookie parsing
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin
    const { data: group } = await supabase
      .from('student_groups')
      .select('id, name, slug, created_by, member_count, colleges (slug, name)')
      .eq('slug', slug)
      .single()

    if (!group || group.created_by !== user.id) {
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

    if (action !== 'accept' && action !== 'reject') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Update request status
    await supabase
      .from('student_group_join_requests')
      .update({
        status: action === 'accept' ? 'accepted' : 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id
      })
      .eq('id', requestId)

    // If accepted, add to members
    if (action === 'accept') {
      await supabase
        .from('student_group_members')
        .upsert({
          group_id: group.id,
          user_id: joinRequest.user_id,
          role: 'member'
        })

      await supabase
        .from('student_groups')
        .update({
          member_count: (group.member_count || 0) + 1,
          auto_delete_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', group.id)
    }

    const college = Array.isArray(group.colleges) ? group.colleges[0] : group.colleges
    const communitySlug = college?.slug || college?.name?.toLowerCase().replace(/\s+/g, '-') || 'groups'
    const link = `/community/c/${communitySlug}/group/${group.slug}`
    const accepted = action === 'accept'
    const title = accepted ? 'Group request accepted' : 'Group request declined'
    const message = accepted
      ? `Your request to join ${group.name} was accepted.`
      : `Your request to join ${group.name} was declined.`

    await createNotification({
      receiver_id: joinRequest.user_id,
      sender_id: user.id,
      type: accepted ? 'group_join_accepted' : 'group_join_rejected',
      title,
      message,
      link
    })
    await sendPushToUsers([joinRequest.user_id], title, message, link)

    return NextResponse.json({ success: true, action })

  } catch (error) {
    console.error('Review request error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
