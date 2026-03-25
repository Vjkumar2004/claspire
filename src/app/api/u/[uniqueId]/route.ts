import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ uniqueId: string }> }
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  )

  try {
    const { uniqueId } = await params

    if (!uniqueId) {
      return NextResponse.json({ error: 'Unique ID is required' }, { status: 400 })
    }

    // Fetch user + college
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        id, full_name, email, role,
        unique_id, rise_points, rp_level,
        doubt_count, answer_count,
        referral_count, webinar_count,
        is_verified, verification_status,
        bio, branch, year, avatar_url,
        company, designation, graduation_year, passout_year,
        colleges (
          id, name, short_name, slug, location, state
        )
      `)
      .eq('unique_id', uniqueId)
      .single()

    if (error || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Fetch User's posts (last 10)
    const { data: posts } = await supabase
      .from('posts')
      .select(`
        id, title, content, type, image_url,
        upvote_count, answer_count,
        is_answered, created_at,
        communities ( display_name, slug ),
        users:author_id ( full_name, avatar_url, role )
      `)
      .eq('author_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    // Sanitize user data (remove internal ID if needed, although it's used for posts fetch)
    // We'll keep email but normally public profiles might hide it or show it optionally.
    // For now, let's keep it as is based on the private profile data.

    return NextResponse.json({
      success: true,
      user,
      posts: posts || []
    })

  } catch (err: any) {
    console.error('Public profile API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
