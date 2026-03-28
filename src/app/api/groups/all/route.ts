import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

interface Group {
  id: string
  name: string
  slug: string
  description: string
  is_private: boolean
  member_count: number
  created_at: string
  created_by: string
  college_id: string
  parent_community_id?: string // Make optional since it might not be in the initial query
}

interface DatabaseGroup {
  id: string
  name: string
  slug: string
  description: string
  is_private: boolean
  member_count: number
  created_at: string
  created_by: string
  college_id: string
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Get current user if logged in
    const cookiesStore = await cookies()
    const sessionCookie = cookiesStore.get('claspire_session')
    let currentUserId = null
    
    if (sessionCookie?.value) {
      try {
        const cookieUser = JSON.parse(sessionCookie.value)
        currentUserId = cookieUser.id
      } catch (parseError) {
        // Invalid cookie, continue without user
      }
    }

    // Fetch all active groups with creator and college details
    console.log('Fetching all groups...')
    
    // Simplified query to avoid relationship issues
    const { data: groups, error: groupsError } = await supabase
      .from('student_groups')
      .select(`
        id,
        name,
        slug,
        description,
        is_private,
        member_count,
        created_at,
        created_by,
        college_id
      `)
      .eq('is_active', true)
      .order('member_count', { ascending: false })
      .order('created_at', { ascending: false })

    console.log('Basic groups query result:', { groups, groupsError })
    console.log('Active groups found:', groups?.length || 0)

    if (groupsError) {
      console.error('Groups fetch error:', groupsError)
      return NextResponse.json({ error: 'Failed to fetch groups', details: groupsError.message }, { status: 500 })
    }

    // If we got groups, try to fetch creator and college info separately
    let groupsWithDetails: Group[] = (groups || []).map((group: any) => ({
      ...group,
      parent_community_id: group.parent_community_id || ''
    }))
    
    if (groupsWithDetails.length > 0) {
      try {
        // Get creator info
        const creatorIds = [...new Set(groupsWithDetails.map(g => g.created_by))]
        
        const { data: creators, error: creatorsError } = await supabase
          .from('users')
          .select('id, full_name, avatar_url, role, unique_id')
          .in('id', creatorIds)
        
        // Get community info to get college details
        const communityIds = [...new Set(groupsWithDetails.map(g => g.parent_community_id).filter(Boolean))]
        
        const { data: communities, error: communitiesError } = await supabase
          .from('communities')
          .select('id, display_name, slug, college_id')
          .in('id', communityIds)
        
        // Combine the data
        groupsWithDetails = groupsWithDetails.map(group => {
          const creator = creators?.find(c => c.id === group.created_by) || null
          const community = communities?.find(c => c.id === group.parent_community_id) || null
          
          // Use community display_name or slug as college name
          const collegeName = community?.display_name || community?.slug || 'ANJAC'
          
          return {
            ...group,
            creator,
            college: { 
              name: collegeName, 
              city: community?.slug || 'Sivakasi', 
              state: 'Tamil Nadu' 
            }
          }
        })
        
      } catch (detailError) {
        console.error('Error fetching details:', detailError)
        // Continue with basic group data if details fail
      }
    }

    // If user is logged in, check which groups they've joined
    let joinedGroupIds: string[] = []
    if (currentUserId) {
      const { data: memberships } = await supabase
        .from('student_group_members')
        .select('group_id')
        .eq('user_id', currentUserId)
      
      joinedGroupIds = memberships?.map(m => m.group_id) || []
    }

    // Add is_joined status to each group
    const groupsWithJoinStatus = groupsWithDetails.map(group => ({
      ...group,
      is_joined: joinedGroupIds.includes(group.id)
    }))

    return NextResponse.json({ groups: groupsWithJoinStatus })

  } catch (error) {
    console.error('All groups API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
