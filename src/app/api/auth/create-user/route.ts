import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { email, role, profileData, password } = await req.json()

    // Validate password
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Password minimum 6 characters required' },
        { status: 400 }
      )
    }

    // Check OTP was verified
    const { data: otpData, error: otpError } = await supabase
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

    // Check user already exists
    const { data: existingUser } = await supabase
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

    // Force valid verification_type
    const safeProfileData = {
      ...profileData,
      verification_type: 'manual',
      verification_status: profileData.verification_status 
        || 'verified',
      is_verified: true,
    }

    // Insert user
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email,
        role,
        unique_id: uniqueId,
        password_hash: passwordHash,  // ← ADD THIS
        rise_points: 50,
        rp_level: 1,
        ...safeProfileData,
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
    await supabase.from('rise_points_log').insert({
      user_id: userId,
      points: 50,
      reason: 'Joined Claspire 🎉'
    })

    // Store session in cookie
    const sessionData = {
      id: userId,
      email,
      role,
      unique_id: uniqueId,
      full_name: profileData.full_name,
      college_id: profileData.college_id,
      verification_status: profileData.verification_status
    }

    // Clean up OTP
    await supabase
      .from('otp_store')
      .delete()
      .eq('email', email)

    const response = NextResponse.json({
      success: true,
      user: sessionData,
      uniqueId
    })

    // Set session cookie
    response.cookies.set('claspire_session', 
      JSON.stringify(sessionData), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30 // 30 days
      }
    )

    console.log('Session cookie set:', sessionData.email, sessionData.role)

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
