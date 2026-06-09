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

    // Phase 1: Single connections query for exclusion + mutual connections
    const { data: connections, error: connError } = await supabase
      .from('connections')
      .select('sender_id, receiver_id, status, responded_at')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)

    if (connError) {
      console.error('[Discover] Connections query error:', connError)
    }

    const excludedIds = new Set<string>()
    excludedIds.add(user.id)

    const acceptedIds = new Set<string>()
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    for (const conn of connections || []) {
      const otherId = conn.sender_id === user.id ? conn.receiver_id : conn.sender_id
      if (conn.status === 'accepted') {
        excludedIds.add(otherId)
        acceptedIds.add(otherId)
      } else if (conn.status === 'pending') {
        excludedIds.add(otherId)
      } else if (conn.status === 'rejected') {
        const respondedAt = conn.responded_at ? new Date(conn.responded_at) : new Date()
        if (respondedAt > thirtyDaysAgo) {
          excludedIds.add(otherId)
        }
      }
      // cancelled, removed, deleted: do NOT exclude
    }

    // Phase 2: Fetch user IDs (lightweight) with all search/filters, then JS-exclude
    // Using IDs-first approach avoids PostgREST UUID not.in issues documented in the codebase.
    // We cap at MAX_FETCH_IDS to keep the payload reasonable; pagination past this cap
    // will still work correctly (hasMore signals when the cap is reached).
    let idQuery = supabase
      .from('users')
      .select('id')

    if (q) {
      idQuery = idQuery.or(
        `full_name.ilike.%${q}%,unique_id.ilike.%${q}%,company.ilike.%${q}%,designation.ilike.%${q}%,branch.ilike.%${q}%,role.ilike.%${q}%`
      )
    }

    if (roleFilter) {
      if (roleFilter === 'alumni') {
        idQuery = idQuery.not('passout_year', 'is', null)
      } else {
        idQuery = idQuery.eq('role', roleFilter)
      }
    }

    if (collegeId) {
      idQuery = idQuery.eq('college_id', collegeId)
    }

    const MAX_FETCH_IDS = 5000
    const fetchLimit = Math.min(offset + limit + 200, MAX_FETCH_IDS)

    const { data: allIds, error: idError } = await idQuery
      .order('rise_points', { ascending: false })
      .range(0, fetchLimit - 1)

    if (idError) {
      console.error('[Discover] ID query error:', idError)
      return NextResponse.json({ error: idError.message }, { status: 500 })
    }

    // Apply JS exclusion to get the true visible set
    const visibleIds = (allIds || [])
      .map(r => r.id)
      .filter(id => !excludedIds.has(id))

    const total = visibleIds.length
    const pageIds = visibleIds.slice(offset, offset + limit)

    if (pageIds.length === 0) {
      return NextResponse.json({ people: [], total: 0, hasMore: false })
    }

    // Phase 2b: Fetch full person data for the visible page
    const { data: people, error: peopleError } = await supabase
      .from('users')
      .select(PERSON_SELECT)
      .in('id', pageIds)

    if (peopleError) {
      console.error('[Discover] People query error:', peopleError)
      return NextResponse.json({ error: peopleError.message }, { status: 500 })
    }

    // Phase 3: Fetch follows for visible users
    const { data: follows } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id)
      .in('following_id', pageIds)

    const followedIds = new Set((follows || []).map(f => f.following_id))

    // Reconstruct the original order since .in() doesn't preserve it
    const peopleMap = new Map((people || []).map(p => [p.id, p]))
    const orderedPeople = pageIds.map(id => peopleMap.get(id)).filter(Boolean)

    const formatted = orderedPeople.map((person: any) => {
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
        pageIds.includes(id)
      ).length

      score += mutualConnections * 30
      score += (person.rise_points || 0) * 0.05

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
        connectionStatus: 'none',
        isFollowing: followedIds.has(person.id),
        mutualConnections,
        score: Math.round(score),
      }
    })

    const hasMore = offset + limit < total

    return NextResponse.json({
      people: formatted,
      total,
      hasMore,
      limit,
      offset,
    })
  } catch (err: unknown) {
    console.error('[Discover] API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
