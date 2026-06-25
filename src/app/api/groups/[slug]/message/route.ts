import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser } from '@/lib/session'
import { applyRateLimit, getUserIdentifier } from '@/lib/rateLimitRedis'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // Never trust sender_id from client. Always derive from authenticated session.
    // SECURITY: Use signed session verification instead of direct cookie parsing
    // Direct JSON.parse(cookie.value) is unsafe because cookies can be modified
    // via DevTools or proxy tools, allowing session hijacking and privilege escalation
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Rate limiting: 10 messages per minute per user
    const userIdentifier = await getUserIdentifier(request)
    const rateLimitResult = await applyRateLimit(request, 'groupMessage', userIdentifier)
    if (!rateLimitResult.success && rateLimitResult.response) {
      return rateLimitResult.response
    }

    const sender_id = user.id

    const { content } = await request.json()

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    // Get group id from slug
    const { data: group, error: groupError } = await supabase
      .from('student_groups')
      .select('id')
      .eq('slug', slug)
      .single()

    if (groupError || !group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Check if sender is a member and not blocked
    const { data: membership, error: membershipError } = await supabase
      .from('student_group_members')
      .select('is_blocked')
      .eq('group_id', group.id)
      .eq('user_id', sender_id)
      .single()

    if (membershipError) {
      console.error('Membership check error:', membershipError)
      
      // If the error is about is_blocked column, allow the message (no blocking feature yet)
      if (membershipError.message?.includes('is_blocked')) {
        // Continue without blocking check
      } else {
        return NextResponse.json({ error: 'You are not a member of this group' }, { status: 403 })
      }
    } else if (membership && membership.is_blocked) {
      return NextResponse.json({ error: 'You are blocked from sending messages in this group' }, { status: 403 })
    }

    // Insert message
    const { data: message, error: insertError } = await supabase
      .from('student_group_messages')
      .insert({
        id: crypto.randomUUID(),
        group_id: group.id,
        sender_id: sender_id,
        content: content.trim(),
        is_deleted: false
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
    }

    // Reset auto_delete_at to 7 days from now (group activity = not inactive)
    await supabase
      .from('student_groups')
      .update({
        auto_delete_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', group.id)

    return NextResponse.json({ message }, { status: 201 })

  } catch (error) {
    console.error('Message POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
