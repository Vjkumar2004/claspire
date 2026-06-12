import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function GET(req: NextRequest) {
  try {
    const cookie = req.cookies.get('claspire_session')
    if (!cookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Auto-delete jobs older than 2 days (lazy cleanup)
    const twoDaysAgo = new Date()
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

    await supabase
      .from('jobs')
      .delete()
      .lt('created_at', twoDaysAgo.toISOString())

    // Fetch jobs with senior and community data
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select(`
        *,
        senior:posted_by (
          id,
          full_name,
          company,
          designation,
          college_id,
          avatar_url
        ),
        community:community_id (
          display_name,
          slug,
          colleges (
            name,
            short_name,
            location
          )
        )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching jobs:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Count referral requests per job
    const jobIds = (jobs || []).map(j => j.id)
    const referralCounts: Record<string, number> = {}

    if (jobIds.length > 0) {
      const { data: referralRequests } = await supabase
        .from('referral_requests')
        .select('job_id')
        .in('job_id', jobIds)

      referralRequests?.forEach(r => {
        referralCounts[r.job_id] = (referralCounts[r.job_id] || 0) + 1
      })
    }

    // Stats
    const { count: totalJobs } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    const referralAvailableCount = jobs?.filter(j => j.referral_available).length || 0

    const uniqueCompanies = new Set((jobs || []).map(j => j.company_name).filter(Boolean))
    const totalCompanies = uniqueCompanies.size

    const { count: totalApplications } = await supabase
      .from('referral_requests')
      .select('*', { count: 'exact', head: true })

    // Top referrers (seniors with most referral requests)
    const { data: allReferralRequests } = await supabase
      .from('referral_requests')
      .select('senior_id')
      .not('senior_id', 'is', null)

    const seniorCounts: Record<string, number> = {}
    allReferralRequests?.forEach(r => {
      if (r.senior_id) {
        seniorCounts[r.senior_id] = (seniorCounts[r.senior_id] || 0) + 1
      }
    })

    const topSeniorEntries = Object.entries(seniorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)

    let topReferrers: any[] = []

    if (topSeniorEntries.length > 0) {
      const { data: seniorProfiles } = await supabase
        .from('users')
        .select('id, full_name, company, designation, avatar_url')
        .in('id', topSeniorEntries.map(([id]) => id))

      topReferrers = topSeniorEntries
        .map(([id, count]) => {
          const profile = seniorProfiles?.find(p => p.id === id)
          if (!profile) return null
          return {
            id: profile.id,
            full_name: profile.full_name,
            company: profile.company,
            designation: profile.designation,
            avatar_url: profile.avatar_url,
            referral_count: count
          }
        })
        .filter(Boolean)
        .slice(0, 5)
    }

    // Enrich jobs with computed fields
    const enrichedJobs = (jobs || []).map(job => ({
      ...job,
      referral_count: referralCounts[job.id] || 0,
      skills: []
    }))

    return NextResponse.json({
      jobs: enrichedJobs,
      stats: {
        totalJobs: totalJobs || 0,
        totalReferrals: referralAvailableCount,
        totalCompanies,
        totalApplications: totalApplications || 0
      },
      topReferrers
    })
  } catch (err: any) {
    console.error('Jobs API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
