import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
    const { userId } = await request.json()

    if (!slug) {
      return NextResponse.json({ error: 'Group slug is required' }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Get group details by slug
    const { data: group, error: groupError } = await supabase
      .from('student_groups')
      .select('id, is_active, member_count')
      .eq('slug', slug)
      .single()

    if (groupError || !group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    if (!group.is_active) {
      return NextResponse.json({ error: 'Group is not active' }, { status: 400 })
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('student_group_members')
      .select('id')
      .eq('group_id', group.id)
      .eq('user_id', userId)
      .single()

    if (existingMember) {
      return NextResponse.json({ error: 'Already a member of this group' }, { status: 400 })
    }

    // Add user to group
    const { data: member, error: joinError } = await supabase
      .from('student_group_members')
      .insert({
        group_id: group.id,
        user_id: userId,
        role: 'member'
      })
      .select()
      .single()

    if (joinError) {
      console.error('Join error:', joinError)
      return NextResponse.json({ error: 'Failed to join group' }, { status: 500 })
    }

    // Update member count
    const { error: updateError } = await supabase
      .from('student_groups')
      .update({ 
        member_count: group.member_count ? group.member_count + 1 : 1
      })
      .eq('id', group.id)

    if (updateError) {
      console.error('Member count update error:', updateError)
      // Don't fail the request, but log the error
    }

    return NextResponse.json({ 
      success: true,
      message: 'Successfully joined group',
      member 
    })

  } catch (error) {
    console.error('Join group API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
