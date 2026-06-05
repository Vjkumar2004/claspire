import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params
    const searchParams = req.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Verify post exists
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id, upvote_count')
      .eq('id', postId)
      .single()

    if (postError || !post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Fetch upvoters with pagination
    const { data: votes, error: votesError } = await supabase
      .from('votes')
      .select(`
        user_id,
        created_at,
        users:user_id (
          id,
          full_name,
          unique_id,
          role,
          avatar_url
        )
      `)
      .eq('post_id', postId)
      .eq('vote_type', 'upvote')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (votesError) {
      throw votesError
    }

    const voters = (votes as any[])?.map((vote: any) => ({
      id: vote.users?.id,
      full_name: vote.users?.full_name,
      unique_id: vote.users?.unique_id,
      role: vote.users?.role,
      avatar_url: vote.users?.avatar_url,
      voted_at: vote.created_at
    })) || []

    // Get total count
    const total = post.upvote_count || 0
    const hasMore = offset + voters.length < total

    return NextResponse.json({
      success: true,
      voters,
      total,
      page,
      limit,
      hasMore
    })
  } catch (error: any) {
    console.error('Voters fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch voters' },
      { status: 500 }
    )
  }
}
