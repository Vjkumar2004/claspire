import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function POST(
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
      return NextResponse.json({ error: 'Unauthorized - No session found' }, { status: 401 })
    }

    let cookieUser
    try {
      cookieUser = JSON.parse(sessionCookie.value)
    } catch (parseError) {
      return NextResponse.json({ error: 'Unauthorized - Invalid session' }, { status: 401 })
    }

    const userId = cookieUser.id

    // Get group details by slug
    const { data: group, error: groupError } = await supabase
      .from('student_groups')
      .select('id, is_active, member_count, college_id')
      .eq('slug', slug)
      .single()

    if (groupError || !group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    if (!group.is_active) {
      return NextResponse.json({ error: 'Group is not active' }, { status: 400 })
    }

    // Get user's college
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('college_id')
      .eq('id', userId)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user's college matches group's college
    if (userData.college_id !== group.college_id) {
      return NextResponse.json({ 
        error: 'This group is only available for students from your college',
        collegeRestricted: true 
      }, { status: 403 })
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('student_group_members')
      .select('id')
      .eq('group_id', group.id)
      .eq('user_id', userId)
      .single()

    if (existingMember) {
      return NextResponse.json({ joined: true, alreadyMember: true })
    }

    // Add user to group
    const { error: joinError } = await supabase
      .from('student_group_members')
      .insert({
        group_id: group.id,
        user_id: userId,
        role: 'member'
      })

    if (joinError) {
      console.error('Join error:', joinError)
      return NextResponse.json({ error: 'Failed to join group' }, { status: 500 })
    }

    // Update member count
    await supabase
      .from('student_groups')
      .update({ member_count: (group.member_count || 0) + 1 })
      .eq('id', group.id)

    return NextResponse.json({ joined: true })

  } catch (error) {
    console.error('Join group API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
