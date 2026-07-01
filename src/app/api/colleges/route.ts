import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logCacheFetch, logCacheHit } from '@/lib/cache-logger'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export const revalidate = 300

export async function GET() {
  const startTime = Date.now()
  const dbStartTime = Date.now()
  
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API /colleges] Starting database queries...`)
    }

    const [
      collegesResult,
      communitiesResult,
      usersResult,
      connectionsResult,
    ] = await Promise.all([
      supabase.from('colleges').select('id, name, short_name, slug, location, state, type, logo_url, is_verified, website_url, description, rating, avg_package, highest_package, placement_rate, nirf_rank').order('name', { ascending: true }),
      supabase.from('communities').select(`
        id, slug, display_name, member_count, senior_count, doubt_count, last_activity_at, college_id,
        colleges ( id, name, short_name, slug, location, state, type, logo_url, is_verified, website_url, description, rating, avg_package, highest_package, placement_rate, nirf_rank )
      `).eq('is_active', true).order('member_count', { ascending: false }).limit(200),
      supabase.from('users').select('college_id, role'),
      supabase.from('connections').select('id', { count: 'exact', head: true }).eq('status', 'accepted'),
    ])

    const dbDuration = Date.now() - dbStartTime
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API /colleges] Database queries completed: ${dbDuration.toFixed(2)}ms`)
    }

    if (collegesResult.error) throw collegesResult.error
    if (communitiesResult.error) throw communitiesResult.error
    if (usersResult.error) throw usersResult.error

    const colleges = collegesResult.data || []
    const communities = communitiesResult.data || []
    const users = usersResult.data || []
    const totalConnections = connectionsResult.count ?? 0

    if (process.env.NODE_ENV === 'development') {
      console.log(`[API /colleges] Data fetched - Colleges: ${colleges.length}, Communities: ${communities.length}, Users: ${users.length}`)
    }

    // Stats by college from users
    const processingStartTime = Date.now()
    const statsByCollege = new Map<string, { member_count: number; senior_count: number }>()
    for (const college of colleges) {
      statsByCollege.set(college.id, { member_count: 0, senior_count: 0 })
    }
    for (const user of users) {
      if (!user.college_id) continue
      const stats = statsByCollege.get(user.college_id)
      if (!stats) {
        statsByCollege.set(user.college_id, { member_count: 1, senior_count: user.role === 'senior' ? 1 : 0 })
        continue
      }
      stats.member_count += 1
      if (user.role === 'senior') stats.senior_count += 1
    }

    // Total stats
    const totalStudents = users.filter(u => u.role === 'student').length
    const totalSeniors = users.filter(u => u.role === 'senior').length

    const processingDuration = Date.now() - processingStartTime
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API /colleges] User stats processing: ${processingDuration.toFixed(2)}ms`)
    }

    // Merge communities with college data
    const existingByCollegeId = new Map(
      (communities as any[])
        .filter((c: any) => c.colleges?.id)
        .map((c: any) => [c.colleges.id, c])
    )

    const mergedColleges = colleges.map((college) => {
      const stats = statsByCollege.get(college.id) || { member_count: 0, senior_count: 0 }
      const existing = existingByCollegeId.get(college.id)
      if (existing) {
        return {
          id: existing.id,
          slug: existing.slug,
          display_name: existing.display_name,
          member_count: Math.max(existing.member_count || 0, stats.member_count || 0),
          senior_count: Math.max(existing.senior_count || 0, stats.senior_count || 0),
          doubt_count: existing.doubt_count || 0,
          last_activity_at: existing.last_activity_at || null,
          colleges: college,
        }
      }
      return {
        id: college.id,
        slug: college.slug,
        display_name: college.short_name || college.name,
        member_count: stats.member_count || 0,
        senior_count: stats.senior_count || 0,
        doubt_count: 0,
        last_activity_at: null,
        colleges: college,
      }
    })

    // Recently active: use communities with non-null last_activity_at, sorted desc
    const sortingStartTime = Date.now()
    const withActivity = mergedColleges.filter(c => c.last_activity_at)
    const recentlyActive = [...withActivity]
      .sort((a, b) => new Date(b.last_activity_at!).getTime() - new Date(a.last_activity_at!).getTime())
      .slice(0, 5)

    // Fastest growing: by senior density (seniors / members)
    const fastestGrowing = [...mergedColleges]
      .filter(c => c.member_count > 0)
      .sort((a, b) => {
        const ratioA = a.senior_count / a.member_count
        const ratioB = b.senior_count / b.member_count
        return ratioB - ratioA
      })
      .slice(0, 5)

    // Trending: highest member_count
    const trending = [...mergedColleges]
      .sort((a, b) => b.member_count - a.member_count)
      .slice(0, 5)

    const sortingDuration = Date.now() - sortingStartTime
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API /colleges] Sorting operations: ${sortingDuration.toFixed(2)}ms`)
    }

    const duration = Date.now() - startTime
    logCacheFetch('colleges-list', duration, { count: mergedColleges.length })
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API /colleges] Total API duration: ${duration.toFixed(2)}ms`)
      console.log(`[API /colleges] Breakdown - DB: ${dbDuration.toFixed(2)}ms, Processing: ${processingDuration.toFixed(2)}ms, Sorting: ${sortingDuration.toFixed(2)}ms`)
    }

    return NextResponse.json({
      success: true,
      heroStats: {
        totalColleges: colleges.length,
        totalStudents,
        totalSeniors,
        totalConnections,
      },
      colleges: mergedColleges,
      trending,
      fastestGrowing,
      recentlyActive,
    })
  } catch (err: any) {
    console.error('Colleges fetch error:', err)
    return NextResponse.json({ error: 'Server error', details: err.message }, { status: 500 })
  }
}
