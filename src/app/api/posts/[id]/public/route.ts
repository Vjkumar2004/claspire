import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser } from '@/lib/session'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params
    if (!postId) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 })
    }

    const user = await getAuthenticatedUser(req)
    const userId = user?.id

    const [postRes, answersRes, recentVotesRes] = await Promise.all([
      supabaseAdmin
        .from('posts')
        .select(`
          *,
          users!posts_author_id_fkey (
            id, full_name, unique_id,
            role, is_verified, avatar_url
          ),
          communities (
            slug, display_name, member_count,
            colleges ( name, short_name, logo_url )
          ),
          is_college_post
        `)
        .eq('id', postId)
        .single(),
      supabaseAdmin
        .from('answers')
        .select(`
          *,
          users!answers_author_id_fkey (
            id, full_name, unique_id,
            role, is_verified, avatar_url
          )
        `)
        .eq('post_id', postId)
        .order('is_accepted', { ascending: false })
        .order('upvote_count', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(50),
      supabaseAdmin
        .from('votes')
        .select('user_id, created_at, users:user_id ( id, full_name, avatar_url )')
        .eq('post_id', postId)
        .eq('vote_type', 'upvote')
        .order('created_at', { ascending: false })
        .limit(10)
    ])

    const { data: postData, error: postError } = postRes
    if (postError || !postData) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    let userVote = null
    if (userId) {
      const { data: voteData } = await supabaseAdmin
        .from('votes')
        .select('vote_type')
        .eq('user_id', userId)
        .eq('post_id', postId)
        .maybeSingle()
      if (voteData) {
        userVote = voteData.vote_type
      }
    }

    return NextResponse.json({
      success: true,
      post: postData,
      answers: answersRes.data || [],
      recentVotes: recentVotesRes.data || [],
      userVote
    })

  } catch (error: any) {
    console.error('Fetch public post error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
