import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import { r2Client, R2_BUCKET } from '@/lib/r2'
import { getAuthenticatedUser } from '@/lib/session'
import { sanitizeHtml } from '@/lib/sanitizeHtml'

export async function PUT(req: NextRequest) {
  try {
    // SECURITY: Use signed session verification instead of direct cookie parsing
    // Direct JSON.parse(cookie.value) is unsafe because cookies can be modified
    // via DevTools or proxy tools, allowing session hijacking and privilege escalation
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const userId = user.id
    
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await req.json()
    const { post_id, title, content, type, visibility, tags, image_url, deleted_image_urls } = body

    if (!post_id) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 })
    }

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    const sanitizedContent = sanitizeHtml(String(content).trim())

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    )

    // First check if the post exists and belongs to the user
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('author_id, image_url')
      .eq('id', post_id)
      .single()

    if (fetchError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    if (post.author_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized to edit this post' }, { status: 403 })
    }

    // Delete removed images from Cloudflare R2
    if (deleted_image_urls && Array.isArray(deleted_image_urls) && deleted_image_urls.length > 0) {
      for (const url of deleted_image_urls) {
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
              console.log('Deleted old image from R2:', key)
            } catch (e) {
              console.warn('Failed to delete old image from R2:', key, e)
            }
          }
        }
      }
    }

    // Prepare update payload
    const updateData: any = {
      title,
      content: sanitizedContent,
      type,
      tags: tags || [],
      updated_at: new Date().toISOString()
    }

    if (visibility) {
      updateData.visibility = visibility
    }

    if (image_url !== undefined) {
      updateData.image_url = image_url
    }

    // Update the post
    const { error: updateError } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', post_id)

    if (updateError) {
      console.error('Post update error:', updateError)
      return NextResponse.json({ error: 'Failed to update post' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Post updated successfully' })
  } catch (error: any) {
    console.error('Edit post error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
