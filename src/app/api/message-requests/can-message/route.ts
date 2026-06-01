import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { canUsersMessage } from '@/middleware/checkCanMessage'

export const dynamic = 'force-dynamic'

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

    const userId = userSession.id
    const { searchParams } = new URL(req.url)
    const other_user_id = searchParams.get('other_user_id')

    if (!other_user_id) {
      return NextResponse.json({ error: 'other_user_id query parameter is required' }, { status: 400 })
    }

    const { data: blockData } = await supabase
      .from('blocked_users')
      .select('id')
      .or(`and(blocker_id.eq.${userId},blocked_id.eq.${other_user_id}),and(blocker_id.eq.${other_user_id},blocked_id.eq.${userId})`)
      .maybeSingle()

    if (blockData) {
      return NextResponse.json({ canMessage: false, reason: 'blocked' })
    }

    const canMessage = await canUsersMessage(userId, other_user_id)
    return NextResponse.json({ canMessage })
  } catch (error) {
    console.error('Can message check error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
