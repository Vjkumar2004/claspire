import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logCacheFetch } from '@/lib/cache-logger'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function GET() {
  const startTime = Date.now()
  try {
    // Single optimized query: fetch communities with live member counts using aggregation
    const { data: communities, error } = await supabase
      .from('communities')
      .select(`
        id,
        slug,
        display_name,
        college_id,
        member_count,
        senior_count,
        colleges ( id, logo_url, short_name )
      `)
      .eq('is_active', true)
      .order('member_count', { ascending: false })
      .limit(20)

    if (error) {
      console.error('Leaderboard API error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    if (!communities?.length) {
      const duration = Date.now() - startTime
      logCacheFetch('leaderboard', duration, { count: 0 })
      return NextResponse.json({ communities: [] })
    }

    // The communities table already has member_count and senior_count columns
    // that are kept up-to-date by syncCommunityCounts, so we can use them directly
    const enriched = communities.map((comm: any) => ({
      id: comm.id,
      slug: comm.slug,
      display_name: comm.display_name,
      college_id: comm.college_id,
      member_count: comm.member_count || 0,
      senior_count: comm.senior_count || 0,
      colleges: comm.colleges,
    }))

    const duration = Date.now() - startTime
    logCacheFetch('leaderboard', duration, { count: enriched.length })

    return NextResponse.json({ communities: enriched })
  } catch (err) {
    console.error('Leaderboard API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
