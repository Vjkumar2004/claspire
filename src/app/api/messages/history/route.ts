import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getConversationId } from '@/lib/messages';
import { getUserIdFromRequest } from '@/lib/session';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

type MessageRow = {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
  conversation_id: string
  is_read?: boolean
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const otherUserId = searchParams.get('userId');
    const afterRaw = searchParams.get('after');
    const beforeId = searchParams.get('before');
    const after = afterRaw ? afterRaw.replace(/ /g, '+') : null;

    if (!otherUserId) {
      return NextResponse.json({ error: 'userId query parameter is required' }, { status: 400 });
    }

    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const conversationId = getConversationId(userId, otherUserId);

    const PAGE_SIZE = 100;
    const MESSAGE_SELECT = 'id, sender_id, receiver_id, content, created_at, conversation_id, is_read';

    const runQuery = (select: string) => {
      let q = supabase
        .from('direct_messages')
        .select(select)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (after) {
        try {
          const afterDate = new Date(after);
          if (!isNaN(afterDate.getTime())) {
            q = q.gt('created_at', afterDate.toISOString());
          }
        } catch {
          // skip filter
        }
      }

      if (beforeId) {
        q = q.lt('id', beforeId);
      }

      return q;
    };

    const { data: messages, error } = await runQuery(MESSAGE_SELECT);

    if (error) {
      console.error('History query error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Reverse back to chronological order for display
    const list = ((messages as unknown as MessageRow[]) || []).reverse();

    // Mark as read only on initial load (not pagination)
    if (!after && !beforeId) {
      supabase
        .from('direct_messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .eq('receiver_id', userId)
        .eq('is_read', false)
        .then(({ error: readError }) => {
          if (readError) console.error('Mark read error:', readError);
        });
    }

    return NextResponse.json({ messages: list });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('History error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
