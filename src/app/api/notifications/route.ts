import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function GET(req: NextRequest) {
  try {
    const cookie = req.cookies.get('claspire_session')
    if (!cookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const session = JSON.parse(cookie.value)
    const userId = session.id

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('receiver_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ notifications: data })

  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const cookie = req.cookies.get('claspire_session')
    if (!cookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const session = JSON.parse(cookie.value)
    const userId = session.id

    const { notificationIds } = await req.json()

    if (!notificationIds || !Array.isArray(notificationIds)) {
      // If no IDs provided, mark ALL as read
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('receiver_id', userId)
        .eq('is_read', false)

      if (error) throw error
    } else {
      // Mark specific IDs as read
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', notificationIds)
        .eq('receiver_id', userId)

      if (error) throw error
    }

    return NextResponse.json({ success: true })

  } catch (err: any) {
    console.error('Notification mark read error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
