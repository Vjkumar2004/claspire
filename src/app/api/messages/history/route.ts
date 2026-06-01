import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getConversationId } from '@/lib/messages';

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
  reply_to_id?: string | null
  edited_at?: string | null
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const otherUserId = searchParams.get('userId');
    const afterRaw = searchParams.get('after');
    const after = afterRaw ? afterRaw.replace(/ /g, '+') : null;

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

    const runQuery = (select: string) => {
      let q = supabase
        .from('direct_messages')
        .select(select)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(100);

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

      return q;
    };

    let messages: MessageRow[] | null = null;
    let error: { message?: string } | null = null;

    const primary = await runQuery(
      'id, sender_id, receiver_id, content, created_at, conversation_id, is_read, reply_to_id, edited_at'
    );
    messages = primary.data as MessageRow[] | null;
    error = primary.error;

    if (error?.message?.includes('reply_to_id') || error?.message?.includes('edited_at')) {
      const fallback = await runQuery(
        'id, sender_id, receiver_id, content, created_at, conversation_id, is_read'
      );
      messages = fallback.data as MessageRow[] | null;
      error = fallback.error;
    }

    if (error) {
      console.error('History query error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const list = messages || [];
    const replyIds = [...new Set(list.map((m) => m.reply_to_id).filter(Boolean))] as string[];
    let replyMap: Record<string, { id: string; content: string; sender_id: string }> = {};

    if (replyIds.length > 0) {
      const { data: replyRows } = await supabase
        .from('direct_messages')
        .select('id, content, sender_id')
        .in('id', replyIds);

      if (replyRows) {
        replyMap = Object.fromEntries(replyRows.map((r) => [r.id, r]));
      }
    }

    const enriched = list.map((m) => ({
      ...m,
      reply_to: m.reply_to_id ? replyMap[m.reply_to_id] || null : null,
    }));

    if (!after) {
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

    return NextResponse.json({ messages: enriched });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('History error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
