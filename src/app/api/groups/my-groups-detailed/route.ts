import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/session'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('=== /api/groups/my-groups-detailed called ===')

    // SECURITY: Use signed session verification instead of direct cookie parsing
    // Direct JSON.parse(cookie.value) is unsafe because cookies can be modified
    // via DevTools or proxy tools, allowing session hijacking and privilege escalation
    const user = await getAuthenticatedUser(request)
    if (!user) {
      console.log('No session found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cookieUser = user
    console.log('User from session:', cookieUser.id)

      console.log('=== Fetching user groups ===')
      console.log('cookieUser.id:', cookieUser.id)

      // Get user's groups with member count and creator info
      console.time('query: getGroups')
      const { data: groups, error: groupsError } = await supabase
        .from('student_groups')
        .select(`
        id,
        name,
        slug,
        description,
        is_private,
        member_count,
        created_at,
        is_active,
        auto_delete_at,
        created_by,
        colleges (
          slug
        ),
        creator:users!student_groups_created_by_fkey (
          id,
          full_name,
          avatar_url,
          role,
          is_verified
        )
      `)
        .eq('created_by', cookieUser.id)
        .is('is_active', true)
        .order('created_at', { ascending: false })
      console.timeEnd('query: getGroups')

      console.log('groups query completed')
      console.log('groups:', groups)
      console.log('groupsError:', groupsError)



      if (groupsError) {
        console.error('Groups fetch error:', groupsError)
        return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        groups: groups || []
      })

  } catch (error) {
    console.error('My groups detailed API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
