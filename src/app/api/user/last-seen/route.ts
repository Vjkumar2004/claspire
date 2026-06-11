import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser } from '@/lib/session'

export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    )

    const { error } = await supabase
      .from('users')
      .update({ last_seen: new Date().toISOString() })
      .eq('id', user.id)

    if (error) {
      console.error('[LastSeen] Update error:', error)
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
    }

    return NextResponse.json({ updated: true })
  } catch (err) {
    console.error('[LastSeen] API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
