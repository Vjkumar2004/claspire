import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

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
    console.log('=== Fetching community members ===')
    console.log('slug:', slug)

    // Get the main community (college)
    const { data: community, error: communityError } = await supabase
      .from('communities')
      .select('id, college_id')
      .eq('slug', slug)
      .is('parent_community_id', null)
      .single()

    console.log('community:', community)
    console.log('communityError:', communityError)

    let collegeId = community?.college_id

    if (!collegeId) {
      const { data: college, error: collegeError } = await supabase
        .from('colleges')
        .select('id')
        .eq('slug', slug)
        .single()

      console.log('college fallback:', college)
      console.log('collegeError:', collegeError)

      collegeId = college?.id
    }

    if (!collegeId) {
      console.log('Community not found')
      return NextResponse.json({ error: 'Community not found' }, { status: 404 })
    }

    // Get all users from this college (using only confirmed columns)
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select(`
        id,
        full_name,
        avatar_url,
        role,
        unique_id,
        is_verified,
        created_at
      `)
      .eq('college_id', collegeId)
      .order('created_at', { ascending: false })

    console.log('users:', users)
    console.log('usersError:', usersError)

    if (usersError) {
      console.error('Users error:', usersError)
      return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 })
    }

    // Add mock department and passout_year for display
    const membersWithDetails = (users || []).map(user => ({
      ...user,
      department: user.role === 'senior' ? 'Computer Science & Engineering' : 'Computer Science & Engineering',
      passout_year: user.role === 'senior' ? '2024' : '2025'
    }))

    return NextResponse.json({
      success: true,
      members: membersWithDetails
    })

  } catch (error) {
    console.error('Community members API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
