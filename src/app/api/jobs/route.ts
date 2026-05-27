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

    const { data: jobs, error } = await supabase
      .from('jobs')
      .select(`
        *,
        senior:posted_by (
          id,
          full_name,
          company,
          designation,
          college_id
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

    return NextResponse.json(jobs)
  } catch (err: any) {
    console.error('Jobs API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
