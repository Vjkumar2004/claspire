import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const cookie = req.cookies.get('claspire_session');
    if (!cookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const session = JSON.parse(cookie.value);
    const userId = session.id;

    // Fetch all messages where user is sender OR receiver
    const { data: messages, error } = await supabase
      .from('direct_messages')
      .select('*')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('List query error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Build unique conversations
    const conversationsMap = new Map();
    for (const msg of (messages || [])) {
      if (!conversationsMap.has(msg.conversation_id)) {
        const otherUserId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;

        // Fetch other user info
        const { data: otherUserData } = await supabase
          .from('users')
          .select('full_name, avatar_url')
          .eq('id', otherUserId)
          .single();

        conversationsMap.set(msg.conversation_id, {
          id: msg.conversation_id,
          lastMessage: msg.content,
          timestamp: msg.created_at,
          otherUser: otherUserData || { full_name: 'Unknown User', avatar_url: null },
          otherUserId,
          unread: !msg.is_read && msg.receiver_id === userId
        });
      }
    }

    return NextResponse.json({ conversations: Array.from(conversationsMap.values()) });
  } catch (err: any) {
    console.error('List conversations error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
