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
      return NextResponse.json({ count: 0 });
    }

    const session = JSON.parse(cookie.value);
    const userId = session.id;

    const { count, error } = await supabase
      .from('direct_messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Unread count query error:', error);
      return NextResponse.json({ count: 0 });
    }

    return NextResponse.json({ count: count || 0 });
  } catch (err) {
    console.error('Unread count error:', err);
    return NextResponse.json({ count: 0 });
  }
}
