import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/session'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('=== /api/groups/my-groups called ===')
    
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

    // Get user's college
    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('college_id')
        .eq('id', cookieUser.id)
        .single()

      console.log('userData:', userData)
      console.log('userError:', userError)

    if (userError || !userData) {
      console.log('User not found or error:', userError)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get user's existing groups
    console.log('=== Fetching user groups ===')
    console.log('cookieUser.id:', cookieUser.id)
    console.log('userData.college_id:', userData.college_id)
    
    const { data: groups, error: groupsError } = await supabase
      .from('student_groups')
      .select('is_private')
      .eq('created_by', cookieUser.id)
      .eq('college_id', userData.college_id)
      .is('is_active', true)

    console.log('groups:', groups)
    console.log('groupsError:', groupsError)

    if (groupsError) {
      console.error('Groups fetch error:', groupsError)
      return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 })
    }

    const publicCount = groups?.filter((g: any) => !g.is_private).length || 0
    const privateCount = groups?.filter((g: any) => g.is_private).length || 0

    return NextResponse.json({ 
      publicCount,
      privateCount,
      total: publicCount + privateCount
    })

  } catch (error) {
    console.error('My groups API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
