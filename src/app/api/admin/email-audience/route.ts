import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/admin';

export async function POST(req: NextRequest) {
  try {
    const adminAuth = await requireAdmin(req);
    if ('error' in adminAuth) {
      return NextResponse.json({ error: adminAuth.error }, { status: adminAuth.status });
    }

    const body = await req.json();
    const { audienceType, collegeId } = body;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    );

    let query = supabase.from('users').select('*', { count: 'exact', head: true });

    switch (audienceType) {
      case 'students':
        query = query.eq('role', 'student');
        break;
      case 'seniors':
        query = query.eq('role', 'senior');
        break;
      case 'college':
        if (!collegeId) {
          return NextResponse.json({ error: 'College ID required' }, { status: 400 });
        }
        query = query.eq('college_id', collegeId);
        break;
      case 'custom':
        // Count is managed client-side via customRecipientIds.length
        return NextResponse.json({ count: 0 });
      case 'all':
      default:
        // no filter
        break;
    }

    const { count, error } = await query;

    if (error) {
      console.error('Error fetching audience count:', error);
      return NextResponse.json({ error: 'Failed to fetch audience count' }, { status: 500 });
    }

    return NextResponse.json({ count: count || 0 });
  } catch (error) {
    console.error('Email audience API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
