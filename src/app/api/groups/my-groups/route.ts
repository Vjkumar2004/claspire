import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('=== /api/groups/my-groups called ===')
    
    const session = request.cookies.get('claspire_session')
    
    if (!session?.value) {
      console.log('No session found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    try {
      const cookieUser = JSON.parse(session.value)
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

    } catch (parseError) {
      return NextResponse.json({ error: 'Invalid session data' }, { status: 401 })
    }

  } catch (error) {
    console.error('My groups API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}