import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getConversationId } from '@/lib/messages';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const otherUserId = searchParams.get('userId');

    if (!otherUserId) {
      return NextResponse.json({ error: 'userId query parameter is required' }, { status: 400 });
    }

    const cookie = req.cookies.get('claspire_session');
    if (!cookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const session = JSON.parse(cookie.value);
    const userId = session.id;

    const conversationId = getConversationId(userId, otherUserId);

    const { data: messages, error } = await supabase
      .from('direct_messages')
      .select('id, sender_id, receiver_id, content, created_at, conversation_id')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('History query error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Mark messages as read (where current user is the receiver)
    supabase
      .from('direct_messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .eq('receiver_id', userId)
      .eq('is_read', false)
      .then(({ error: readError }) => {
        if (readError) console.error('Mark read error:', readError);
      });

    return NextResponse.json({ messages: messages || [] });
  } catch (err: any) {
    console.error('History error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
