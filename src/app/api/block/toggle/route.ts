import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function POST(req: NextRequest) {
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
