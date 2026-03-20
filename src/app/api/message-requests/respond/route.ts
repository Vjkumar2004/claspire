import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function POST(req: NextRequest) {
  try {
    // Get current user from session cookie
    const session = req.cookies.get('claspire_session')
    if (!session?.value) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    let userSession
    try {
      userSession = JSON.parse(session.value)
    } catch (parseError) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const userId = userSession.id

    // Get user role to ensure they're a senior
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (userData.role !== 'senior') {
      return NextResponse.json({ error: 'Only seniors can respond to requests' }, { status: 403 })
    }

    // Parse request body
    const body = await req.json()
    const { request_id, action } = body

    if (!request_id || !action) {
      return NextResponse.json({ error: 'request_id and action are required' }, { status: 400 })
    }

    if (!['accepted', 'declined'].includes(action)) {
      return NextResponse.json({ error: 'action must be "accepted" or "declined"' }, { status: 400 })
    }

    // Update the request
    const { data: updatedRequest, error: updateError } = await supabase
      .from('message_requests')
      .update({
        status: action,
        responded_at: new Date().toISOString()
      })
      .eq('id', request_id)
      .eq('senior_id', userId)
      .select()
      .single()

    if (updateError) {
      console.error('Update request error:', updateError)
      return NextResponse.json({ error: 'Failed to update request' }, { status: 500 })
    }

    if (!updatedRequest) {
      return NextResponse.json({ error: 'Request not found or not authorized' }, { status: 404 })
    }

    return NextResponse.json({ success: true, request: updatedRequest })

  } catch (error) {
    console.error('Respond to request error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
