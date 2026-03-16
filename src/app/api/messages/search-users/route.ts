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

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const targetUserId = searchParams.get('userId') || '';
    const role = searchParams.get('role') || ''; // 'senior' or 'junior'

    if (targetUserId) {
      const { data: user, error } = await supabase
        .from('users')
        .select('id, full_name, avatar_url, role, unique_id, company, designation, is_verified')
        .eq('id', targetUserId)
        .single();
      
      if (error) {
        console.error('[MSG SEARCH] User ID fetch error:', error);
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      return NextResponse.json({ users: [user] });
    }

    if (query.length < 2) {
      return NextResponse.json({ users: [] });
    }

    // Search users by name, excluding the current user
    let dbQuery = supabase
      .from('users')
      .select('id, full_name, avatar_url, role, unique_id, company, designation, is_verified')
      .neq('id', userId)
      .ilike('full_name', `%${query}%`)
      .limit(10);

    // If role filter is specified
    if (role === 'senior' || role === 'junior') {
      dbQuery = dbQuery.eq('role', role);
    }

    const { data: users, error } = await dbQuery;

    if (error) {
      console.error('[MSG SEARCH] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ users: users || [] });
  } catch (err: any) {
    console.error('[MSG SEARCH] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
