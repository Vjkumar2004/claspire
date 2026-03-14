import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { notifyNewPost } from '@/lib/notifications'

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
      // Get community info
      const { data: comm } = await supabase
        .from('communities')
        .select('display_name, slug')
        .eq('id', community_id)
        .single()

      // Post type based messages
      const notifTitle = 
        type === 'doubt' ? `❓ New Doubt in c/${comm?.slug}`
        : type === 'discussion' ? `💬 New Discussion in c/${comm?.slug}`
        : type === 'experience' ? `⭐ New Experience shared in c/${comm?.slug}`
        : type === 'referral_hunt' ? `🎯 Someone is hunting for Referral!`
        : type === 'resource' ? `📚 New Resource shared in c/${comm?.slug}`
        : `New post in c/${comm?.slug}`

      const notifMessage =
        type === 'referral_hunt' ? `${currentUser?.full_name} is looking for referral: "${title.slice(0, 50)}"`
        : type === 'experience' ? `${currentUser?.full_name} shared their experience: "${title.slice(0, 50)}"`
        : `${currentUser?.full_name} posted: "${title.slice(0, 50)}"`

      // Pass to notifyNewPost
      await notifyNewPost({
        communityId: community_id,
        communitySlug: comm?.slug || '',
        postId: post.id,
        postTitle: title,
        postType: type,
        authorId: userId,
        authorName: currentUser?.full_name || 'Someone',
        customTitle: notifTitle,
        customMessage: notifMessage
      })
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
