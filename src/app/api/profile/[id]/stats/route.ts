import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser } from '@/lib/session'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const viewer = await getAuthenticatedUser(req)
    if (!viewer) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { id } = await params

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    )

    const [countResult, visitorsResult] = await Promise.all([
      supabase
        .from('profile_views')
        .select('id', { count: 'exact', head: true })
        .eq('viewed_user_id', id),
      supabase
        .from('profile_views')
        .select(`
          viewer_id,
          created_at,
          viewer:viewer_id ( id, full_name, unique_id, avatar_url, role, college_id )
        `)
        .eq('viewed_user_id', id)
        .order('created_at', { ascending: false })
        .limit(20),
    ])

    const visitors = (visitorsResult.data || []).map((v: any) => ({
      viewerId: v.viewer_id,
      viewedAt: v.created_at,
      viewer: v.viewer
        ? {
            id: v.viewer.id,
            fullName: v.viewer.full_name,
            uniqueId: v.viewer.unique_id,
            avatarUrl: v.viewer.avatar_url,
            role: v.viewer.role,
          }
        : null,
    }))

    return NextResponse.json({
      viewCount: countResult.count ?? 0,
      visitors,
    })
  } catch (err) {
    console.error('[ProfileStats] API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
