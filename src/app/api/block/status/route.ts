import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser } from '@/lib/session'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function GET(req: NextRequest) {
  try {
    // SECURITY: Use signed session verification instead of direct cookie parsing
    // Direct JSON.parse(cookie.value) is unsafe because cookies can be modified
    // via DevTools or proxy tools, allowing session hijacking and privilege escalation
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const currentUserId = user.id
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
