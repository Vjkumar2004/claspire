import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const receiverId = searchParams.get('receiver_id')
    
    if (!receiverId) {
      return NextResponse.json({ error: 'Receiver ID is required' }, { status: 400 })
    }

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

    // Check if current user is a senior - separate query
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userError || currentUser?.role !== 'senior') {
      return NextResponse.json({ error: 'Only seniors can make senior-to-senior requests' }, { status: 403 })
    }

    // Check if receiver is a senior - separate query
    const { data: receiverUser, error: receiverError } = await supabase
      .from('users')
      .select('role')
      .eq('id', receiverId)
      .single()

    if (receiverError || receiverUser?.role !== 'senior') {
      return NextResponse.json({ error: 'Receiver is not a senior' }, { status: 403 })
    }

    // Check request in either direction (sender or receiver)
    const { data: requests, error: requestError } = await supabase
      .from('senior_message_requests')
      .select('status, sender_id')
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user.id})`
      )
      .order('created_at', { ascending: false })

    if (requestError) {
      console.error('Error checking request status:', requestError)
      return NextResponse.json({ error: 'Failed to check request status' }, { status: 500 })
    }

    const rows = requests || []
    const normalize = (s: string) => (s || '').toLowerCase()

    let status = 'none'

    if (rows.some((r) => normalize(r.status) === 'accepted')) {
      status = 'accepted'
    } else if (
      rows.some(
        (r) =>
          r.sender_id === user.id &&
          (normalize(r.status) === 'pending')
      )
    ) {
      status = 'pending'
    } else if (
      rows.some(
        (r) =>
          r.sender_id === user.id &&
          normalize(r.status) === 'declined'
      )
    ) {
      status = 'declined'
    }

    return NextResponse.json({ status })
  } catch (error) {
    console.error('Error in status check:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
