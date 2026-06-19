import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { notifyNewPost } from '@/lib/notifications'
import { getAuthenticatedUser } from '@/lib/session'
import { applyRateLimit, getUserIdentifier } from '@/lib/rateLimitRedis'
import { sanitizeHtml } from '@/lib/sanitizeHtml'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function POST(req: NextRequest) {
  try {
    // SECURITY: Use signed session verification instead of direct cookie parsing
    // Direct JSON.parse(cookie.value) is unsafe because cookies can be modified
    // via DevTools or proxy tools, allowing session hijacking and privilege escalation
    const authenticatedUser = await getAuthenticatedUser(req)
    if (!authenticatedUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Rate limiting: 10 requests per minute per user
    const userIdentifier = await getUserIdentifier(req)
    const rateLimitResult = await applyRateLimit(req, 'createPost', userIdentifier)
    if (!rateLimitResult.success && rateLimitResult.response) {
      return rateLimitResult.response
    }

    const userId = authenticatedUser.id
    const currentUser = authenticatedUser

    const body = await req.json()
    const {
      community_id,
      title,
      content,
      type = 'doubt',
      visibility = 'public',
      tags = [],
      is_pinned = false,
      image_url = null,
      is_college_post = false
    } = body

    // Ensure content is a string and sanitize to allowed HTML only
    const contentStr = sanitizeHtml(String(body.content || '').trim())

    // Validate
    if (!title?.trim()) {
      return NextResponse.json(
        { error: 'Title required' },
        { status: 400 }
      )
    }
    if (!contentStr) {
      return NextResponse.json(
        { error: 'Content required' },
        { status: 400 }
      )
    }
    if (!community_id) {
      return NextResponse.json(
        { error: 'Community required' },
        { status: 400 }
      )
    }

    let resolvedCommunityId = community_id
    let resolvedCommunitySlug = ''

    // Check user is member of community (same logic as community API)
    let isMember = false
    let communityCollegeId: string | null | undefined
    if (currentUser) {
      // Get user and community details for role checking
      const { data: userData } = await supabase
        .from('users')
        .select('college_id, is_verified, role')
        .eq('id', userId)
        .single()

      const { data: communityData } = await supabase
        .from('communities')
        .select('id, college_id, slug')
        .eq('id', community_id)
        .single()

      let effectiveCommunity = communityData
      communityCollegeId = communityData?.college_id

      if (userData && !effectiveCommunity) {
        const { data: collegeData } = await supabase
          .from('colleges')
          .select('id, name, short_name, slug')
          .eq('id', community_id)
          .single()

        if (collegeData) {
          const { data: existingCommunity } = await supabase
            .from('communities')
            .select('id, college_id, slug')
            .eq('slug', collegeData.slug)
            .is('parent_community_id', null)
            .single()

          const { data: createdCommunity } = existingCommunity
            ? { data: existingCommunity }
            : await supabase
            .from('communities')
            .insert({
              display_name: collegeData.short_name || collegeData.name,
              slug: collegeData.slug,
              description: `${collegeData.name} community on Claspire`,
              college_id: collegeData.id,
              parent_community_id: null,
              is_private: false,
              is_ephemeral: false
            })
            .select('id, college_id, slug')
            .single()

          effectiveCommunity = createdCommunity
          communityCollegeId = createdCommunity?.college_id
        }
      }

      if (userData && effectiveCommunity) {
        resolvedCommunityId = effectiveCommunity.id
        resolvedCommunitySlug = effectiveCommunity.slug
        const isOwnCollege = userData.college_id === effectiveCommunity.college_id
        const isVerified = userData.is_verified
        const isSenior = userData.role === 'senior'

        // Check if user is a college admin (can post even if not verified)
        let isCollegeAdmin = false
        if (effectiveCommunity.college_id) {
          const { data: adminEntry } = await supabase
            .from('college_admins')
            .select('id')
            .eq('college_id', effectiveCommunity.college_id)
            .eq('user_id', userId)
            .eq('status', 'approved')
            .maybeSingle()
          isCollegeAdmin = !!adminEntry
        }

        // Only own-college members or college admins can post
        if (isOwnCollege && (isVerified || isSenior)) {
          isMember = true
        } else if (isCollegeAdmin) {
          isMember = true
        } else {
          isMember = false
        }
      }
    }

    if (!isMember) {
      return NextResponse.json(
        { error: 'Not a member of this community' },
        { status: 403 }
      )
    }

    // College admin post check
    let collegeId: string | null = null
    if (is_college_post) {
      if (!communityCollegeId) {
        return NextResponse.json(
          { error: 'This community is not associated with a college' },
          { status: 400 }
        )
      }

      const { data: adminEntry } = await supabase
        .from('college_admins')
        .select('id')
        .eq('college_id', communityCollegeId)
        .eq('user_id', userId)
        .eq('status', 'approved')
        .maybeSingle()

      if (!adminEntry) {
        return NextResponse.json(
          { error: 'You are not an approved admin for this college' },
          { status: 403 }
        )
      }

      collegeId = communityCollegeId
    }

    // Create post
    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        community_id: resolvedCommunityId,
        author_id: userId,
        title: title.trim(),
        content: contentStr,
        type,
        visibility,
        tags,
        is_pinned,
        image_url: image_url || null,
        upvote_count: 0,
        downvote_count: 0,
        answer_count: 0,
        view_count: 0,
        is_answered: false,
        is_college_post,
        college_id: collegeId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Post create error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Give RP for posting
    const { data: user } = await supabase
      .from('users')
      .select('rise_points, doubt_count, answer_count, referral_count')
      .eq('id', userId)
      .single()

    const rpAmount =
      type === 'experience' ? 10
        : type === 'resource' ? 8
          : type === 'referral_hunt' ? 5
            : type === 'doubt' ? 2
              : type === 'discussion' ? 2
                : 2

    await supabase
      .from('rise_points_log')
      .insert({
        user_id: userId,
        points: rpAmount,
        reason: `Posted a ${type}: "${title.slice(0, 40)}"`,
        created_at: new Date().toISOString()
      })

    await supabase
      .from('users')
      .update({
        rise_points: (user?.rise_points || 0) + rpAmount,
        doubt_count: type === 'doubt' ? (user?.doubt_count || 0) + 1 : user?.doubt_count,
        answer_count: type === 'answer' ? (user?.answer_count || 0) + 1 : user?.answer_count,
        referral_count: type === 'referral_hunt' ? (user?.referral_count || 0) + 1 : user?.referral_count
      })
      .eq('id', userId)

    // Update community post count
    await supabase.rpc('increment', {
      table_name: 'communities',
      column_name: 'post_count',
      row_id: resolvedCommunityId
    })

    // --- NOTIFICATION LOGIC ---
    try {
      // Get community info
      const { data: comm } = await supabase
        .from('communities')
        .select('display_name, slug')
        .eq('id', resolvedCommunityId)
        .single()

      // Post type based messages
      const notifTitle = 
        type === 'doubt' ? `❓ New Doubt in c/${comm?.slug}`
        : type === 'discussion' ? `💬 New Discussion in c/${comm?.slug}`
        : type === 'experience' ? `⭐ New Experience shared in c/${comm?.slug}`
        : type === 'referral_hunt' ? `🎯 Someone is hunting for Referral!`
        : type === 'resource' ? `📚 New Resource shared in c/${comm?.slug}`
        : `New post in c/${comm?.slug}`

      const notifMessage =
        type === 'referral_hunt' ? `${currentUser?.full_name} is looking for referral: "${title.slice(0, 50)}"`
        : type === 'experience' ? `${currentUser?.full_name} shared their experience: "${title.slice(0, 50)}"`
        : `${currentUser?.full_name} posted: "${title.slice(0, 50)}"`

      // Notify home community members
      await notifyNewPost({
        communityId: resolvedCommunityId,
        communitySlug: comm?.slug || resolvedCommunitySlug,
        postId: post.id,
        postTitle: title,
        postType: type,
        authorId: userId,
        authorName: currentUser?.full_name || 'Someone',
        customTitle: notifTitle,
        customMessage: notifMessage
      })

      // Notify communities this author follows (joined from another college)
      const { data: followedCommunities } = await supabase
        .from('community_members')
        .select('community_id, communities ( slug )')
        .eq('user_id', userId)
        .eq('membership_type', 'following')

      for (const membership of followedCommunities || []) {
        const followed = membership.communities as { slug?: string } | null
        if (!membership.community_id || membership.community_id === resolvedCommunityId) continue

        await notifyNewPost({
          communityId: membership.community_id,
          communitySlug: followed?.slug || '',
          postId: post.id,
          postTitle: title,
          postType: type,
          authorId: userId,
          authorName: currentUser?.full_name || 'Someone',
          customTitle: `📣 Network update from c/${comm?.slug || resolvedCommunitySlug}`,
          customMessage: `${currentUser?.full_name || 'A member'} posted: "${title.slice(0, 50)}"`
        })
      }
    } catch (notifErr) {
      console.error('Notification trigger error:', notifErr)
    }

    return NextResponse.json({
      success: true,
      post,
      rpEarned: rpAmount
    })

  } catch (err: any) {
    console.error('Create post error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
