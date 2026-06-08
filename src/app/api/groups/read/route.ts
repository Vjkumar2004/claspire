import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser } from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { groupId } = await request.json()
    if (!groupId) {
      return NextResponse.json({ error: 'groupId is required' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { error } = await supabase
      .from('student_group_members')
      .update({ last_read_at: new Date().toISOString() })
      .eq('group_id', groupId)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('group read error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
