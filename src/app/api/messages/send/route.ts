import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getConversationId } from '@/lib/messages';
import { canUsersMessage } from '@/middleware/checkCanMessage';
import { getAuthenticatedUser } from '@/lib/session';
import { applyRateLimit, getUserIdentifier } from '@/lib/rateLimitRedis';
import { sendPushToUsers } from '@/lib/notifications';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function POST(req: NextRequest) {
  try {
    // SECURITY: Use signed session verification instead of direct cookie parsing
    // Direct JSON.parse(cookie.value) is unsafe because cookies can be modified
    // via DevTools or proxy tools, allowing session hijacking and privilege escalation
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Rate limiting: 30 requests per minute per user
    const userIdentifier = await getUserIdentifier(req);
    const rateLimitResult = await applyRateLimit(req, 'sendMessage', userIdentifier);
    if (!rateLimitResult.success && rateLimitResult.response) {
      return rateLimitResult.response;
    }

    const userId = user.id;

    const body = await req.json();
    const { receiverId, content, replyToId } = body;

    if (!receiverId || !content?.trim()) {
      return NextResponse.json({ error: 'Receiver ID and content are required' }, { status: 400 });
    }

    // At the top after auth check, add block check
    const { data: blockData } = await supabase
      .from('blocked_users')
      .select('id')
      .or(`and(blocker_id.eq.${userId},blocked_id.eq.${receiverId}),and(blocker_id.eq.${receiverId},blocked_id.eq.${userId})`)
      .maybeSingle()

    if (blockData) {
      return NextResponse.json({ error: 'Cannot message this user' }, { status: 403 })
    }

    // Check if users can message each other (accepted request exists)
    const canMessage = await canUsersMessage(userId, receiverId);
    if (!canMessage) {
      return NextResponse.json({ error: 'not_connected' }, { status: 403 });
    }

    // Fetch sender and receiver info
    const [senderResult, receiverResult] = await Promise.all([
      supabase.from('users').select('role, full_name').eq('id', userId).single(),
      supabase.from('users').select('role, full_name').eq('id', receiverId).single()
    ]);

    const senderData = senderResult.data;
    const receiverData = receiverResult.data;

    if (!senderData || !receiverData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const conversationId = getConversationId(userId, receiverId);

    if (replyToId) {
      const { data: parentMsg } = await supabase
        .from('direct_messages')
        .select('id, conversation_id')
        .eq('id', replyToId)
        .single()

      if (!parentMsg || parentMsg.conversation_id !== conversationId) {
        return NextResponse.json({ error: 'Invalid reply target' }, { status: 400 })
      }
    }

    const { data: message, error: sendError } = await supabase
      .from('direct_messages')
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        receiver_id: receiverId,
        content: content.trim(),
        is_read: false,
        ...(replyToId ? { reply_to_id: replyToId } : {}),
      })
      .select('*')
      .single();

    let savedMessage = message

    if (sendError?.message?.includes('reply_to_id')) {
      let fallbackContent = content.trim()
      if (replyToId) {
        const { data: parentMsg } = await supabase
          .from('direct_messages')
          .select('content')
          .eq('id', replyToId)
          .single()
        if (parentMsg?.content) {
          fallbackContent = `↩ ${parentMsg.content.slice(0, 120)}\n${fallbackContent}`
        }
      }

      const { data: retryMessage, error: retryError } = await supabase
        .from('direct_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: userId,
          receiver_id: receiverId,
          content: fallbackContent,
          is_read: false,
        })
        .select('*')
        .single()

      if (retryError) {
        console.error('Message insert error:', retryError);
        return NextResponse.json({ error: retryError.message }, { status: 500 });
      }

      savedMessage = retryMessage
    } else if (sendError) {
      console.error('Message insert error:', sendError);
      return NextResponse.json({ error: sendError.message }, { status: 500 });
    }

    // Send push notification to receiver (skip if sending to self)
    if (userId !== receiverId) {
      try {
        await sendPushToUsers(
          [receiverId],
          'New Message',
          `${senderData.full_name} sent you a message.`,
          `/messages?user=${userId}`
        )
      } catch (msgNotifErr) {
        console.error('Message push notification error:', msgNotifErr)
      }
    }

    return NextResponse.json({ success: true, message: savedMessage });
  } catch (err: any) {
    console.error('Send message error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
