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

    // Fetch blocked users first
    const { data: blockedUsers, error: blockedError } = await supabase
      .from('blocked_users')
      .select('id, blocked_id, created_at')
      .eq('blocker_id', currentUserId)
      .order('created_at', { ascending: false })

    if (blockedError) {
      console.error('Fetch blocked users error:', blockedError)
      return NextResponse.json({ error: 'Failed to fetch blocked users' }, { status: 500 })
    }

    if (!blockedUsers || blockedUsers.length === 0) {
      return NextResponse.json({ blocked_users: [] })
    }

    // Fetch user details separately
    const blockedIds = blockedUsers.map(b => b.blocked_id)

    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, full_name, avatar_url, unique_id, role')
      .in('id', blockedIds)

    if (usersError) {
      console.error('Fetch user details error:', usersError)
      return NextResponse.json({ error: 'Failed to fetch user details' }, { status: 500 })
    }

    // Merge data
    const formattedBlockedUsers = blockedUsers.map(blocked => {
      const user = users?.find(u => u.id === blocked.blocked_id)
      return {
        id: blocked.id,
        blocked_id: blocked.blocked_id,
        created_at: blocked.created_at,
        full_name: user?.full_name || 'Unknown',
        avatar_url: user?.avatar_url || null,
        unique_id: user?.unique_id || null,
        role: user?.role || null
      }
    })

    return NextResponse.json({ blocked_users: formattedBlockedUsers })

  } catch (error) {
    console.error('Get blocked list error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
