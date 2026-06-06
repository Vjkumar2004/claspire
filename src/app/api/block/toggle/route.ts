import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser } from '@/lib/session'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function POST(req: NextRequest) {
  try {
    // SECURITY: Use signed session verification instead of direct cookie parsing
    // Direct JSON.parse(cookie.value) is unsafe because cookies can be modified
    // via DevTools or proxy tools, allowing session hijacking and privilege escalation
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const currentUserId = user.id
    const { blocked_id } = await req.json()

    if (!blocked_id) {
      return NextResponse.json({ error: 'blocked_id is required' }, { status: 400 })
    }

    if (blocked_id === currentUserId) {
      return NextResponse.json({ error: 'Cannot block yourself' }, { status: 400 })
    }

    // Check if already blocked
    const { data: existingBlock, error: checkError } = await supabase
      .from('blocked_users')
      .select('id')
      .eq('blocker_id', currentUserId)
      .eq('blocked_id', blocked_id)
      .maybeSingle()

    if (checkError) {
      console.error('Check block error:', checkError)
      return NextResponse.json({ error: 'Failed to check block status' }, { status: 500 })
    }

    let action: 'blocked' | 'unblocked'

    if (existingBlock) {
      // Unblock - delete the record
      const { error: deleteError } = await supabase
        .from('blocked_users')
        .delete()
        .eq('blocker_id', currentUserId)
        .eq('blocked_id', blocked_id)

      if (deleteError) {
        console.error('Unblock error:', deleteError)
        return NextResponse.json({ error: 'Failed to unblock user' }, { status: 500 })
      }

      action = 'unblocked'
    } else {
      // Block - insert new record
      const { error: insertError } = await supabase
        .from('blocked_users')
        .insert({
          blocker_id: currentUserId,
          blocked_id: blocked_id
        })

      if (insertError) {
        console.error('Block error:', insertError)
        return NextResponse.json({ error: 'Failed to block user' }, { status: 500 })
      }

      action = 'blocked'
    }

    return NextResponse.json({ action })

  } catch (error) {
    console.error('Toggle block error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
