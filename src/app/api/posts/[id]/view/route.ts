import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

async function getViewCount(postId: string): Promise<number> {
  const { data } = await supabase
    .from('posts')
    .select('view_count')
    .eq('id', postId)
    .single()
  return data?.view_count || 0
}

async function incrementViewCount(postId: string): Promise<number> {
  const current = await getViewCount(postId)
  const newCount = current + 1
  await supabase
    .from('posts')
    .update({ view_count: newCount })
    .eq('id', postId)
  return newCount
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params

    if (!postId) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 })
    }

    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id, view_count')
      .eq('id', postId)
      .single()

    if (postError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    let userId: string | null = null
    const sessionCookie = req.cookies.get('claspire_session')
    if (sessionCookie) {
      try {
        userId = JSON.parse(sessionCookie.value).id || null
      } catch {
        userId = null
      }
    }

    let viewerKey = req.cookies.get('claspire_viewer')?.value || null
    const needsViewerCookie = !userId && !viewerKey
    if (needsViewerCookie) {
      viewerKey = randomUUID()
    }

    const buildResponse = (body: object) => {
      const res = NextResponse.json(body)
      if (needsViewerCookie && viewerKey) {
        res.cookies.set('claspire_viewer', viewerKey, {
          maxAge: 60 * 60 * 24 * 365,
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
        })
      }
      return res
    }

    const viewRecord = userId
      ? { post_id: postId, user_id: userId, viewer_key: null }
      : { post_id: postId, user_id: null, viewer_key: viewerKey }

    const { error: insertError } = await supabase
      .from('post_views')
      .insert(viewRecord)

    if (!insertError) {
      const viewCount = await incrementViewCount(postId)
      return buildResponse({ success: true, counted: true, view_count: viewCount })
    }

    // Unique constraint = already viewed this post
    if (insertError.code === '23505') {
      return buildResponse({
        success: true,
        counted: false,
        view_count: post.view_count || 0,
      })
    }

    // Table may not exist yet — fall back to simple increment
    if (insertError.code === '42P01') {
      const viewCount = await incrementViewCount(postId)
      return buildResponse({ success: true, counted: true, view_count: viewCount })
    }

    throw insertError
  } catch (error: unknown) {
    console.error('View count error:', error)
    return NextResponse.json({ error: 'Failed to record view' }, { status: 500 })
  }
}
