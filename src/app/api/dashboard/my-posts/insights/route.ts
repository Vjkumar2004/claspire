import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser } from '@/lib/session'

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    )

    // 1. Fetch user's post IDs
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('id')
      .eq('author_id', user.id)

    if (postsError) {
      return NextResponse.json({ error: postsError.message }, { status: 500 })
    }

    const postIds = (posts || []).map(p => p.id)
    const insights: Record<string, {
      recentUpvoters: any[];
      latestAnswer: any | null;
    }> = {}

    // Initialize map
    postIds.forEach(id => {
      insights[id] = {
        recentUpvoters: [],
        latestAnswer: null
      }
    })

    if (postIds.length > 0) {
      // 2. Fetch all upvotes for these posts in one query
      const { data: votes, error: votesError } = await supabase
        .from('votes')
        .select('post_id, user_id, users:user_id ( id, full_name, avatar_url )')
        .in('post_id', postIds)
        .eq('vote_type', 'upvote')
        .order('created_at', { ascending: false })

      if (votesError) {
        console.error('Error fetching votes:', votesError)
      } else if (votes) {
        const postVotesCount: Record<string, Set<string>> = {}
        votes.forEach(v => {
          if (!postVotesCount[v.post_id]) {
            postVotesCount[v.post_id] = new Set()
          }
          const seenSet = postVotesCount[v.post_id]
          if (v.users && !seenSet.has(v.users.id) && seenSet.size < 3) {
            seenSet.add(v.users.id)
            insights[v.post_id].recentUpvoters.push({
              id: v.users.id,
              full_name: v.users.full_name,
              avatar_url: v.users.avatar_url
            })
          }
        })
      }

      // 3. Fetch all answers for these posts in one query
      const { data: answers, error: answersError } = await supabase
        .from('answers')
        .select('id, post_id, content, created_at, users!answers_author_id_fkey ( id, full_name, avatar_url )')
        .in('post_id', postIds)
        .order('created_at', { ascending: false })

      if (answersError) {
        console.error('Error fetching answers:', answersError)
      } else if (answers) {
        const processedPosts = new Set<string>()
        answers.forEach(ans => {
          if (!processedPosts.has(ans.post_id)) {
            processedPosts.add(ans.post_id)
            insights[ans.post_id].latestAnswer = {
              id: ans.id,
              content: ans.content,
              created_at: ans.created_at,
              users: ans.users
            }
          }
        })
      }
    }

    return NextResponse.json({ success: true, insights })
  } catch (error: any) {
    console.error('Insights fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
