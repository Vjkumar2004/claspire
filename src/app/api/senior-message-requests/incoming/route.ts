import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function GET(req: NextRequest) {
  try {
    // Get current user from cookie (same as /api/auth/me)
    const session = req.cookies.get('claspire_session')
    
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

    // Check current user exists (role guard not required for fetching own inbox)
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single()

    if (userError || !currentUser?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get incoming pending requests
    const { data: requests, error: requestsError } = await supabase
      .from('senior_message_requests')
      .select('*')
      .eq('receiver_id', user.id)
      .in('status', ['pending', 'Pending'])
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
