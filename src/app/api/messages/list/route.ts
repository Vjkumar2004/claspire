import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUser } from '@/lib/session';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = user.id;

    // Fetch recent messages with bounded limit
    // Dedup by conversation_id to get latest message per conversation
    const { data: messages, error } = await supabase
      .from('direct_messages')
      .select('conversation_id, content, created_at, sender_id, receiver_id, is_read')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      console.error('List query error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Dedup by conversation_id (first occurrence = latest message)
    // Collect all other user IDs for batch lookup
    const conversationMap = new Map<string, typeof messages[0]>();
    const otherUserIds = new Set<string>();

    for (const msg of messages || []) {
      if (!conversationMap.has(msg.conversation_id)) {
        conversationMap.set(msg.conversation_id, msg);
        const otherUserId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
        otherUserIds.add(otherUserId);
      }
    }

    // Batch user lookup — single IN query instead of N+1 individual queries
    const { data: users } = await supabase
      .from('users')
      .select('id, full_name, avatar_url')
      .in('id', Array.from(otherUserIds));

    const userMap = new Map((users || []).map(u => [u.id, u]));

    // Build response — same shape as before
    const conversations = Array.from(conversationMap.entries()).map(([convId, msg]) => {
      const otherUserId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
      const otherUser = userMap.get(otherUserId);
      return {
        id: convId,
        lastMessage: msg.content,
        timestamp: msg.created_at,
        otherUser: otherUser || { full_name: 'Unknown User', avatar_url: null },
        otherUserId,
        unread: !msg.is_read && msg.receiver_id === userId,
      };
    });

    return NextResponse.json({ conversations });
  } catch (err: any) {
    console.error('List conversations error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
