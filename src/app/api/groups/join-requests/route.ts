import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser } from '@/lib/session'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type JoinRequestRow = {
  id: string
  group_id: string
  status: string
  requested_at: string
  users: unknown
}

export async function GET(request: NextRequest) {
  try {
    // SECURITY: Use signed session verification instead of direct cookie parsing
    // Direct JSON.parse(cookie.value) is unsafe because cookies can be modified
    // via DevTools or proxy tools, allowing session hijacking and privilege escalation
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cookieUser = user

    const { data: groups, error: groupsError } = await supabase
      .from('student_groups')
      .select('id, name, slug')
      .eq('created_by', cookieUser.id)
      .eq('is_active', true)

    if (groupsError) {
      return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 })
    }

    const groupIds = groups?.map((group) => group.id) || []

    if (!groupIds.length) {
      return NextResponse.json({ requests: [] })
    }

    const { data: requests, error } = await supabase
      .from('student_group_join_requests')
      .select(`
        id,
        group_id,
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
            short_name,
            location,
            state
          )
        )
      `)
      .in('group_id', groupIds)
      .eq('status', 'pending')
      .order('requested_at', { ascending: false })

    if (error) {
      console.error('Join requests fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 })
    }

    const groupById = new Map(groups.map((group) => [group.id, group]))
    const formatted = ((requests || []) as JoinRequestRow[]).map((request) => ({
      ...request,
      group: groupById.get(request.group_id) || null
    }))

    return NextResponse.json({ requests: formatted })
  } catch (error) {
    console.error('Join requests inbox error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
