import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser } from '@/lib/session'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

const PERSON_SELECT = `
  id,
  full_name,
  unique_id,
  role,
  avatar_url,
  college_id,
  branch,
  company,
  designation,
  graduation_year,
  passout_year,
  rise_points,
  college:college_id (
    name,
    short_name,
    location
  )
`

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')?.trim() || ''
    const roleFilter = searchParams.get('role')?.trim() || ''
    const collegeId = searchParams.get('college')?.trim() || ''
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0)

    const currentUserCollege = user.college_id
    const currentUserBranch = user.branch || ''
    const currentUserYear = user.graduation_year || user.passout_year || 0

    let query = supabase
      .from('users')
      .select(PERSON_SELECT, { count: 'exact' })
      .neq('id', user.id)

    if (q) {
      query = query.or(
        `full_name.ilike.%${q}%,unique_id.ilike.%${q}%,company.ilike.%${q}%,designation.ilike.%${q}%,branch.ilike.%${q}%,role.ilike.%${q}%`
      )
    }

    if (roleFilter) {
      if (roleFilter === 'alumni') {
        query = query.not('passout_year', 'is', null)
      } else {
        query = query.eq('role', roleFilter)
      }
    }

    if (collegeId) {
      query = query.eq('college_id', collegeId)
    }

    const { data: people, error, count } = await query
      .order('rise_points', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Discover error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!people || people.length === 0) {
      return NextResponse.json({ people: [], total: 0, hasMore: false })
    }

    const personIds = people.map((p) => p.id)

    const [connectionsResult, followsResult] = await Promise.all([
      supabase
        .from('connections')
        .select('sender_id, receiver_id, status')
        .or(`sender_id.in.(${personIds.map(id => `"${id}"`).join(',')}),receiver_id.in.(${personIds.map(id => `"${id}"`).join(',')})`)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`),
      supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id)
        .in('following_id', personIds),
    ])

    const followedIds = new Set((followsResult.data || []).map((f) => f.following_id))
    const followingIds = new Set<string>()
    const pendingSentIds = new Set<string>()
    const pendingReceivedIds = new Set<string>()
    const acceptedIds = new Set<string>()

    for (const conn of connectionsResult.data || []) {
      if (conn.status === 'accepted') {
        acceptedIds.add(conn.sender_id === user.id ? conn.receiver_id : conn.sender_id)
      } else if (conn.status === 'pending') {
        if (conn.sender_id === user.id) {
          pendingSentIds.add(conn.receiver_id)
        } else {
          pendingReceivedIds.add(conn.sender_id)
        }
      }
    }

    const formatted = people.map((person) => {
      let score = 0

      if (currentUserCollege && person.college_id === currentUserCollege) {
        score += 100
      }
      if (currentUserBranch && person.branch && person.branch.toLowerCase() === currentUserBranch.toLowerCase()) {
        score += 50
      }
      if (currentUserYear && person.graduation_year && person.graduation_year === currentUserYear) {
        score += 30
      }
      if (acceptedIds.has(person.id)) {
        score += 40
      }

      const mutualConnections = [...acceptedIds].filter((id) =>
        personIds.includes(id)
      ).length

      score += mutualConnections * 5
      score += (person.rise_points || 0) * 0.05

      let connectionStatus: string = 'none'
      if (acceptedIds.has(person.id)) {
        connectionStatus = 'accepted'
      } else if (pendingSentIds.has(person.id)) {
        connectionStatus = 'pending_sent'
      } else if (pendingReceivedIds.has(person.id)) {
        connectionStatus = 'pending_received'
      }

      const isFollowing = followedIds.has(person.id)

      return {
        id: person.id,
        full_name: person.full_name,
        unique_id: person.unique_id,
        role: person.role,
        avatar_url: person.avatar_url,
        college_id: person.college_id,
        branch: person.branch,
        company: person.company,
        designation: person.designation,
        graduation_year: person.graduation_year,
        passout_year: person.passout_year,
        rise_points: person.rise_points,
        college: person.college,
        connectionStatus,
        isFollowing,
        mutualConnections,
        score: Math.round(score),
      }
    })

    formatted.sort((a, b) => b.score - a.score)

    const total = count ?? formatted.length
    const hasMore = offset + limit < total

    return NextResponse.json({
      people: formatted,
      total,
      hasMore,
      limit,
      offset,
    })
  } catch (err: unknown) {
    console.error('Discover API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
