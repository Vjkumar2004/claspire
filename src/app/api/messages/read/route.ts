import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const cookie = req.cookies.get('claspire_session')
    if (!cookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const session = JSON.parse(cookie.value)
    const userId = session.id

    const { conversationId } = await req.json()

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 })
    }

    // Mark all unread messages in this conversation as read
    const { error } = await supabase
      .from('direct_messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .eq('receiver_id', userId)
      .eq('is_read', false)

    if (error) {
      console.error('Mark as read error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (err: any) {
    console.error('Mark as read API error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
