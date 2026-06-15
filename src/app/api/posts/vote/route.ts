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

    // Verify post exists
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id')
      .eq('id', post_id)
      .single()

    if (postError || !post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

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

        // Update post counts atomically
        const { data: currentPost } = await supabase
          .from('posts')
          .select('upvote_count, downvote_count')
          .eq('id', post_id)
          .single()

        const newUpvotes = vote_type === 'upvote'
          ? Math.max(0, (currentPost?.upvote_count || 0) - 1)
          : currentPost?.upvote_count || 0

        const newDownvotes = vote_type === 'downvote'
          ? Math.max(0, (currentPost?.downvote_count || 0) - 1)
          : currentPost?.downvote_count || 0

        await supabase
          .from('posts')
          .update({
            upvote_count: newUpvotes,
            downvote_count: newDownvotes
          })
          .eq('id', post_id)

        // Fix Exploit: Reverse the RP if removing an upvote
        if (vote_type === 'upvote') {
          const { data: p } = await supabase.from('posts').select('author_id').eq('id', post_id).single()
          if (p && p.author_id !== userId) {
            const { data: u } = await supabase.from('users').select('rise_points').eq('id', p.author_id).single()
            await supabase.from('users').update({ rise_points: Math.max(0, (u?.rise_points || 0) - 1) }).eq('id', p.author_id)
          }
        }

        return NextResponse.json({
          success: true,
          action: 'removed',
          vote: null,
          upvotes: newUpvotes,
          downvotes: newDownvotes
        })
      } else {
        // Different vote → switch
        action = 'switched'

        // Update vote
        await supabase
          .from('votes')
          .update({ vote_type })
          .eq('id', existing.id)

        // Update post counts atomically
        const { data: currentPost } = await supabase
          .from('posts')
          .select('upvote_count, downvote_count')
          .eq('id', post_id)
          .single()

        let newUpvotes, newDownvotes

        if (vote_type === 'upvote') {
          newUpvotes = (currentPost?.upvote_count || 0) + 1
          newDownvotes = Math.max(0, (currentPost?.downvote_count || 0) - 1)
        } else {
          newUpvotes = Math.max(0, (currentPost?.upvote_count || 0) - 1)
          newDownvotes = (currentPost?.downvote_count || 0) + 1
        }

        await supabase
          .from('posts')
          .update({
            upvote_count: newUpvotes,
            downvote_count: newDownvotes
          })
          .eq('id', post_id)

        // Fix Exploit: Reverse the RP if switching from upvote to downvote
        if (existing.vote_type === 'upvote' && vote_type === 'downvote') {
          const { data: p } = await supabase.from('posts').select('author_id').eq('id', post_id).single()
          if (p && p.author_id !== userId) {
            const { data: u } = await supabase.from('users').select('rise_points').eq('id', p.author_id).single()
            await supabase.from('users').update({ rise_points: Math.max(0, (u?.rise_points || 0) - 1) }).eq('id', p.author_id)
          }
        }

        return NextResponse.json({
          success: true,
          action: 'switched',
          vote: { vote_type },
          upvotes: newUpvotes,
          downvotes: newDownvotes
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

      // Update post counts atomically
      const { data: currentPost } = await supabase
        .from('posts')
        .select('upvote_count, downvote_count')
        .eq('id', post_id)
        .single()

      const newUpvotes = vote_type === 'upvote'
        ? (currentPost?.upvote_count || 0) + 1
        : currentPost?.upvote_count || 0

      const newDownvotes = vote_type === 'downvote'
        ? (currentPost?.downvote_count || 0) + 1
        : currentPost?.downvote_count || 0

      await supabase
        .from('posts')
        .update({
          upvote_count: newUpvotes,
          downvote_count: newDownvotes
        })
        .eq('id', post_id)

      // Award RP to author
      if (vote_type === 'upvote' && action === 'added') {
        // Fetch author_id
        const { data: authorData } = await supabase
          .from('posts')
          .select('author_id, title')
          .eq('id', post_id)
          .single()

        if (authorData && authorData.author_id !== userId) {
          // Award 1 RP
          const { data: user } = await supabase
            .from('users')
            .select('rise_points')
            .eq('id', authorData.author_id)
            .single()

          await supabase
            .from('users')
            .update({ rise_points: (user?.rise_points || 0) + 1 })
            .eq('id', authorData.author_id)

          await supabase
            .from('rise_points_log')
            .insert({
              user_id: authorData.author_id,
              points: 1,
              reason: `Upvote received on: "${authorData.title.slice(0, 30)}..."`,
              created_at: new Date().toISOString()
            })

          // Trigger Notification
          const { createNotification } = await import('@/lib/notifications')
          await createNotification({
            type: 'post_upvoted',
            title: '🔥 Someone liked your post!',
            message: `${userName} liked your post "${authorData.title?.slice(0, 50)}"`,
            receiver_id: authorData.author_id,
            sender_id: userId,
            post_id: post_id,
            link: `/community/c/all/p/${post_id}`
          })

          // Push for upvote
          try {
            const { data: receiver } = await supabase
              .from('users')
              .select('onesignal_player_id')
              .eq('id', authorData.author_id)
              .single()

            if (receiver?.onesignal_player_id) {
              const pushRes = await fetch('https://onesignal.com/api/v1/notifications', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Basic ${process.env.ONESIGNAL_REST_API_KEY}`
                },
                body: JSON.stringify({
                  app_id: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
                  include_player_ids: [receiver.onesignal_player_id],
                  headings: { en: '🔥 Someone liked your post!' },
                  contents: { en: `${userName} liked "${authorData.title?.slice(0, 50)}"` },
                  url: `${process.env.NEXT_PUBLIC_APP_URL}/community/c/all/p/${post_id}`
                })
              })
              const pushResult = await pushRes.json()
              if (!pushRes.ok || pushResult.errors) {
                console.error('[OneSignal] Vote push error:', { status: pushRes.status, errors: pushResult.errors })
              } else {
                console.log('[OneSignal] Vote push sent:', { id: pushResult.id, recipients: pushResult.recipients })
              }
            } else {
              console.log('[OneSignal] Vote push skipped — no player ID for author')
            }
          } catch (pushErr) {
            console.error('[OneSignal] Vote push fetch error:', pushErr)
          }
        }
      }

      return NextResponse.json({
        success: true,
        action,
        vote: { vote_type },
        upvotes: newUpvotes,
        downvotes: newDownvotes
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
