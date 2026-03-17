import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getConversationId } from '@/lib/messages';
import { createNotification } from '@/lib/notifications';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const cookie = req.cookies.get('claspire_session');
    if (!cookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const session = JSON.parse(cookie.value);
    const userId = session.id;

    const body = await req.json();
    const { receiverId, content } = body;

    if (!receiverId || !content?.trim()) {
      return NextResponse.json({ error: 'Receiver ID and content are required' }, { status: 400 });
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

    const { data: message, error: sendError } = await supabase
      .from('direct_messages')
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        receiver_id: receiverId,
        content: content.trim(),
        is_read: false
      })
      .select('*')
      .single();

    if (sendError) {
      console.error('Message insert error:', sendError);
      return NextResponse.json({ error: sendError.message }, { status: 500 });
    }

    // Create in-app notification (non-blocking)
    createNotification({
      receiver_id: receiverId,
      sender_id: userId,
      type: 'referral_request',
      title: `💬 New message from ${senderData.full_name}`,
      message: `${content.slice(0, 80)}${content.length > 80 ? '...' : ''}`,
      link: receiverData.role === 'senior' ? '/dashboard/senior' : '/dashboard/junior'
    }).catch(err => console.error('Notification error:', err));

    return NextResponse.json({ success: true, message });
  } catch (err: any) {
    console.error('Send message error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
