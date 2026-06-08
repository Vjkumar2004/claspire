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

    const { data: connections, error } = await supabase
      .from('connections')
      .select(`
        id,
        sender_id,
        receiver_id,
        status,
        created_at,
        responded_at
      `)
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .eq('status', 'accepted')
      .order('responded_at', { ascending: false })

    if (error) {
      console.error('Connections list error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!connections || connections.length === 0) {
      return NextResponse.json({ connections: [] })
    }

    const peerIds = connections.map((c) =>
      c.sender_id === user.id ? c.receiver_id : c.sender_id
    )

    const { data: peers, error: peersError } = await supabase
      .from('users')
      .select(`
        id, full_name, unique_id, role, avatar_url, company, designation,
        branch, graduation_year, passout_year, college_id,
        college:college_id ( name, short_name )
      `)
      .in('id', peerIds)

    if (peersError) {
      console.error('Peers fetch error:', peersError)
      return NextResponse.json({ error: peersError.message }, { status: 500 })
    }

    const peerMap = new Map((peers || []).map((p) => [p.id, p]))

    const formatted = connections.map((c) => {
      const peerId = c.sender_id === user.id ? c.receiver_id : c.sender_id
      const peer = peerMap.get(peerId)
      return {
        connection_id: c.id,
        user_id: peerId,
        full_name: peer?.full_name || 'Unknown',
        unique_id: peer?.unique_id || '',
        role: peer?.role || 'student',
        avatar_url: peer?.avatar_url || null,
        company: peer?.company || null,
        designation: peer?.designation || null,
        branch: peer?.branch || null,
        graduation_year: peer?.graduation_year || null,
        passout_year: peer?.passout_year || null,
        college: peer?.college || null,
        accepted_at: c.responded_at,
      }
    })

    return NextResponse.json({ connections: formatted })
  } catch (err: unknown) {
    console.error('Connections API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
