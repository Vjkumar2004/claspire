import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/admin';
import { applyRateLimit } from '@/lib/rateLimitRedis';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const adminAuth = await requireAdmin(req);
    if ('error' in adminAuth) {
      return NextResponse.json({ error: adminAuth.error }, { status: adminAuth.status });
    }

    const rateLimitResult = await applyRateLimit(req, 'general', `admin_${(adminAuth as any).id || 'anon'}`);
    if (!rateLimitResult.success && rateLimitResult.response) {
      return rateLimitResult.response;
    }

    const { searchParams } = new URL(req.url);
    const query = (searchParams.get('q') || '').trim();

    if (query.length < 2) {
      return NextResponse.json({ users: [] });
    }

    const { data: users, error } = await supabase
      .from('users')
      .select(`
        id,
        full_name,
        email,
        avatar_url,
        role,
        unique_id,
        company,
        designation,
        college:college_id ( name, short_name )
      `)
      .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(20);

    if (error) {
      console.error('[ADMIN USER SEARCH] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ users: users || [] });
  } catch (err: any) {
    console.error('[ADMIN USER SEARCH] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
