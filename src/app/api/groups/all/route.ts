import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser } from '@/lib/session'

interface Group {
  id: string
  name: string
  slug: string
  description: string
  is_private: boolean
  scope?: string
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
  scope?: string
  member_count: number
  created_at: string
  created_by: string
  college_id: string
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    )

    // SECURITY: Use signed session verification instead of direct cookie parsing
    const user = await getAuthenticatedUser(request)
    const currentUserId = user?.id || null

    // Fetch all active groups with creator and college details
    console.log('Fetching all groups...')
    
    const { data: groups, error: groupsError } = await supabase
      .from('student_groups')
      .select(`
        id,
        name,
        slug,
        description,
        is_private,
        scope,
        member_count,
        created_at,
        created_by,
        college_id,
        colleges (
          id,
          name,
          short_name,
          location,
          slug
        )
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

    // If we got groups, try to fetch creator info separately
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
        
        // Combine the data
        groupsWithDetails = groupsWithDetails.map((group: any) => {
          const creator = creators?.find(c => c.id === group.created_by) || null
          
          const college = Array.isArray(group.colleges) ? group.colleges[0] : group.colleges
          const collegeName = college?.short_name || college?.name || 'Community'
          
          return {
            ...group,
            creator,
            college: { 
              id: college?.id,
              name: collegeName,
              slug: college?.slug,
              city: college?.city || college?.location || 'Sivakasi', 
              state: college?.state || 'Tamil Nadu' 
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
    let requestedGroupIds: string[] = []
    if (currentUserId) {
      const { data: memberships } = await supabase
        .from('student_group_members')
        .select('group_id')
        .eq('user_id', currentUserId)
      
      joinedGroupIds = memberships?.map(m => m.group_id) || []

      const { data: requests } = await supabase
        .from('student_group_join_requests')
        .select('group_id')
        .eq('user_id', currentUserId)
        .eq('status', 'pending')

      requestedGroupIds = requests?.map(r => r.group_id) || []
    }

    // Add is_joined status to each group
    const groupsWithJoinStatus = groupsWithDetails.map(group => ({
      ...group,
      scope: group.scope || (!group.is_private ? 'public' : 'private'),
      is_joined: joinedGroupIds.includes(group.id),
      is_requested: requestedGroupIds.includes(group.id)
    }))

    return NextResponse.json({ groups: groupsWithJoinStatus })

  } catch (error) {
    console.error('All groups API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

