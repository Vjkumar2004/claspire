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

    const [incomingResult, outgoingResult] = await Promise.all([
      supabase
        .from('connections')
        .select('id, sender_id, receiver_id, status, created_at')
        .eq('receiver_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false }),
      supabase
        .from('connections')
        .select('id, sender_id, receiver_id, status, created_at')
        .eq('sender_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false }),
    ])

    const incoming = incomingResult.data || []
    const outgoing = outgoingResult.data || []

    const incomingSenderIds = incoming.map((r) => r.sender_id)
    const outgoingReceiverIds = outgoing.map((r) => r.receiver_id)
    const allPeerIds = [...new Set([...incomingSenderIds, ...outgoingReceiverIds])]

    let peers: any[] = []
    if (allPeerIds.length > 0) {
      const { data } = await supabase
        .from('users')
        .select('id, full_name, unique_id, role, avatar_url, banner_url, company, designation, branch, college_id, graduation_year, last_seen, college:college_id(name, short_name)')
        .in('id', allPeerIds)
      peers = data || []
    }

    const peerMap = new Map(peers.map((p) => [p.id, p]))

    const incomingFormatted = incoming.map((r) => {
      const sender = peerMap.get(r.sender_id)
      return {
        id: r.id,
        sender_id: r.sender_id,
        receiver_id: r.receiver_id,
        status: r.status,
        created_at: r.created_at,
        full_name: sender?.full_name || 'Unknown',
        unique_id: sender?.unique_id || '',
        role: sender?.role || 'student',
        avatar_url: sender?.avatar_url || null,
        banner_url: sender?.banner_url || null,
        company: sender?.company || null,
        designation: sender?.designation || null,
        branch: sender?.branch || null,
        college_id: sender?.college_id || null,
        graduation_year: sender?.graduation_year || null,
        last_seen: sender?.last_seen || null,
        college: sender?.college || null,
      }
    })

    const outgoingFormatted = outgoing.map((r) => {
      const receiver = peerMap.get(r.receiver_id)
      return {
        id: r.id,
        sender_id: r.sender_id,
        receiver_id: r.receiver_id,
        status: r.status,
        created_at: r.created_at,
        full_name: receiver?.full_name || 'Unknown',
        unique_id: receiver?.unique_id || '',
        role: receiver?.role || 'student',
        avatar_url: receiver?.avatar_url || null,
        banner_url: receiver?.banner_url || null,
        company: receiver?.company || null,
        designation: receiver?.designation || null,
        branch: receiver?.branch || null,
        college_id: receiver?.college_id || null,
        graduation_year: receiver?.graduation_year || null,
        last_seen: receiver?.last_seen || null,
        college: receiver?.college || null,
      }
    })

    return NextResponse.json({
      incoming: incomingFormatted,
      outgoing: outgoingFormatted,
    })
  } catch (err: unknown) {
    console.error('Requests API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
