import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sanitizeSearchInput } from '@/lib/sanitize'
import { getUserIdFromRequest } from '@/lib/session'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function GET(req: NextRequest) {
  try {
    const userId = getUserIdFromRequest(req)
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const [acceptedResult, pendingIncomingResult, pendingOutgoingResult, followingResult, communitiesResult] = await Promise.all([
      supabase
        .from('connections')
        .select('id', { count: 'exact' })
        .or(`sender_id.eq.${sanitizeSearchInput(userId)},receiver_id.eq.${sanitizeSearchInput(userId)}`)
        .eq('status', 'accepted'),
      supabase
        .from('connections')
        .select('id', { count: 'exact' })
        .eq('receiver_id', userId)
        .eq('status', 'pending'),
      supabase
        .from('connections')
        .select('id', { count: 'exact' })
        .eq('sender_id', userId)
        .eq('status', 'pending'),
      supabase
        .from('follows')
        .select('id', { count: 'exact' })
        .eq('follower_id', userId),
      supabase
        .from('community_members')
        .select('id', { count: 'exact' })
        .eq('user_id', userId),
    ])

    const connections = acceptedResult.count ?? 0
    const incomingRequests = pendingIncomingResult.count ?? 0
    const outgoingRequests = pendingOutgoingResult.count ?? 0
    const following = followingResult.count ?? 0
    const communities = communitiesResult.count ?? 0

    return NextResponse.json({
      connections,
      following,
      incomingRequests,
      outgoingRequests,
      totalRequests: incomingRequests + outgoingRequests,
      communities,
    })
  } catch (err: unknown) {
    console.error('Stats API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
