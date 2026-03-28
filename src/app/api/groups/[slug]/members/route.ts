import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { slug } = await params

    // Auth check
    const cookiesStore = await cookies()
    const sessionCookie = cookiesStore.get('claspire_session')
    
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let cookieUser
    try {
      cookieUser = JSON.parse(sessionCookie.value)
    } catch (parseError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = cookieUser.id

    // Get group details
    const { data: group, error: groupError } = await supabase
      .from('student_groups')
      .select('id, created_by')
      .eq('slug', slug)
      .single()

    if (groupError || !group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Check if user is admin or creator
    const { data: userMembership } = await supabase
      .from('student_group_members')
      .select('role')
      .eq('group_id', group.id)
      .eq('user_id', userId)
      .single()

    const isAdmin = userMembership?.role === 'admin' || group.created_by === userId

    if (!isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get all members with user details
    const { data: members, error: membersError } = await supabase
      .from('student_group_members')
      .select(`
        id,
        user_id,
        group_id,
        role,
        joined_at,
        is_blocked,
        user:users(
          id,
          full_name,
          avatar_url,
          role,
          unique_id
        )
      `)
      .eq('group_id', group.id)
      .order('joined_at', { ascending: true })

    if (membersError) {
      console.error('Members fetch error:', membersError)
      
      // If the error is about is_blocked column, try without it
      if (membersError.message?.includes('is_blocked')) {
        const { data: membersWithoutBlocked, error: retryError } = await supabase
          .from('student_group_members')
          .select(`
            id,
            user_id,
            group_id,
            role,
            joined_at,
            user:users(
              id,
              full_name,
              avatar_url,
              role,
              unique_id
            )
          `)
          .eq('group_id', group.id)
          .order('joined_at', { ascending: true })

        if (retryError) {
          console.error('Retry members fetch error:', retryError)
          return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 })
        }

        // Add is_blocked: false to all members since column doesn't exist
        const membersWithBlocked = (membersWithoutBlocked || []).map(member => ({
          ...member,
          is_blocked: false
        }))

        console.log('Members being returned:', membersWithBlocked)

        return NextResponse.json({ members: membersWithBlocked })
      }
      
      return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 })
    }

    return NextResponse.json({ members })

  } catch (error) {
    console.error('Members API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
