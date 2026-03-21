import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { request_id, action } = await request.json()
    
    if (!request_id || !action || !['accept', 'decline'].includes(action)) {
      return NextResponse.json({ error: 'Request ID and valid action are required' }, { status: 400 })
    }

    // Get current user from cookie (same as /api/auth/me)
    const cookieStore = require('next/headers').cookies()
    const session = cookieStore.get('claspire_session')
    
    if (!session?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let user: any
    try {
      user = JSON.parse(session.value)
    } catch (parseError) {
      console.error('Failed to parse session:', parseError)
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
    const { data: updatedRequest, error: updateError } = await supabase
      .from('senior_message_requests')
      .update({
        status: action,
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
        user_id: messageRequest.sender_id,
        title: notificationTitle,
        message: notificationMessage,
        type: action === 'accept' ? 'senior_connect_accepted' : 'senior_connect_declined',
        link: action === 'accept' ? `/dashboard/senior?activeTab=messages&user=${user.id}` : '/seniors',
        sender_id: user.id,
        metadata: {
          request_id: request_id,
          responder_name: currentUser.full_name
        }
      })

    if (notificationError) {
      console.error('Error creating notification:', notificationError)
      // Don't fail the request if notification fails
    }

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
