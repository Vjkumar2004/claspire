import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function GET(req: NextRequest) {
  try {
    const session = req.cookies.get('claspire_session')
    if (!session?.value) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    let userSession
    try {
      userSession = JSON.parse(session.value)
    } catch {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const currentUserId = userSession.id
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('user_id')

    if (!userId) {
      return NextResponse.json({ error: 'user_id parameter is required' }, { status: 400 })
    }

    // Check both directions
    const { data: blockData, error: blockError } = await supabase
      .from('blocked_users')
      .select('id, blocker_id, blocked_id')
      .or(`and(blocker_id.eq.${currentUserId},blocked_id.eq.${userId}),and(blocker_id.eq.${userId},blocked_id.eq.${currentUserId})`)
      .maybeSingle()

    if (blockError) {
      console.error('Check block status error:', blockError)
      return NextResponse.json({ error: 'Failed to check block status' }, { status: 500 })
    }

    const i_blocked_them = blockData?.blocker_id === currentUserId && blockData?.blocked_id === userId
    const they_blocked_me = blockData?.blocker_id === userId && blockData?.blocked_id === currentUserId
    const is_blocked = !!blockData

    return NextResponse.json({
      i_blocked_them,
      they_blocked_me,
      is_blocked
    })

  } catch (error) {
    console.error('Get block status error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
