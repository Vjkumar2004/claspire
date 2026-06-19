import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getCommunityDisplayCounts, resolveCommunityCollegeId, normalizeCollegeRelation } from '@/lib/community-stats'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function GET() {
  try {
    const { data: communities } = await supabase
      .from('communities')
      .select('id, slug, display_name, college_id, colleges ( id, logo_url, short_name )')
      .eq('is_active', true)
      .order('member_count', { ascending: false })
      .limit(20)

    if (!communities?.length) {
      return NextResponse.json({ communities: [] })
    }

    const enriched = await Promise.all(
      communities.map(async (comm) => {
        const collegeId = await resolveCommunityCollegeId(
          supabase,
          comm,
          normalizeCollegeRelation((comm as { colleges?: unknown }).colleges)
        )
        const { totalMembers, seniorCount } = await getCommunityDisplayCounts(
          supabase,
          comm.id,
          collegeId
        )
        return {
          id: comm.id,
          slug: comm.slug,
          display_name: comm.display_name,
          college_id: comm.college_id,
          member_count: totalMembers,
          senior_count: seniorCount,
          colleges: comm.colleges,
        }
      })
    )

    enriched.sort((a, b) => b.member_count - a.member_count)

    return NextResponse.json({ communities: enriched })
  } catch (err) {
    console.error('Leaderboard API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
