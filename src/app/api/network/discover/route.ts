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
  banner_url,
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

    // Fetch existing connections to exclude them from Discover
    const { data: excludedConnections, error: excludeError } = await supabase
      .from('connections')
      .select('sender_id, receiver_id, status, updated_at')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)

    console.log('[Discover] User ID:', user.id)
    console.log('[Discover] Connections found:', excludedConnections?.length, excludedConnections?.map(c => ({ s: c.sender_id, r: c.receiver_id, status: c.status })))
    if (excludeError) console.error('[Discover] Exclude query error:', excludeError)

    const excludedSet = new Set<string>()
    excludedSet.add(user.id) // Exclude current user (self)

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    for (const conn of excludedConnections || []) {
      const otherId = conn.sender_id === user.id ? conn.receiver_id : conn.sender_id
      if (conn.status === 'accepted' || conn.status === 'pending') {
        // Always exclude accepted and pending connections
        excludedSet.add(otherId)
      } else if (conn.status === 'rejected') {
        const updatedAt = conn.updated_at ? new Date(conn.updated_at) : new Date()
        if (updatedAt > thirtyDaysAgo) {
          excludedSet.add(otherId)
        }
      }
      // cancelled, removed, deleted: don't exclude (let them reappear)
    }

    const excludedArray = Array.from(excludedSet)
    console.log('[Discover] Excluded IDs:', excludedArray)

    // NOTE: We intentionally do NOT use .not('id', 'in', ...) because Supabase PostgREST
    // silently fails UUID exclusion with certain formats. Instead, we over-fetch and
    // filter in JS below for guaranteed correctness.
    let query = supabase
      .from('users')
      .select(PERSON_SELECT, { count: 'exact' })

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

    // Fetch connections between the current user and the discovered people
    // Use a single .or() to properly filter connections involving the current user
    const [connectionsResult, followsResult] = await Promise.all([
      supabase
        .from('connections')
        .select('sender_id, receiver_id, status')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .in('status', ['accepted', 'pending']),
      supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id)
        .in('following_id', personIds),
    ])

    const followedIds = new Set((followsResult.data || []).map((f) => f.following_id))
    const pendingSentIds = new Set<string>()
    const pendingReceivedIds = new Set<string>()
    const acceptedIds = new Set<string>()

    for (const conn of connectionsResult.data || []) {
      const otherId = conn.sender_id === user.id ? conn.receiver_id : conn.sender_id
      if (!personIds.includes(otherId)) continue // Only care about discovered people
      
      if (conn.status === 'accepted') {
        acceptedIds.add(otherId)
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
        score += 80
      }
      if (currentUserYear && person.graduation_year && person.graduation_year === currentUserYear) {
        score += 60
      }
      if (currentUserCollege && person.college_id === currentUserCollege && person.role === 'senior') {
        score += 40
      }

      const mutualConnections = [...acceptedIds].filter((id) =>
        personIds.includes(id)
      ).length

      score += mutualConnections * 30
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
        banner_url: person.banner_url,
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
    }).filter((person) => !excludedSet.has(person.id))

    console.log('[Discover] Pre-filter count:', people.length, 'Post-filter count:', formatted.length, 'Excluded:', people.length - formatted.length)

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
