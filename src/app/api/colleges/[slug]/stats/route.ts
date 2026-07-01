import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logCacheFetch } from '@/lib/cache-logger'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const startTime = Date.now()
  try {
    const { slug } = await params

    // Get college by slug
    const { data: college, error: collegeError } = await supabase
      .from('colleges')
      .select('id')
      .eq('slug', slug)
      .single()

    if (collegeError || !college) {
      return NextResponse.json({ error: 'College not found' }, { status: 404 })
    }

    // Get community by college_id or slug
    const { data: community, error: communityError } = await supabase
      .from('communities')
      .select('id, member_count, senior_count, doubt_count')
      .eq('college_id', college.id)
      .maybeSingle()

    if (communityError) {
      console.error('Community fetch error:', communityError)
    }

    // Get live stats from users table
    const { data: users } = await supabase
      .from('users')
      .select('role')
      .eq('college_id', college.id)

    const memberCount = users?.length || 0
    const seniorCount = users?.filter((user: any) => user.role === 'senior').length || 0

    // Get post count if community exists
    let postCount = 0
    if (community?.id) {
      const { count } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', community.id)
      postCount = count || 0
    }

    const duration = Date.now() - startTime
    logCacheFetch('college-stats', duration, { slug, memberCount, seniorCount })

    return NextResponse.json({
      member_count: Math.max(community?.member_count || 0, memberCount),
      senior_count: Math.max(community?.senior_count || 0, seniorCount),
      doubt_count: Math.max(community?.doubt_count || 0, postCount),
    })
  } catch (err: any) {
    console.error('College stats API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
