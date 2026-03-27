import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const session = request.cookies.get('claspire_session')
    
    if (!session?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    try {
      const cookieUser = JSON.parse(session.value)
      const { name, description, is_private, is_ephemeral } = await request.json()

      // Get user details with college info
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*, colleges(*)')
        .eq('id', cookieUser.id)
        .single()

      if (userError || !userData) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

    // Check if user has a college
    if (!userData.colleges) {
      return NextResponse.json({ error: 'User must be associated with a college' }, { status: 400 })
    }

    // Get user's existing groups
    const { data: existingGroups, error: groupsError } = await supabase
      .from('communities')
      .select('is_private')
      .eq('created_by', cookieUser.id)
      .eq('parent_community_id', userData.colleges.id) // Only count groups in their college
      .is('deleted_at', null)

    if (groupsError) {
      return NextResponse.json({ error: 'Failed to check existing groups' }, { status: 500 })
    }

    const publicCount = existingGroups?.filter((g: any) => !g.is_private).length || 0
    const privateCount = existingGroups?.filter((g: any) => g.is_private).length || 0

    // Validate group creation rules
    if (!userData.is_premium) {
      if (publicCount >= 1) {
        return NextResponse.json({ 
          error: 'Free users can only create 1 public group. Upgrade to Premium for unlimited groups!' 
        }, { status: 403 })
      }
      if (is_private) {
        return NextResponse.json({ 
          error: 'Private groups are Premium only' 
        }, { status: 403 })
      }
      // Free users always have ephemeral messages
      if (!is_ephemeral) {
        return NextResponse.json({ 
          error: 'Free users cannot disable message auto-deletion' 
        }, { status: 403 })
      }
    } else {
      // Premium users can create unlimited public groups
      if (is_private && privateCount >= 1) {
        return NextResponse.json({ 
          error: 'Premium users can create only 1 private group' 
        }, { status: 403 })
      }
    }

    // Generate slug from name
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim()
    
    let slug = baseSlug
    let counter = 1
    
    // Ensure slug is unique
    while (true) {
      const { data: existingSlug } = await supabase
        .from('communities')
        .select('id')
        .eq('slug', slug)
        .eq('college_id', userData.colleges.id)
        .single()
      
      if (!existingSlug) break
      
      slug = `${baseSlug}-${counter}`
      counter++
    }

    // Get the main college community (parent)
    const { data: parentCommunity, error: parentError } = await supabase
      .from('communities')
      .select('id')
      .eq('college_id', userData.colleges.id)
      .is('parent_community_id', null)
      .single()

    if (parentError || !parentCommunity) {
      return NextResponse.json({ error: 'College community not found' }, { status: 404 })
    }

    // Create the group
    const { data: group, error: createError } = await supabase
      .from('communities')
      .insert({
        name: name.trim(),
        display_name: name.trim(),
        slug,
        description: description.trim(),
        is_private,
        is_ephemeral: is_ephemeral || !userData.is_premium, // Free users always have ephemeral
        college_id: userData.colleges.id,
        parent_community_id: parentCommunity.id,
        created_by: cookieUser.id,
        creator_role: userData.role,
        member_count: 1,
        auto_delete_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        last_activity_at: new Date()
      })
      .select()
      .single()

    if (createError) {
      console.error('Create group error:', createError)
      return NextResponse.json({ error: 'Failed to create group' }, { status: 500 })
    }

    // Add creator as admin member
    const { error: memberError } = await supabase
      .from('community_members')
      .insert({
        community_id: group.id,
        user_id: cookieUser.id,
        role: 'admin',
        membership_type: 'joined'
      })

    if (memberError) {
      console.error('Add member error:', memberError)
      // Don't fail the request, but log it
    }

    return NextResponse.json({ 
      success: true, 
      group: {
        id: group.id,
        slug: group.slug,
        name: group.name,
        description: group.description,
        is_private: group.is_private,
        is_ephemeral: group.is_ephemeral
      }
    })

    } catch (parseError) {
      return NextResponse.json({ error: 'Invalid session data' }, { status: 401 })
    }

  } catch (error) {
    console.error('Create group API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
