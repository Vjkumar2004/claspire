import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser } from '@/lib/session'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const afterRaw = searchParams.get('after')
    // Fix: '+' in timestamp gets decoded as space, restore it
    const after = afterRaw ? afterRaw.replace(/ /g, '+') : null

    // SECURITY: Use signed session verification instead of direct cookie parsing
    // Direct JSON.parse(cookie.value) is unsafe because cookies can be modified
    // via DevTools or proxy tools, allowing session hijacking and privilege escalation
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const userId = user.id

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('receiver_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (after) {
      try {
        // Validate it's a proper date before querying
        const afterDate = new Date(after)
        if (!isNaN(afterDate.getTime())) {
          query = query.gt('created_at', afterDate.toISOString())
        }
      } catch {
        // Invalid date — skip filter, return all notifications
      }
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ notifications: data || [] })

  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    // SECURITY: Use signed session verification instead of direct cookie parsing
    // Direct JSON.parse(cookie.value) is unsafe because cookies can be modified
    // via DevTools or proxy tools, allowing session hijacking and privilege escalation
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const userId = user.id

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
