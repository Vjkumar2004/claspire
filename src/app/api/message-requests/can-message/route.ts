import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function GET(req: NextRequest) {
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

    // Get other_user_id from query params
    const { searchParams } = new URL(req.url)
    const other_user_id = searchParams.get('other_user_id')

    if (!other_user_id) {
      return NextResponse.json({ error: 'other_user_id query parameter is required' }, { status: 400 })
    }

    // Check if accepted request exists between these two users (either direction)
    const { data: request, error: requestError } = await supabase
      .from('message_requests')
      .select('id')
      .eq('status', 'accepted')
      .or(`and(student_id.eq.${userId},senior_id.eq.${other_user_id}),and(student_id.eq.${other_user_id},senior_id.eq.${userId})`)
      .single()

    if (requestError && requestError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Can message check error:', requestError)
      return NextResponse.json({ error: 'Failed to check messaging permission' }, { status: 500 })
    }

    const canMessage = !!request

    // After checking accepted request, also check blocks
    const { data: blockData } = await supabase
      .from('blocked_users')
      .select('id')
      .or(`and(blocker_id.eq.${userId},blocked_id.eq.${other_user_id}),and(blocker_id.eq.${other_user_id},blocked_id.eq.${userId})`)
      .maybeSingle()

    if (blockData) {
      return NextResponse.json({ canMessage: false, reason: 'blocked' })
    }

    return NextResponse.json({ canMessage })

  } catch (error) {
    console.error('Can message check error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
