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
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const session = JSON.parse(cookie.value)
    const userId = session.id
    const today = new Date().toISOString().split('T')[0]

    // Fetch user + college
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        id, full_name, email, role,
        unique_id, rise_points, rp_level,
        doubt_count, answer_count,
        referral_count, webinar_count,
        is_verified, verification_status,
        last_visit_date,
        colleges (
          id, name, short_name, slug
        )
      `)
      .eq('id', userId)
      .single()

    if (error || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // ── Daily Visit RP ──
    let dailyRPEarned = false
    if (user.last_visit_date !== today) {
      // Give +1 RP
      await supabase
        .from('users')
        .update({
          rise_points: (user.rise_points || 0) + 1,
          last_visit_date: today,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      // Log it
      await supabase
        .from('rise_points_log')
        .insert({
          user_id: userId,
          points: 1,
          reason: 'Daily visit bonus 🌅',
          created_at: new Date().toISOString()
        })

      // Update local user object
      user.rise_points = (user.rise_points || 0) + 1
      user.last_visit_date = today
      dailyRPEarned = true
    }

    // ── RP Level Update ──
    const newLevel = user.rise_points >= 1000 ? 4
      : user.rise_points >= 500 ? 3
      : user.rise_points >= 200 ? 2
      : 1

    if (newLevel !== user.rp_level) {
      await supabase
        .from('users')
        .update({ rp_level: newLevel })
        .eq('id', userId)
      user.rp_level = newLevel
    }

    // ── Rise Points Log (last 6) ──
    const { data: rpLog } = await supabase
      .from('rise_points_log')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(6)

    // ── My Posts (last 5) ──
    const { data: myPosts } = await supabase
      .from('posts')
      .select(`
        id, title, content,
        upvote_count, answer_count,
        is_answered, created_at,
        communities ( display_name, slug )
      `)
      .eq('author_id', userId)
      .order('created_at', { ascending: false })
      .limit(5)

    // ── Unread notifications ──
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    return NextResponse.json({
      success: true,
      user,
      rpLog: rpLog || [],
      myPosts: myPosts || [],
      unreadCount: unreadCount || 0,
      dailyRPEarned
    })

  } catch (err: any) {
    console.error('Dashboard error:', err)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}
