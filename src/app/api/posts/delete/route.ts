import { NextRequest, NextResponse }
  from 'next/server'
import { createClient }
  from '@supabase/supabase-js'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import { r2Client, R2_BUCKET } from '@/lib/r2'
import { getAuthenticatedUser } from '@/lib/session'
import { applyRateLimit, getUserIdentifier } from '@/lib/rateLimitRedis'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function DELETE(
  req: NextRequest
) {
  try {
    // SECURITY: Use signed session verification instead of direct cookie parsing
    // Direct JSON.parse(cookie.value) is unsafe because cookies can be modified
    // via DevTools or proxy tools, allowing session hijacking and privilege escalation
    const authenticatedUser = await getAuthenticatedUser(req)
    if (!authenticatedUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const userIdentifier = await getUserIdentifier(req)
    const rateLimitResult = await applyRateLimit(req, 'createPost', userIdentifier)
    if (!rateLimitResult.success && rateLimitResult.response) {
      return rateLimitResult.response
    }

    const userId = authenticatedUser.id

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
      .select('id, author_id, title, type, image_url')
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

    // Delete associated images from Cloudflare R2
    if (post.image_url) {
      let imageUrls: string[] = []
      try {
        imageUrls = typeof post.image_url === 'string' && post.image_url.startsWith('[')
          ? JSON.parse(post.image_url)
          : [post.image_url]
      } catch {
        imageUrls = [post.image_url]
      }

      for (const url of imageUrls) {
        if (url && typeof url === 'string' && url.includes('.r2.dev/')) {
          const key = url.split('.r2.dev/')[1]
          if (key) {
            try {
              await r2Client.send(
                new DeleteObjectCommand({
                  Bucket: R2_BUCKET,
                  Key: key
                })
              )
              console.log('Deleted post image from R2:', key)
            } catch (e) {
              console.warn('Failed to delete post image from R2:', key, e)
            }
          }
        }
      }
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
