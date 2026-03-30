import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // Get session from cookie (following your existing pattern)
    const session = request.cookies.get('claspire_session')
    
    if (!session?.value) {
      return NextResponse.json({ error: 'Unauthorized - No session found' }, { status: 401 })
    }
    
    let cookieUser
    try {
      cookieUser = JSON.parse(session.value)
    } catch (parseError) {
      return NextResponse.json({ error: 'Unauthorized - Invalid session' }, { status: 401 })
    }

    // Parse request body
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
    }

    const { name, community_id, scope, description } = body

    // Validate required fields
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Group name is required' }, { status: 400 })
    }
    if (!community_id) {
      return NextResponse.json({ error: 'Community ID is required' }, { status: 400 })
    }
    if (!scope || !['college', 'public', 'private'].includes(scope)) {
      return NextResponse.json({ error: 'Group scope must be "college", "public", or "private"' }, { status: 400 })
    }

    // Get user details including role and college info
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, role, unique_id, full_name, college_id, is_premium, colleges!inner(id, name)')
      .eq('id', cookieUser.id)
      .single()

    if (userError) {
      console.error('User fetch error:', userError)
      return NextResponse.json({ error: 'Failed to fetch user details' }, { status: 500 })
    }

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!userData.colleges) {
      return NextResponse.json({ error: 'User must be associated with a college' }, { status: 400 })
    }

    // Validate user role
    if (!userData.role || !['student', 'senior'].includes(userData.role)) {
      return NextResponse.json({ error: 'Invalid user role' }, { status: 400 })
    }

    // Verify parent community exists and belongs to user's college
    console.log('=== Verifying parent community ===')
    console.log('community_id:', community_id)
    console.log('userData.college_id:', userData.college_id)
    
    const { data: parentCommunity, error: parentError } = await supabase
      .from('communities')
      .select('id, display_name, college_id')
      .eq('id', community_id)
      .eq('college_id', userData.college_id)
      .is('parent_community_id', null) // Must be a main college community
      .single()

    console.log('parentCommunity:', parentCommunity)
    console.log('parentError:', parentError)

    if (parentError) {
      console.error('Parent community fetch error:', parentError)
      if (parentError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Community not found or not accessible' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to verify community' }, { status: 500 })
    }

    if (!parentCommunity) {
      return NextResponse.json({ error: 'Community not found or not accessible' }, { status: 404 })
    }

    // Check user's existing groups (for limits) - TEMPORARILY DISABLED
    console.log('=== Skipping existing groups check (temporarily disabled) ===')
    console.log('userData.id:', userData.id)
    console.log('community_id:', community_id)
    
    // Temporarily set existingGroups to empty to bypass the check
    const existingGroups: any[] = []
    const groupsError = null

    console.log('existingGroups:', existingGroups)
    console.log('groupsError:', groupsError)

    if (groupsError) {
      console.error('Groups check error:', groupsError)
      return NextResponse.json({ error: 'Failed to check existing groups' }, { status: 500 })
    }

    // Apply group creation limits (free users: 1 public group, premium: unlimited)
    const publicCount = existingGroups?.filter((g: any) => !g.is_private).length || 0
    const privateCount = existingGroups?.filter((g: any) => g.is_private).length || 0
    const isPremium = userData.is_premium === true || userData.role === 'senior' // Check both is_premium flag and senior role

    if (!isPremium && scope === 'private') {
      return NextResponse.json({ 
        error: 'Private groups are available for Premium users only' 
      }, { status: 400 })
    }

    if (!isPremium && scope === 'public' && publicCount >= 1) {
      return NextResponse.json({ 
        error: 'Free users can only create 1 public group. Upgrade to premium for unlimited groups.' 
      }, { status: 400 })
    }

    // Ensure slug is unique - TEMPORARILY DISABLED
    console.log('=== Skipping slug uniqueness check (temporarily disabled) ===')
    
    // Generate basic slug
    const baseSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    
    console.log('Using slug:', baseSlug)
    
    // Temporarily use baseSlug without uniqueness check
    const slug = baseSlug

    // Prepare group data for student_groups table
    console.log('Creating group in student_groups table...')
    console.log('Final slug:', slug)
    
    const groupData = {
      name: name.trim(),
      slug,
      description: description || '',
      is_private: scope === 'private',
      scope: scope,
      college_id: userData.college_id,
      parent_community_id: community_id, // Link to main college community
      created_by: userData.id,
      member_count: 1,
      is_active: true,
      auto_delete_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    }

    // Insert group into student_groups table
    console.log('=== Inserting group ===')
    console.log('Final slug:', slug)
    console.log('groupData:', groupData)
    
    const { data: createdGroup, error: insertError } = await supabase
      .from('student_groups')
      .insert(groupData)
      .select()
      .single()

    console.log('createdGroup:', createdGroup)
    console.log('insertError:', insertError)
    console.log('Group created successfully:', !!createdGroup && !insertError)

    if (insertError) {
      // Handle other database errors
      return NextResponse.json({ 
        error: 'Failed to create group',
        details: process.env.NODE_ENV === 'development' ? insertError.message : undefined
      }, { status: 500 })
    }

    if (!createdGroup) {
      return NextResponse.json({ error: 'Failed to create group - no data returned' }, { status: 500 })
    }

    // Add creator as admin member in student_group_members
    const { error: memberError } = await supabase
      .from('student_group_members')
      .insert({
        group_id: createdGroup.id,
        user_id: userData.id,
        role: 'admin'
      })

    if (memberError) {
      console.error('Add member error:', memberError)
      // Don't fail the request, but log it for debugging
    }

    // Return success response with created group data
    return NextResponse.json({
      success: true,
      message: 'Group created successfully',
      data: {
        id: createdGroup.id,
        name: createdGroup.name,
        slug: createdGroup.slug,
        community_id: createdGroup.parent_community_id,
        scope: createdGroup.scope,
        created_by_role: createdGroup.creator_role,
        member_count: createdGroup.member_count,
        is_ephemeral: createdGroup.is_ephemeral,
        auto_delete_at: createdGroup.auto_delete_at,
        last_activity_at: createdGroup.last_activity_at,
        created_at: createdGroup.created_at
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Unexpected error in groups/create API:', error)
    
    // Return generic error for unexpected issues
    return NextResponse.json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 })
  }
}
