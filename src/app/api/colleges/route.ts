import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function GET() {
  try {
    const { data: communities, error: communitiesError } = await supabase
      .from('communities')
      .select(`
        id,
        slug,
        display_name,
        member_count,
        senior_count,
        doubt_count,
        colleges (
          id,
          name,
          short_name,
          location,
          state,
          type
        )
      `)
      .order('member_count', { ascending: false })

    if (communitiesError) throw communitiesError

    const { data: colleges, error: collegesError } = await supabase
      .from('colleges')
      .select('id, name, short_name, slug, location, state, type')
      .order('name', { ascending: true })

    if (collegesError) throw collegesError

    const collegeIds = (colleges || []).map((college) => college.id)

    const usersResult = collegeIds.length > 0
      ? await supabase
          .from('users')
          .select('college_id, role')
          .in('college_id', collegeIds)
      : { data: [], error: null }

    if (usersResult.error) throw usersResult.error

    const statsByCollege = new Map<string, { member_count: number; senior_count: number; doubt_count: number }>()

    for (const college of colleges || []) {
      statsByCollege.set(college.id, {
        member_count: 0,
        senior_count: 0,
        doubt_count: 0
      })
    }

    for (const user of usersResult.data || []) {
      if (!user.college_id) continue

      const stats = statsByCollege.get(user.college_id)
      if (!stats) continue

      stats.member_count += 1
      if (user.role === 'senior') {
        stats.senior_count += 1
      }
    }

    const existingByCollegeId = new Map(
      (communities || [])
        .filter((community: any) => community.colleges?.id)
        .map((community: any) => [community.colleges.id, community])
    )

    const mergedCommunities = (colleges || []).map((college) => {
      const stats = statsByCollege.get(college.id) || {
        member_count: 0,
        senior_count: 0,
        doubt_count: 0
      }

      const existingCommunity = existingByCollegeId.get(college.id)
      if (existingCommunity) {
        return {
          ...existingCommunity,
          member_count: Math.max(existingCommunity.member_count || 0, stats.member_count),
          senior_count: Math.max(existingCommunity.senior_count || 0, stats.senior_count),
        }
      }

      return {
        id: college.id,
        slug: college.slug,
        display_name: college.short_name || college.name,
        ...stats,
        colleges: college
      }
    })

    return NextResponse.json({
      success: true,
      communities: mergedCommunities
    })

  } catch (err: any) {
    console.error('Colleges fetch error:', err)
    return NextResponse.json(
      { error: 'Server error', details: err.message },
      { status: 500 }
    )
  }
}
