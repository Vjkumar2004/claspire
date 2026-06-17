import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUserIdFromRequest } from '@/lib/session'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const viewerId = getUserIdFromRequest(req)
    if (!viewerId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { id } = await params

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    )

    const [countResult, allViewsResult] = await Promise.all([
      supabase
        .from('profile_views')
        .select('id', { count: 'exact', head: true })
        .eq('viewed_user_id', id),
      supabase
        .from('profile_views')
        .select('viewer_id, created_at')
        .eq('viewed_user_id', id)
        .order('created_at', { ascending: false }),
    ])

    // Deduplicate by viewer_id, keeping latest visit per unique visitor
    const seen = new Set<string>()
    const dedupedViews: { viewer_id: string; created_at: string }[] = []
    for (const v of allViewsResult.data || []) {
      if (!seen.has(v.viewer_id)) {
        seen.add(v.viewer_id)
        dedupedViews.push(v)
        if (dedupedViews.length >= 20) break
      }
    }

    // Batch-fetch viewer details for deduped visitors
    const viewerIds = dedupedViews.map(v => v.viewer_id)
    const { data: viewers } = viewerIds.length
      ? await supabase
          .from('users')
          .select('id, full_name, unique_id, avatar_url, role')
          .in('id', viewerIds)
      : { data: [] }

    const viewerMap = new Map((viewers || []).map(u => [u.id, u]))

    const visitors = dedupedViews.map(v => {
      const u = viewerMap.get(v.viewer_id)
      return {
        viewerId: v.viewer_id,
        viewedAt: v.created_at,
        viewer: u
          ? {
              id: u.id,
              fullName: u.full_name,
              uniqueId: u.unique_id,
              avatarUrl: u.avatar_url,
              role: u.role,
            }
          : null,
      }
    })

    return NextResponse.json({
      viewCount: countResult.count ?? 0,
      visitors,
    })
  } catch (err) {
    console.error('[ProfileStats] API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
