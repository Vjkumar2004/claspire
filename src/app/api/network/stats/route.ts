import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser } from '@/lib/session'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const [acceptedResult, pendingIncomingResult, pendingOutgoingResult, followingResult, communitiesResult] = await Promise.all([
      supabase
        .from('connections')
        .select('id', { count: 'exact' })
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .eq('status', 'accepted'),
      supabase
        .from('connections')
        .select('id', { count: 'exact' })
        .eq('receiver_id', user.id)
        .eq('status', 'pending'),
      supabase
        .from('connections')
        .select('id', { count: 'exact' })
        .eq('sender_id', user.id)
        .eq('status', 'pending'),
      supabase
        .from('follows')
        .select('id', { count: 'exact' })
        .eq('follower_id', user.id),
      supabase
        .from('community_members')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id),
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
