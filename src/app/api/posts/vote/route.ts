import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function POST(req: NextRequest) {
  try {
    // Authentication
    const cookie = req.cookies.get('claspire_session')
    if (!cookie) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const session = JSON.parse(cookie.value)
    const userId = session.id

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
            receiverId: authorData.author_id,
            senderId: userId,
            type: 'post_like',
            title: 'New Upvote! ⬆️',
            message: `${session.full_name} upvoted your post: "${authorData.title.slice(0, 40)}${authorData.title.length > 40 ? '...' : ''}"`,
            postId: post_id,
            link: `/community/c/all/p/${post_id}`
          })
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
