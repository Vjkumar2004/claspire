import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser } from '@/lib/session'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { postIds } = await req.json()

    if (!postIds || !Array.isArray(postIds) || postIds.length === 0) {
      return NextResponse.json({ error: 'Missing or invalid postIds' }, { status: 400 })
    }

    const user = await getAuthenticatedUser(req)
    const userId = user?.id

    // 1. Fetch recent upvoters
    const { data: recentVotes } = await supabase
      .from('votes')
      .select('post_id, user_id, created_at, users:user_id ( id, full_name, avatar_url )')
      .in('post_id', postIds)
      .eq('vote_type', 'upvote')
      .order('created_at', { ascending: false })
      .limit(postIds.length * 5) // roughly limit total rows to process

    let userVotes: any[] | null = null

    // 2. Fetch user's own votes if logged in
    if (userId) {
      const { data } = await supabase
        .from('votes')
        .select('post_id, vote_type')
        .eq('user_id', userId)
        .in('post_id', postIds)
      
      userVotes = data
    }

    return NextResponse.json({
      success: true,
      recentVotes: recentVotes || [],
      userVotes: userVotes || []
    })

  } catch (error: any) {
    console.error('Votes batch API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
