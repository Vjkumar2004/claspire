import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const cookiesStore = await cookies()
    const sessionCookie = cookiesStore.get('claspire_session')

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cookieUser = JSON.parse(sessionCookie.value)

    // Get group and verify admin
    const { data: group, error: groupError } = await supabase
      .from('student_groups')
      .select('id, created_by')
      .eq('slug', slug)
      .single()

    if (groupError) {
      console.error('Group fetch error:', groupError)
      return NextResponse.json({ error: 'Group not found', details: groupError.message }, { status: 404 })
    }

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    console.log('Group found:', group.id, 'User:', cookieUser.id, 'Creator:', group.created_by)

    if (group.created_by !== cookieUser.id) {
      return NextResponse.json({ error: 'Forbidden - Only group creator can view requests' }, { status: 403 })
    }

    // Get pending requests with user details
    const { data: requests, error } = await supabase
      .from('student_group_join_requests')
      .select(`
        id,
        status,
        requested_at,
        users!student_group_join_requests_user_id_fkey (
          id,
          full_name,
          avatar_url,
          role,
          unique_id,
          branch,
          year,
          colleges (
            name,
            location,
            state
          )
        )
      `)
      .eq('group_id', group.id)
      .eq('status', 'pending')
      .order('requested_at', { ascending: false })

    if (error) {
      console.error('Requests fetch error:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch requests', 
        details: error.message,
        code: error.code
      }, { status: 500 })
    }

    console.log('Requests found:', requests?.length || 0)

    return NextResponse.json({ requests: requests ?? [] })

  } catch (error) {
    console.error('Get requests error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
