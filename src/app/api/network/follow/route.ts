import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser } from '@/lib/session'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: follows, error } = await supabase
      .from('follows')
      .select(`
        id,
        following_id,
        created_at
      `)
      .eq('follower_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Follows fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!follows || follows.length === 0) {
      return NextResponse.json({ following: [] })
    }

    const followingIds = follows.map((f) => f.following_id)

    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, full_name, unique_id, role, avatar_url, banner_url, company, designation, branch, college_id, graduation_year, last_seen')
      .in('id', followingIds)

    if (usersError) {
      return NextResponse.json({ error: usersError.message }, { status: 500 })
    }

    const userMap = new Map((users || []).map((u) => [u.id, u]))

    const formatted = follows.map((f) => {
      const u = userMap.get(f.following_id)
      return {
        id: f.id,
        user_id: f.following_id,
        full_name: u?.full_name || 'Unknown',
        unique_id: u?.unique_id || '',
        role: u?.role || 'student',
        avatar_url: u?.avatar_url || null,
        banner_url: u?.banner_url || null,
        company: u?.company || null,
        designation: u?.designation || null,
        branch: u?.branch || null,
        college_id: u?.college_id || null,
        graduation_year: u?.graduation_year || null,
        last_seen: u?.last_seen || null,
        followed_at: f.created_at,
      }
    })

    return NextResponse.json({ following: formatted })
  } catch (err: unknown) {
    console.error('Follow GET API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await req.json()
    const { following_id, action } = body

    if (!following_id) {
      return NextResponse.json({ error: 'following_id is required' }, { status: 400 })
    }

    if (user.id === following_id) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 })
    }

    if (action === 'unfollow') {
      const { error: deleteError } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', following_id)

      if (deleteError) {
        console.error('Unfollow error:', deleteError)
        return NextResponse.json({ error: 'Failed to unfollow' }, { status: 500 })
      }

      return NextResponse.json({ success: true, action: 'unfollowed' })
    }

    const { data: existing } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', following_id)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Already following' }, { status: 409 })
    }

    const { data: follow, error: insertError } = await supabase
      .from('follows')
      .insert({
        follower_id: user.id,
        following_id,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Follow error:', insertError)
      return NextResponse.json({ error: 'Failed to follow' }, { status: 500 })
    }

    return NextResponse.json({ success: true, action: 'followed', follow })
  } catch (err: unknown) {
    console.error('Follow POST API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
