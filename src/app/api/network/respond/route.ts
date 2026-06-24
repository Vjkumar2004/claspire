import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser } from '@/lib/session'
import { sendPushToUsers } from '@/lib/notifications'
import { applyRateLimit, getUserIdentifier } from '@/lib/rateLimitRedis'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Rate limiting: 30 actions per hour per user
    const userIdentifier = await getUserIdentifier(req)
    const rateLimitResult = await applyRateLimit(req, 'networkRespond', userIdentifier)
    if (!rateLimitResult.success && rateLimitResult.response) {
      return rateLimitResult.response
    }

    const body = await req.json()
    const { connection_id, action } = body

    if (!connection_id || !action) {
      return NextResponse.json({ error: 'connection_id and action are required' }, { status: 400 })
    }

    if (!['accepted', 'rejected'].includes(action)) {
      return NextResponse.json({ error: 'action must be "accepted" or "rejected"' }, { status: 400 })
    }

    const { data: connection, error: fetchError } = await supabase
      .from('connections')
      .select('id, sender_id, receiver_id, status')
      .eq('id', connection_id)
      .single()

    if (fetchError || !connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
    }

    if (connection.receiver_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized to respond to this request' }, { status: 403 })
    }

    if (connection.status !== 'pending') {
      return NextResponse.json({ error: 'Connection request already responded to' }, { status: 400 })
    }

    const { data: updated, error: updateError } = await supabase
      .from('connections')
      .update({
        status: action,
        responded_at: new Date().toISOString(),
      })
      .eq('id', connection_id)
      .select()
      .single()

    if (updateError) {
      console.error('Update connection error:', updateError)
      return NextResponse.json({ error: 'Failed to respond to request' }, { status: 500 })
    }

    await supabase.from('notifications').insert({
      receiver_id: connection.sender_id,
      sender_id: user.id,
      title: action === 'accepted' ? 'Connection Accepted' : 'Connection Declined',
      message: action === 'accepted'
        ? `${user.full_name} accepted your connection request.`
        : `${user.full_name} declined your connection request.`,
      type: action === 'accepted' ? 'message_request_accepted' : 'message_request_rejected',
      link: '/network',
    })

    // Push notification to sender
    const pushTitle = action === 'accepted' ? 'Connection Accepted' : 'Connection Declined'
    const pushMessage = action === 'accepted'
      ? `${user.full_name} accepted your connection request.`
      : `${user.full_name} declined your connection request.`
    await sendPushToUsers([connection.sender_id], pushTitle, pushMessage, '/network')

    return NextResponse.json({ success: true, connection: updated })
  } catch (error) {
    console.error('Respond API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
