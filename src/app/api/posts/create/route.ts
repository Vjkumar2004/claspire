import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createBulkNotifications } from '@/lib/notifications'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function POST(req: NextRequest) {
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
    const currentUser = session

    const body = await req.json()
    const {
      community_id,
      title,
      content,
      type = 'doubt',
      visibility = 'public',
      tags = [],
      is_pinned = false,
      image_url = null
    } = body

    // Ensure content is a string
    const contentStr = String(body.content || '').trim()

    // Validate
    if (!title?.trim()) {
      return NextResponse.json(
        { error: 'Title required' },
        { status: 400 }
      )
    }
    if (!contentStr) {
      return NextResponse.json(
        { error: 'Content required' },
        { status: 400 }
      )
    }
    if (!community_id) {
      return NextResponse.json(
        { error: 'Community required' },
        { status: 400 }
      )
    }

    // Check user is member of community (same logic as community API)
    let isMember = false
    if (currentUser) {
      // Get user and community details for role checking
      const { data: userData } = await supabase
        .from('users')
        .select('college_id, is_verified, role, is_premium')
        .eq('id', userId)
        .single()

      const { data: communityData } = await supabase
        .from('communities')
        .select('college_id')
        .eq('id', community_id)
        .single()

      if (userData && communityData) {
        const isOwnCollege = userData.college_id === communityData.college_id
        const isVerified = userData.is_verified
        const isSenior = userData.role === 'senior'
        const isPremium = userData.is_premium

        // Same logic as community API
        if ((isOwnCollege && isVerified) || isPremium) {
          isMember = true
        } else {
          // Check explicit membership for other cases
          const { data: member } = await supabase
            .from('community_members')
            .select('id, membership_type')
            .eq('community_id', community_id)
            .eq('user_id', userId)
            .eq('membership_type', 'joined')
            .single()

          isMember = !!member
        }
      }
    }

    if (!isMember) {
      return NextResponse.json(
        { error: 'Not a member of this community' },
        { status: 403 }
      )
    }

    // Create post
    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        community_id,
        author_id: userId,
        title: title.trim(),
        content: contentStr,
        type,
        visibility,
        tags,
        is_pinned,
        image_url: image_url || null,
        upvote_count: 0,
        downvote_count: 0,
        answer_count: 0,
        view_count: 0,
        is_answered: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Post create error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Give RP for posting
    const { data: user } = await supabase
      .from('users')
      .select('rise_points, doubt_count, answer_count, referral_count')
      .eq('id', userId)
      .single()

    const rpAmount =
      type === 'doubt' ? 3
        : type === 'discussion' ? 2
          : type === 'experience' ? 8
            : type === 'referral_hunt' ? 5
              : type === 'resource' ? 6
                : 2

    await supabase
      .from('rise_points_log')
      .insert({
        user_id: userId,
        points: rpAmount,
        reason: `Posted a ${type}: "${title.slice(0, 40)}"`,
        created_at: new Date().toISOString()
      })

    await supabase
      .from('users')
      .update({
        rise_points: (user?.rise_points || 0) + rpAmount,
        doubt_count: type === 'doubt' ? (user?.doubt_count || 0) + 1 : user?.doubt_count,
        answer_count: type === 'answer' ? (user?.answer_count || 0) + 1 : user?.answer_count,
        referral_count: type === 'referral_hunt' ? (user?.referral_count || 0) + 1 : user?.referral_count
      })
      .eq('id', userId)

    // Update community post count
    await supabase.rpc('increment', {
      table_name: 'communities',
      column_name: 'post_count',
      row_id: community_id
    })

    // --- NOTIFICATION LOGIC ---
    try {
      // Get member user IDs (excluding author)
      const { data: memberIds } = await supabase
        .from('community_members')
        .select('user_id')
        .eq('community_id', community_id)
        .neq('user_id', userId)

      if (memberIds?.length) {
        const ids = memberIds.map(m => m.user_id)
        
        // Get community info
        const { data: comm } = await supabase
          .from('communities')
          .select('display_name, slug')
          .eq('id', community_id)
          .single()

        // 1. Send In-App Notifications (Real-time)
        await createBulkNotifications({
          receiverIds: ids,
          senderId: userId,
          type: 'job_post', // Use an appropriate type or add a generic one
          title: `New ${type} in c/${comm?.slug} 🚀`,
          message: `${session.full_name} posted: "${title.slice(0, 50)}..."`,
          link: `/community/c/${comm?.slug}/posts/${post.id}`,
          postId: post.id
        })

        // 2. Send Push Notifications via OneSignal
        // Get their onesignal_player_ids
        const { data: pushUsers } = await supabase
          .from('users')
          .select('onesignal_player_id')
          .in('id', ids)
          .not('onesignal_player_id', 'is', null)

        const playerIds = pushUsers?.map(u => u.onesignal_player_id).filter(Boolean) || []

        if (playerIds.length) {
          await fetch('https://onesignal.com/api/v1/notifications', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Basic ${process.env.ONESIGNAL_REST_API_KEY}`
            },
            body: JSON.stringify({
              app_id: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
              include_player_ids: playerIds,
              headings: { en: `New ${type} in c/${comm?.slug}` },
              contents: { en: `${session.full_name}: "${title.slice(0, 60)}"` },
              url: `https://claspire.vercel.app/community/c/${comm?.slug}`
            })
          })
        }
      }
    } catch (notifErr) {
      console.error('Notification trigger error:', notifErr)
    }

    return NextResponse.json({
      success: true,
      post,
      rpEarned: rpAmount
    })

  } catch (err: any) {
    console.error('Create post error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
