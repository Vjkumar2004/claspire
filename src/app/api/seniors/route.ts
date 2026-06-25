import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser } from '@/lib/session'
import { applyRateLimit, getUserIdentifier } from '@/lib/rateLimitRedis'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

const SENIOR_SELECT = `
  id,
  full_name,
  unique_id,
  role,
  college_id,
  company,
  designation,
  graduation_year,
  rise_points,
  avatar_url,
  college:college_id (
    name,
    short_name,
    location,
    state
  )
`

const TOP_CONTRIBUTOR_MIN_POINTS = 1
const DEFAULT_FEATURED_LIMIT = 9
const DEFAULT_PAGE_LIMIT = 12
const MAX_LIMIT = 24

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const userIdentifier = await getUserIdentifier(req)
    const rateLimitResult = await applyRateLimit(req, 'general', userIdentifier)
    if (!rateLimitResult.success && rateLimitResult.response) {
      return rateLimitResult.response
    }

    const { searchParams } = new URL(req.url)
    const limit = Math.min(
      parseInt(searchParams.get('limit') || String(DEFAULT_PAGE_LIMIT), 10) || DEFAULT_PAGE_LIMIT,
      MAX_LIMIT
    )
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10) || 0, 0)
    const featured = searchParams.get('featured') === 'true'
    const metaOnly = searchParams.get('meta') === 'true'
    const q = searchParams.get('q')?.trim() || ''
    const collegeId = searchParams.get('college')?.trim() || ''
    const location = searchParams.get('location')?.trim() || ''
    const company = searchParams.get('company')?.trim() || ''

    const isPaginated =
      searchParams.has('limit') ||
      searchParams.has('offset') ||
      searchParams.has('featured') ||
      searchParams.has('q') ||
      searchParams.has('college') ||
      searchParams.has('location') ||
      searchParams.has('company') ||
      searchParams.has('meta')

    if (metaOnly) {
      const [{ data: colleges }, { data: companies }] = await Promise.all([
        supabase
          .from('colleges')
          .select('id, name, short_name, location, state')
          .order('name', { ascending: true }),
        supabase
          .from('users')
          .select('company')
          .eq('role', 'senior')
          .eq('verification_status', 'verified')
          .not('company', 'is', null),
      ])

      const uniqueCompanies = [
        ...new Set(
          (companies || [])
            .map((row) => row.company?.trim())
            .filter(Boolean) as string[]
        ),
      ].sort((a, b) => a.localeCompare(b))

      const uniqueLocations = [
        ...new Set(
          (colleges || [])
            .map((c) => c.location?.trim())
            .filter(Boolean) as string[]
        ),
      ].sort((a, b) => a.localeCompare(b))

      return NextResponse.json({
        colleges: colleges || [],
        companies: uniqueCompanies,
        locations: uniqueLocations,
      })
    }

    let collegeIdsForLocation: string[] | null = null
    if (location) {
      const { data: matchedColleges } = await supabase
        .from('colleges')
        .select('id')
        .or(`location.ilike.%${location.replace(/[%_]/g, '').slice(0, 100)}%,state.ilike.%${location.replace(/[%_]/g, '').slice(0, 100)}%`)

      collegeIdsForLocation = matchedColleges?.map((c) => c.id) || []
      if (collegeIdsForLocation.length === 0) {
        if (!isPaginated) return NextResponse.json([])
        return NextResponse.json({
          seniors: [],
          total: 0,
          hasMore: false,
          limit,
          offset,
        })
      }
    }

    let query = supabase
      .from('users')
      .select(SENIOR_SELECT, { count: 'exact' })
      .eq('role', 'senior')
      .eq('verification_status', 'verified')

    const excludeId = searchParams.get('exclude_id')?.trim()
    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const hasActiveFilters = !!(q || collegeId || location || company)

    if (featured && !hasActiveFilters) {
      query = query.gt('rise_points', TOP_CONTRIBUTOR_MIN_POINTS)
    }

    if (q) {
      const sanitizedQ = q.replace(/[%_]/g, '').slice(0, 100)
      query = query.or(
        `full_name.ilike.%${sanitizedQ}%,company.ilike.%${sanitizedQ}%,designation.ilike.%${sanitizedQ}%`
      )
    }

    if (company) {
      query = query.ilike('company', `%${company}%`)
    }

    if (collegeId) {
      query = query.eq('college_id', collegeId)
    }

    if (collegeIdsForLocation) {
      query = query.in('college_id', collegeIdsForLocation)
    }

    query = query
      .order('rise_points', { ascending: false })
      .order('created_at', { ascending: false })

    const effectiveLimit = featured && !hasActiveFilters && offset === 0
      ? Math.min(limit, DEFAULT_FEATURED_LIMIT)
      : limit

    const { data: seniors, error, count } = await query.range(
      offset,
      offset + effectiveLimit - 1
    )

    if (error) {
      console.error('Error fetching seniors:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const total = count ?? 0
    const hasMore = offset + effectiveLimit < total

    return NextResponse.json({
      seniors: seniors || [],
      total,
      hasMore,
      limit: effectiveLimit,
      offset,
      featured: featured && !hasActiveFilters,
    })
  } catch (err: unknown) {
    console.error('Seniors API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
