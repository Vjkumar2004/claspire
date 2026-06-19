import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { createSessionCookie } from '@/lib/session'
import { applyRateLimit, getClientIdentifier } from '@/lib/rateLimitRedis'
import { syncCommunityCounts } from '@/lib/community-stats'

const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function POST(req: NextRequest) {
  try {
    // Rate limiting: 3 requests per hour per IP
    const rateLimitResult = await applyRateLimit(req, 'signup')
    if (!rateLimitResult.success && rateLimitResult.response) {
      return rateLimitResult.response
    }

    const { email, role, profileData, password, onesignal_player_id, google_id } = await req.json()

    // Validate password
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Password minimum 6 characters required' },
        { status: 400 }
      )
    }

    // Check OTP was verified (only if NOT signing up with Google)
    if (!google_id) {
      const { data: otpData, error: otpError } = await supabaseAnon
        .from('otp_store')
        .select('*')
        .eq('email', email)
        .eq('verified', true)
        .single()

      if (otpError || !otpData) {
        return NextResponse.json(
          { error: 'Email verification failed' },
          { status: 400 }
        )
      }
    }

    // Check user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'Account already exists with this email' },
        { status: 400 }
      )
    }

    // Generate unique ID
    const year = new Date().getFullYear()
    const randomNum = Math.floor(10000 + Math.random() * 90000)
    const uniqueId = role === 'student'
      ? `CLS-${year}-${randomNum}` 
      : `CLS-S-${year}-${randomNum}` 

    // Create user with random UUID
    const userId = crypto.randomUUID()

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Standardize verification_type to pass DB constraint and remove non-db fields
    const { is_fresher, work_email, verification_type, ...cleanProfileData } = profileData
    
    const safeProfileData = {
      ...cleanProfileData,
      verification_type: 'manual', // Forced to pass users_verification_type_check
      verification_status: profileData.verification_status || 'verified',
      is_verified: true,
    }

    // Validate college_id is proper UUID
    const collegeId = profileData.college_id
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    
    const safeCollegeId = collegeId && 
      uuidRegex.test(collegeId) 
      ? collegeId 
      : null  // ← null if not valid UUID

    // Debug log to verify college_id
    console.log('Creating user with college_id:', collegeId, '-> safeCollegeId:', safeCollegeId)

    // Insert user
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: userId,
        email,
        role,
        unique_id: uniqueId,
        password_hash: passwordHash,  // ← ADD THIS
        college_id: safeCollegeId, // Use validated UUID
        rise_points: 50,
        rp_level: 1,
        ...safeProfileData,
        google_id: google_id || null,
        auth_provider: google_id ? 'email_google' : 'email',
        onesignal_player_id: onesignal_player_id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${profileData.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}`
      })
      .select()
      .single()

    if (userError) {
      console.error('User create error:', userError)
      return NextResponse.json(
        { error: userError.message },
        { status: 500 }
      )
    }

    // Log rise points
    await supabaseAnon.from('rise_points_log').insert({
      user_id: userId,
      points: 50,
      reason: 'Joined Claspire 🎉'
    })

    // Give join bonus +1 RP
    await supabaseAnon
      .from('rise_points_log')
      .insert({
        user_id: userId,
        points: 1,
        reason: 'Welcome to Claspire! 🎉',
        created_at: new Date().toISOString()
      })

    // Update rise_points to 51
    // (50 default + 1 join bonus)
    await supabaseAdmin
      .from('users')
      .update({
        rise_points: 51,
        last_visit_date: new Date()
          .toISOString().split('T')[0]
      })
      .eq('id', userId)

    // Auto-join own college community
    if (safeCollegeId) {
      // Get community id
      const { data: comm } = await supabaseAnon
        .from('communities')
        .select('id')
        .eq('college_id', safeCollegeId)
        .single()

      if (comm) {
        // Check if already a member
        const { data: existingMember } = await supabaseAnon
          .from('community_members')
          .select('id')
          .eq('community_id', comm.id)
          .eq('user_id', userId)
          .single()

        // Only insert if not already a member
        if (!existingMember) {
          // Insert member
          await supabaseAnon
            .from('community_members')
            .insert({
              community_id: comm.id,
              user_id: userId,
              membership_type: 'joined',
              joined_at: new Date().toISOString()
            })

          // Recalculate counts from source of truth
          await syncCommunityCounts(supabaseAdmin, comm.id, safeCollegeId)

          console.log(`Auto-joined user ${userId} to community ${comm.id}`)
        } else {
          console.log(`User ${userId} already a member of community ${comm.id}`)
        }
      }
    }

    // Create user data for response (cookie will only contain signed userId)
    const userData = {
      id: userId,
      email,
      role,
      unique_id: uniqueId,
      full_name: profileData.full_name,
      avatar_url: user.avatar_url,
      college_id: safeCollegeId,
      verification_status: profileData.verification_status,
      is_verified: true,
      is_premium: false,
      google_id: google_id || null,
      auth_provider: google_id ? 'email_google' : 'email',
    }

    // Debug log to show session data
    console.log('User data being stored:', userData)

    // Clean up OTP
    await supabaseAnon
      .from('otp_store')
      .delete()
      .eq('email', email)

    const response = NextResponse.json({
      success: true,
      user: userData,
      uniqueId
    })

    // Set signed session cookie (minimal payload: userId, version, timestamp)
    response.cookies.set('claspire_session',
      createSessionCookie(userId), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30 // 30 days
      }
    )

    console.log('Session cookie set:', userData.email, userData.role)

    // Welcome notification
    try {
      await supabaseAdmin.from('notifications').insert({
        receiver_id: userId,
        user_id: userId,
        type: 'welcome',
        title: 'Welcome to Claspire 🎉',
        message: 'Complete your profile and start building your network.',
        link: '/profile',
        is_read: false,
        created_at: new Date().toISOString()
      })

      const { data: newUser } = await supabaseAdmin
        .from('users')
        .select('onesignal_player_id')
        .eq('id', userId)
        .single()

      if (newUser?.onesignal_player_id) {
        await fetch('https://onesignal.com/api/v1/notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${process.env.ONESIGNAL_REST_API_KEY}`
          },
          body: JSON.stringify({
            app_id: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
            include_player_ids: [newUser.onesignal_player_id],
            headings: { en: 'Welcome to Claspire 🎉' },
            contents: { en: 'Complete your profile and start building your network.' },
            url: `${process.env.NEXT_PUBLIC_APP_URL}/profile`
          })
        })
      }
    } catch (welcomeErr) {
      console.error('Welcome notification error:', welcomeErr)
      // Don't fail signup if welcome notification fails
    }

    // Add a small delay to ensure cookie is set
    await new Promise(resolve => setTimeout(resolve, 100))

    return response

  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
