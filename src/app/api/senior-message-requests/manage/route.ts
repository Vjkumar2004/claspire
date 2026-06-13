import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser } from '@/lib/session'
import { sendPushToUsers } from '@/lib/notifications'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { request_id, action } = await request.json()
    
    if (!request_id || !action || !['accept', 'decline'].includes(action)) {
      return NextResponse.json({ error: 'Request ID and valid action are required' }, { status: 400 })
    }

    // SECURITY: Use signed session verification instead of direct cookie parsing
    // Direct JSON.parse(cookie.value) is unsafe because cookies can be modified
    // via DevTools or proxy tools, allowing session hijacking and privilege escalation
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if current user is a senior - separate query
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('role, full_name')
      .eq('id', user.id)
      .single()

    if (userError || currentUser?.role !== 'senior') {
      return NextResponse.json({ error: 'Only seniors can manage senior-to-senior requests' }, { status: 403 })
    }

    // Get the message request details - separate query
    const { data: messageRequest, error: requestError } = await supabase
      .from('senior_message_requests')
      .select('*')
      .eq('id', request_id)
      .eq('receiver_id', user.id) // Only receiver can manage
      .eq('status', 'pending')
      .single()

    if (requestError || !messageRequest) {
      return NextResponse.json({ error: 'Request not found or already processed' }, { status: 404 })
    }

    // Update the request status
    const nextStatus = action === 'accept' ? 'accepted' : 'declined'

    const { data: updatedRequest, error: updateError } = await supabase
      .from('senior_message_requests')
      .update({
        status: nextStatus,
        responded_at: new Date().toISOString()
      })
      .eq('id', request_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating request:', updateError)
      return NextResponse.json({ error: 'Failed to update request' }, { status: 500 })
    }

    // Get sender details for notification - separate query
    const { data: senderUser, error: senderError } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', messageRequest.sender_id)
      .single()

    if (senderError) {
      console.error('Error getting sender details:', senderError)
    }

    // Create notification for the sender
    const notificationTitle = action === 'accept' ? 'Connection Request Accepted!' : 'Connection Request Declined'
    const notificationMessage = action === 'accept' 
      ? `${currentUser.full_name} accepted your connection request! You can now message each other.`
      : `${currentUser.full_name} declined your connection request.`

    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        receiver_id: messageRequest.sender_id,
        sender_id: user.id,
        title: notificationTitle,
        message: notificationMessage,
        type: action === 'accept' ? 'message_request_accepted' : 'message_request_rejected',
        link: action === 'accept' ? `/dashboard/senior/messages?user=${user.id}` : '/seniors',
      })

    if (notificationError) {
      console.error('Error creating notification:', notificationError)
      // Don't fail the request if notification fails
    }

    // Push notification to sender
    await sendPushToUsers(
      [messageRequest.sender_id],
      notificationTitle,
      notificationMessage,
      action === 'accept' ? `/dashboard/senior/messages?user=${user.id}` : '/seniors'
    )

    return NextResponse.json({ 
      success: true, 
      request: updatedRequest,
      action: action
    })

  } catch (error) {
    console.error('Error managing senior message request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
