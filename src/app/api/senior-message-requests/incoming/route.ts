import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    // Get current user from cookie (same as /api/auth/me)
    const cookieStore = require('next/headers').cookies()
    const session = cookieStore.get('claspire_session')
    
    if (!session?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let user
    try {
      user = JSON.parse(session.value)
    } catch (parseError) {
      console.error('Failed to parse session:', parseError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if current user is a senior - separate query
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userError || currentUser?.role !== 'senior') {
      return NextResponse.json({ error: 'Only seniors can view senior-to-senior requests' }, { status: 403 })
    }

    // Get incoming requests - separate query first
    const { data: requests, error: requestsError } = await supabase
      .from('senior_message_requests')
      .select('*')
      .eq('receiver_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (requestsError) {
      console.error('Error fetching requests:', requestsError)
      return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 })
    }

    if (!requests || requests.length === 0) {
      return NextResponse.json({ requests: [] })
    }

    // Get sender details using separate query with .in()
    const senderIds = requests.map(req => req.sender_id)
    const { data: senders, error: sendersError } = await supabase
      .from('users')
      .select('id, full_name, unique_id, avatar_url, company, designation')
      .in('id', senderIds)

    if (sendersError) {
      console.error('Error fetching senders:', sendersError)
      return NextResponse.json({ error: 'Failed to fetch sender details' }, { status: 500 })
    }

    // Combine requests with sender details
    const requestsWithSenders = requests.map(request => {
      const sender = senders?.find(s => s.id === request.sender_id)
      return {
        ...request,
        sender: sender || null
      }
    })

    return NextResponse.json({ requests: requestsWithSenders })

  } catch (error) {
    console.error('Error fetching incoming senior message requests:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
