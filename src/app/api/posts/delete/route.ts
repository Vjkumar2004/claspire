import { NextRequest, NextResponse }
  from 'next/server'
import { createClient }
  from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function DELETE(
  req: NextRequest
) {
  try {
    // Auth check
    const cookie =
      req.cookies.get('claspire_session')
    if (!cookie) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const session = JSON.parse(cookie.value)
    const userId = session.id

    const { post_id } = await req.json()

    if (!post_id) {
      return NextResponse.json(
        { error: 'Post ID required' },
        { status: 400 }
      )
    }

    // Verify post belongs to user
    const { data: post } = await supabase
      .from('posts')
      .select('id, author_id, title, type')
      .eq('id', post_id)
      .single()

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Only author can delete
    if (post.author_id !== userId) {
      return NextResponse.json(
        { error: 'Not authorized' },
        { status: 403 }
      )
    }

    // Delete votes first (foreign key)
    await supabase
      .from('votes')
      .delete()
      .eq('post_id', post_id)

    // Delete answers/comments
    await supabase
      .from('answers')
      .delete()
      .eq('post_id', post_id)

    // Delete related notifications
    await supabase
      .from('notifications')
      .delete()
      .eq('post_id', post_id)

    // Delete post
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', post_id)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Remove RP that was given for post
    // (optional — deduct 3 RP)
    const { data: user } = await supabase
      .from('users')
      .select('rise_points')
      .eq('id', userId)
      .single()

    const rpPenalty =
      post.type === 'experience' ? 10
        : post.type === 'resource' ? 8
          : post.type === 'referral_hunt' ? 5
            : post.type === 'doubt' ? 2
              : post.type === 'discussion' ? 2
                : 2

    await supabase
      .from('users')
      .update({
        rise_points: Math.max(
          0,
          (user?.rise_points || 0) - rpPenalty
        )
      })
      .eq('id', userId)

    return NextResponse.json({
      success: true,
      message: 'Post deleted successfully'
    })

  } catch (err: any) {
    console.error('Delete error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
