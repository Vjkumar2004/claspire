import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const communityId = "022ae63e-51c3-45c8-b17c-607228199691"
    
    console.log('=== CHECKING COMMUNITY ===')
    
    // Check if community exists
    const { data: community, error: communityError } = await supabase
      .from('communities')
      .select('*')
      .eq('id', communityId)
      .single()
    
    console.log('Community data:', community)
    console.log('Community error:', communityError)
    
    // List all communities
    const { data: allCommunities, error: allCommunitiesError } = await supabase
      .from('communities')
      .select('id, name, slug')
      .limit(10)
    
    console.log('All communities:', allCommunities)
    console.log('All communities error:', allCommunitiesError)
    
    return NextResponse.json({
      success: true,
      data: {
        community,
        allCommunities,
        errors: {
          community: communityError?.message,
          allCommunities: allCommunitiesError?.message
        }
      }
    })

  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 })
  }
}
