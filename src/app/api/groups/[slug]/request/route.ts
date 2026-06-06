import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser } from '@/lib/session'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    // SECURITY: Use signed session verification instead of direct cookie parsing
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = user.id

    // Get group
    const { data: group, error: groupError } = await supabase
      .from('student_groups')
      .select('id, is_private, scope, college_id')
      .eq('slug', slug)
      .single()

    if (groupError || !group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    if (!group.is_private) {
      return NextResponse.json({ error: 'This group is public, join directly' }, { status: 400 })
    }

    // Check already member
    const { data: existingMember } = await supabase
      .from('student_group_members')
      .select('id')
      .eq('group_id', group.id)
      .eq('user_id', userId)
      .single()

    if (existingMember) {
      return NextResponse.json({ error: 'Already a member' }, { status: 400 })
    }

    // Check existing pending request
    const { data: existingRequest } = await supabase
      .from('student_group_join_requests')
      .select('id, status')
      .eq('group_id', group.id)
      .eq('user_id', userId)
      .single()

    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        return NextResponse.json({ error: 'Request already pending' }, { status: 400 })
      }
      if (existingRequest.status === 'accepted') {
        return NextResponse.json({ error: 'Already accepted' }, { status: 400 })
      }
    }

    // Create request
    const { error: insertError } = await supabase
      .from('student_group_join_requests')
      .upsert({
        group_id: group.id,
        user_id: userId,
        status: 'pending',
        requested_at: new Date().toISOString()
      })

    if (insertError) {
      console.error('Request insert error:', insertError)
      return NextResponse.json({ error: 'Failed to send request' }, { status: 500 })
    }

    return NextResponse.json({ requested: true })

  } catch (error) {
    console.error('Join request error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
