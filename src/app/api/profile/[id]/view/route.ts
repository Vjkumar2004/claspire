import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser } from '@/lib/session'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const viewer = await getAuthenticatedUser(req)
    if (!viewer) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { id } = await params

    // Do not count self-views
    if (viewer.id === id) {
      return NextResponse.json({ viewed: false, reason: 'self_view' })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    )

    // Check if viewer already viewed this profile today (24h dedup)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: existing } = await supabase
      .from('profile_views')
      .select('id')
      .eq('viewer_id', viewer.id)
      .eq('viewed_user_id', id)
      .gte('created_at', twentyFourHoursAgo)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ viewed: false, reason: 'already_viewed' })
    }

    const { error } = await supabase
      .from('profile_views')
      .insert({ viewer_id: viewer.id, viewed_user_id: id })

    if (error) {
      console.error('[ProfileView] Insert error:', error)
      return NextResponse.json({ error: 'Failed to record view' }, { status: 500 })
    }

    return NextResponse.json({ viewed: true })
  } catch (err) {
    console.error('[ProfileView] API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
