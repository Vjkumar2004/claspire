import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { resolveDisplayBio, resolveProfileData } from '@/lib/profile-data'
import { getAuthenticatedUser } from '@/lib/session'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ uniqueId: string }> }
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  )

  try {
    const { uniqueId } = await params
    if (!uniqueId) {
      return NextResponse.json({ error: 'Unique ID is required' }, { status: 400 })
    }

    let viewer: { id: string; role: string } | null = null
    const authenticatedUser = await getAuthenticatedUser(req)
    if (authenticatedUser) {
      viewer = { id: authenticatedUser.id, role: authenticatedUser.role }
    }

    const baseSelect = `
      id, full_name, role,
      unique_id, rise_points, rp_level,
      doubt_count, answer_count,
      referral_count, webinar_count,
      is_verified, verification_status,
      bio, branch, year, avatar_url, banner_url,
      company, designation, graduation_year, passout_year, linkedin_url,
      colleges ( id, name, short_name, slug, location, state )
    `

    let { data: user, error } = await supabase
      .from('users')
      .select(`${baseSelect}, profile_data`)
      .eq('unique_id', uniqueId)
      .single()

    if (error?.message?.includes('profile_data')) {
      const fallback = await supabase
        .from('users')
        .select(baseSelect)
        .eq('unique_id', uniqueId)
        .single()
      user = fallback.data ? { ...fallback.data, profile_data: {} } : null
      error = fallback.error
    }

    if (error || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const resolvedProfile = resolveProfileData(user)
    const sanitized = {
      ...user,
      bio: resolveDisplayBio(user.bio),
      profile_data: resolvedProfile,
    }
    delete (sanitized as { email?: string }).email

    let connectionStatus = 'not_connected'
    let connectionId: string | null = null

    if (viewer && viewer.id !== user.id) {
      const { data: conn } = await supabase
        .from('connections')
        .select('id, status, sender_id')
        .or(`and(sender_id.eq.${viewer.id},receiver_id.eq.${user.id}),and(sender_id.eq.${user.id},receiver_id.eq.${viewer.id})`)
        .maybeSingle()

      if (conn) {
        connectionId = conn.id
        if (conn.status === 'accepted') {
          connectionStatus = 'connected'
        } else if (conn.status === 'pending') {
          connectionStatus = conn.sender_id === viewer.id ? 'pending_sent' : 'pending_received'
        }
      }
    }

    let followStatus: string = 'not_following'
    if (viewer && viewer.id !== user.id) {
      const { data: follow } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', viewer.id)
        .eq('following_id', user.id)
        .maybeSingle()
      if (follow) {
        followStatus = 'following'
      }
    }

    return NextResponse.json({
      success: true,
      user: sanitized,
      viewer,
      isOwnProfile: viewer?.id === user.id,
      connectionStatus,
      connectionId,
      followStatus,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
