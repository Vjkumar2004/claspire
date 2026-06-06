import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser } from '@/lib/session'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { receiver_id, message } = await request.json()

    if (!receiver_id || !message?.trim()) {
      return NextResponse.json({ error: 'Receiver ID and message are required' }, { status: 400 })
    }

    if (message.length > 200) {
      return NextResponse.json({ error: 'Message must be 200 characters or less' }, { status: 400 })
    }

    // Get current user from cookie
    // SECURITY: Use signed session verification instead of direct cookie parsing
    // Direct JSON.parse(cookie.value) is unsafe because cookies can be modified
    // via DevTools or proxy tools, allowing session hijacking and privilege escalation
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Prevent self-request
    if (user.id === receiver_id) {
      return NextResponse.json({ error: 'Cannot send request to yourself' }, { status: 400 })
    }

    // Check current user is senior
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('role, full_name')
      .eq('id', user.id)
      .single()

    if (userError || currentUser?.role !== 'senior') {
      return NextResponse.json({ error: 'Only seniors can make senior-to-senior requests' }, { status: 403 })
    }

    // Check receiver exists and is senior
    const { data: receiverUser, error: receiverError } = await supabase
      .from('users')
      .select('role, full_name')
      .eq('id', receiver_id)
      .single()

    if (receiverError || receiverUser?.role !== 'senior') {
      return NextResponse.json({ error: 'Receiver is not a senior' }, { status: 404 })
    }

    // Check existing request
    const { data: existingRequest, error: existingError } = await supabase
      .from('senior_message_requests')
      .select('id, status')
      .eq('sender_id', user.id)
      .eq('receiver_id', receiver_id)
      .single()

    if (existingError && existingError.code !== 'PGRST116') {
      return NextResponse.json({ error: 'Failed to check existing requests' }, { status: 500 })
    }

    if (existingRequest) {
      return NextResponse.json({
        error: 'already_requested',
        status: existingRequest.status
      }, { status: 409 })
    }

    // Create request
    const { data: newRequest, error: insertError } = await supabase
      .from('senior_message_requests')
      .insert({
        sender_id: user.id,
        receiver_id: receiver_id,
        message: message.trim(),
        status: 'pending'
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to create request' }, { status: 500 })
    }

    await supabase
      .from('notifications')
      .insert({
        receiver_id: receiver_id,
        sender_id: user.id,
        title: 'New Senior Connect Request',
        message: `${currentUser.full_name} wants to connect with you.`,
        type: 'message_request',
        link: `/dashboard/senior`,
      })

    return NextResponse.json({
      success: true,
      request: newRequest
    })

  } catch (error: any) {
    console.error('Send senior request error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}