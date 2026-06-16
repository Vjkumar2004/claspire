import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser } from '@/lib/session'
import { applyRateLimit, getUserIdentifier } from '@/lib/rateLimitRedis'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function POST(req: NextRequest) {
  try {
    // SECURITY: Use signed session verification instead of direct cookie parsing
    // Direct JSON.parse(cookie.value) is unsafe because cookies can be modified
    // via DevTools or proxy tools, allowing session hijacking and privilege escalation
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Rate limiting: 100 requests per minute per user
    const userIdentifier = await getUserIdentifier(req)
    const rateLimitResult = await applyRateLimit(req, 'vote', userIdentifier)
    if (!rateLimitResult.success && rateLimitResult.response) {
      return rateLimitResult.response
    }

    const userId = user.id
    const userName = user.full_name || 'Someone'

    const { post_id, vote_type } = await req.json()

    // Validate input
    if (!post_id || !vote_type || !['upvote', 'downvote'].includes(vote_type)) {
      return NextResponse.json(
        { error: 'Invalid input' },
        { status: 400 }
      )
    }

    // Verify post exists and fetch author + counts in one query
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id, author_id, title, upvote_count, downvote_count')
      .eq('id', post_id)
      .single()

    if (postError || !post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    const authorId = post.author_id

    // Check existing vote
    const { data: existing, error: existingError } = await supabase
      .from('votes')
      .select('id, vote_type')
      .eq('post_id', post_id)
      .eq('user_id', userId)
      .single()

    if (existingError && existingError.code !== 'PGRST116') {
      // Real error, not "not found"
      throw existingError
    }

    let action: 'added' | 'removed' | 'switched'

    if (existing) {
      if (existing.vote_type === vote_type) {
        // Same vote → remove (toggle off)
        action = 'removed'

        // Remove vote
        await supabase
          .from('votes')
          .delete()
          .eq('id', existing.id)

        const newUpvotesNum = vote_type === 'upvote'
          ? Math.max(0, (post?.upvote_count || 0) - 1)
          : post?.upvote_count || 0

        const newDownvotesNum = vote_type === 'downvote'
          ? Math.max(0, (post?.downvote_count || 0) - 1)
          : post?.downvote_count || 0

        await supabase
          .from('posts')
          .update({
            upvote_count: newUpvotesNum,
            downvote_count: newDownvotesNum
          })
          .eq('id', post_id)

        // Fix Exploit: Reverse the RP if removing an upvote
        if (vote_type === 'upvote' && authorId && authorId !== userId) {
          const { data: u } = await supabase.from('users').select('rise_points').eq('id', authorId).single()
          await supabase.from('users').update({ rise_points: Math.max(0, (u?.rise_points || 0) - 1) }).eq('id', authorId)
        }

        return NextResponse.json({
          success: true,
          action: 'removed',
          vote: null,
          upvotes: newUpvotesNum,
          downvotes: newDownvotesNum
        })
      } else {
        // Different vote → switch
        action = 'switched'

        // Update vote
        await supabase
          .from('votes')
          .update({ vote_type })
          .eq('id', existing.id)

        let newUpvotesNum, newDownvotesNum

        if (vote_type === 'upvote') {
          newUpvotesNum = (post?.upvote_count || 0) + 1
          newDownvotesNum = Math.max(0, (post?.downvote_count || 0) - 1)
        } else {
          newUpvotesNum = Math.max(0, (post?.upvote_count || 0) - 1)
          newDownvotesNum = (post?.downvote_count || 0) + 1
        }

        await supabase
          .from('posts')
          .update({
            upvote_count: newUpvotesNum,
            downvote_count: newDownvotesNum
          })
          .eq('id', post_id)

        // Fix Exploit: Reverse the RP if switching from upvote to downvote
        if (existing.vote_type === 'upvote' && vote_type === 'downvote' && authorId && authorId !== userId) {
          const { data: u } = await supabase.from('users').select('rise_points').eq('id', authorId).single()
          await supabase.from('users').update({ rise_points: Math.max(0, (u?.rise_points || 0) - 1) }).eq('id', authorId)
        }

        return NextResponse.json({
          success: true,
          action: 'switched',
          vote: { vote_type },
          upvotes: newUpvotesNum,
          downvotes: newDownvotesNum
        })
      }
    } else {
      // New vote
      action = 'added'

      // Insert new vote
      const { error: insertError } = await supabase
        .from('votes')
        .insert({
          post_id,
          user_id: userId,
          vote_type,
          created_at: new Date().toISOString()
        })

      if (insertError) {
        throw insertError
      }

      const newUpvotesNum = vote_type === 'upvote'
        ? (post?.upvote_count || 0) + 1
        : post?.upvote_count || 0

      const newDownvotesNum = vote_type === 'downvote'
        ? (post?.downvote_count || 0) + 1
        : post?.downvote_count || 0

      await supabase
        .from('posts')
        .update({
          upvote_count: newUpvotesNum,
          downvote_count: newDownvotesNum
        })
        .eq('id', post_id)

      // Award RP to author
      if (vote_type === 'upvote' && action === 'added' && authorId && authorId !== userId) {
        // Fetch author rise_points + push player id in one query
        const { data: author } = await supabase
          .from('users')
          .select('rise_points, onesignal_player_id')
          .eq('id', authorId)
          .single()

        if (author) {
          await supabase
            .from('users')
            .update({ rise_points: (author?.rise_points || 0) + 1 })
            .eq('id', authorId)

          await supabase
            .from('rise_points_log')
            .insert({
              user_id: authorId,
              points: 1,
              reason: `Upvote received on: "${post.title?.slice(0, 30)}..."`,
              created_at: new Date().toISOString()
            })

          // Trigger Notification
          const { createNotification } = await import('@/lib/notifications')
          await createNotification({
            type: 'post_upvoted',
            title: '🔥 Someone liked your post!',
            message: `${userName} liked your post "${post.title?.slice(0, 50)}"`,
            receiver_id: authorId,
            sender_id: userId,
            post_id: post_id,
            link: `/community/c/all/p/${post_id}`
          })

          // Push for upvote
          if (author.onesignal_player_id) {
            try {
              const pushRes = await fetch('https://onesignal.com/api/v1/notifications', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Basic ${process.env.ONESIGNAL_REST_API_KEY}`
                },
                body: JSON.stringify({
                  app_id: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
                  include_player_ids: [author.onesignal_player_id],
                  headings: { en: '🔥 Someone liked your post!' },
                  contents: { en: `${userName} liked "${post.title?.slice(0, 50)}"` },
                  url: `${process.env.NEXT_PUBLIC_APP_URL}/community/c/all/p/${post_id}`
                })
              })
              const pushResult = await pushRes.json()
              if (!pushRes.ok || pushResult.errors) {
                console.error('[OneSignal] Vote push error:', { status: pushRes.status, errors: pushResult.errors })
              } else {
                console.log('[OneSignal] Vote push sent:', { id: pushResult.id, recipients: pushResult.recipients })
              }
            } catch (pushErr) {
              console.error('[OneSignal] Vote push fetch error:', pushErr)
            }
          }
        }
      }

      return NextResponse.json({
        success: true,
        action,
        vote: { vote_type },
        upvotes: newUpvotesNum,
        downvotes: newDownvotesNum
      })
    }

  } catch (err: any) {
    console.error('Vote error:', err)

    // Handle specific error cases
    if (err.code === '23505') {
      // Unique constraint violation - vote already exists
      return NextResponse.json(
        { error: 'You have already voted on this post' },
        { status: 409 }
      )
    }

    if (err.code === '23503') {
      // Foreign key constraint violation
      return NextResponse.json(
        { error: 'Invalid post or user' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
