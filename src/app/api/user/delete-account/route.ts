import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { r2Client, R2_BUCKET } from '@/lib/r2'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function DELETE(req: NextRequest) {
  try {
    // 1. Get user session from httpOnly cookie
    const session = req.cookies.get('claspire_session')
    
    if (!session?.value) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    let userSession
    try {
      userSession = JSON.parse(session.value)
    } catch (parseError) {
      console.error('Failed to parse session:', parseError)
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
    }

    const userId = userSession.id

    // 2. Fetch user data: id, avatar_url from users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, avatar_url, email')
      .eq('id', userId)
      .single()

    if (userError || !userData) {
      console.error('User not found:', userError)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // 3. Delete Cloudflare R2 files
    try {
      // Delete avatar if exists and is from R2
      if (userData.avatar_url && userData.avatar_url.includes(process.env.CLOUDFLARE_R2_PUBLIC_URL!)) {
        // Extract R2 object key from URL
        const urlParts = userData.avatar_url.split('/')
        const avatarKey = urlParts[urlParts.length - 1]
        
        if (avatarKey) {
          await r2Client.send(new DeleteObjectCommand({
            Bucket: R2_BUCKET,
            Key: avatarKey
          }))
          console.log('Deleted avatar from R2:', avatarKey)
        }
      }

      // Delete post images
      const { data: posts } = await supabase
        .from('posts')
        .select('image_url')
        .eq('author_id', userId)
        .not('image_url', 'is', null)

      if (posts && posts.length > 0) {
        for (const post of posts) {
          if (post.image_url && post.image_url.includes(process.env.CLOUDFLARE_R2_PUBLIC_URL!)) {
            const urlParts = post.image_url.split('/')
            const imageKey = urlParts[urlParts.length - 1]
            
            if (imageKey) {
              await r2Client.send(new DeleteObjectCommand({
                Bucket: R2_BUCKET,
                Key: imageKey
              }))
              console.log('Deleted post image from R2:', imageKey)
            }
          }
        }
      }
    } catch (r2Error) {
      console.error('R2 deletion error (continuing with DB deletion):', r2Error)
      // Continue with DB deletion even if R2 fails
    }

    // 4. Delete from Supabase in this exact order (foreign key safe)
    try {
      // DELETE FROM rise_points_log WHERE user_id = ?
      await supabase
        .from('rise_points_log')
        .delete()
        .eq('user_id', userId)

      // DELETE FROM votes WHERE user_id = ?
      await supabase
        .from('votes')
        .delete()
        .eq('user_id', userId)

      // DELETE FROM notifications WHERE receiver_id = ? OR sender_id = ?
      await supabase
        .from('notifications')
        .delete()
        .or(`receiver_id.eq.${userId},sender_id.eq.${userId}`)

      // DELETE FROM direct_messages WHERE sender_id = ? OR receiver_id = ?
      await supabase
        .from('direct_messages')
        .delete()
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)

      // DELETE FROM answers WHERE user_id = ?
      await supabase
        .from('answers')
        .delete()
        .eq('user_id', userId)

      // DELETE FROM otp_store WHERE email = (SELECT email FROM users WHERE id = ?)
      await supabase
        .from('otp_store')
        .delete()
        .eq('email', userData.email)

      // DELETE FROM college_requests WHERE requested_by = ?
      await supabase
        .from('college_requests')
        .delete()
        .eq('requested_by', userId)

      // UPDATE communities SET member_count = member_count - 1 WHERE id IN (SELECT community_id FROM community_members WHERE user_id = ?)
      const { data: communityMemberships } = await supabase
        .from('community_members')
        .select('community_id')
        .eq('user_id', userId)

      if (communityMemberships && communityMemberships.length > 0) {
        for (const membership of communityMemberships) {
          await supabase
            .from('communities')
            .update({ member_count: supabase.rpc('increment', { x: -1 }) })
            .eq('id', membership.community_id)
        }
      }

      // DELETE FROM community_members WHERE user_id = ?
      await supabase
        .from('community_members')
        .delete()
        .eq('user_id', userId)

      // DELETE FROM posts WHERE author_id = ?
      await supabase
        .from('posts')
        .delete()
        .eq('author_id', userId)

      // DELETE FROM users WHERE id = ?
      await supabase
        .from('users')
        .delete()
        .eq('id', userId)

      console.log('Successfully deleted all user data from Supabase')
    } catch (dbError) {
      console.error('Database deletion error:', dbError)
      return NextResponse.json(
        { error: 'Failed to delete user data from database' },
        { status: 500 }
      )
    }

    // 5. Clear session cookie (set maxAge: 0)
    const response = NextResponse.json({ success: true })
    response.cookies.set('claspire_session', '', {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 0
    })

    return response

  } catch (error) {
    console.error('Delete account route error:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}
