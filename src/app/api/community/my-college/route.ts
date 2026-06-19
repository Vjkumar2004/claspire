import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser } from '@/lib/session'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's college ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('college_id')
      .eq('id', user.id)
      .single()

    if (userError) {
      console.log('User fetch error:', userError)
    }
    
    if (userError || !userData?.college_id) {
      console.log('User college not found or null')
      return NextResponse.json({ error: 'User college not found' }, { status: 404 })
    }

    console.log('User college_id:', userData.college_id)

    // Find the main community for this college (parent_community_id is null)
    const { data: community, error: communityError } = await supabase
      .from('communities')
      .select('id, display_name, slug, colleges ( logo_url )')
      .eq('college_id', userData.college_id)
      .is('parent_community_id', null)
      .single()

    if (communityError) {
      console.error('Community fetch error:', communityError)
      if (communityError.code === 'PGRST116') {
        console.log('No main community found for college')
        return NextResponse.json({ error: 'College community not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to fetch community' }, { status: 500 })
    }

    if (!community) {
      console.log('Community is null')
      return NextResponse.json({ error: 'College community not found' }, { status: 404 })
    }

    console.log('Found community:', community)

    return NextResponse.json({
      success: true,
      communityId: community.id,
      communityName: community.display_name,
      communitySlug: community.slug,
      logoUrl: (community as any).colleges?.logo_url || null,
    })

  } catch (error) {
    console.error('My college community API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
