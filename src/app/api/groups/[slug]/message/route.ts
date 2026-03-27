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

    const { content, sender_id } = await request.json()

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    if (!sender_id) {
      return NextResponse.json({ error: 'sender_id is required' }, { status: 400 })
    }

    // Get group id from slug
    const { data: group, error: groupError } = await supabase
      .from('student_groups')
      .select('id')
      .eq('slug', slug)
      .single()

    if (groupError || !group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Insert message
    const { data: message, error: insertError } = await supabase
      .from('student_group_messages')
      .insert({
        id: crypto.randomUUID(), // Generate UUID manually
        group_id: group.id,
        sender_id: sender_id,
        content: content.trim(),
        is_deleted: false
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
    }

    return NextResponse.json({ message }, { status: 201 })

  } catch (error) {
    console.error('Message POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
