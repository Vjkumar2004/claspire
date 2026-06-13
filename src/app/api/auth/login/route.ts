import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { createSessionCookie } from '@/lib/session'
import { applyRateLimit, getClientIdentifier } from '@/lib/rateLimitRedis'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function POST(req: NextRequest) {
  try {
    // Rate limiting: 5 requests per minute per IP
    const rateLimitResult = await applyRateLimit(req, 'login')
    if (!rateLimitResult.success && rateLimitResult.response) {
      return rateLimitResult.response
    }

    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      )
    }

    // Get user
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (error || !user) {
      return NextResponse.json(
        { error: 'Account not found. Please sign up.' },
        { status: 404 }
      )
    }

    // Check password
    if (!user.password_hash) {
      return NextResponse.json(
        { error: 'Password not set. Please sign up again.' },
        { status: 400 }
      )
    }

    const isValid = await bcrypt.compare(password, user.password_hash)

    if (!isValid) {
      return NextResponse.json(
        { error: 'Wrong password. Please try again.' },
        { status: 401 }
      )
    }

    // Create minimal session data for response (cookie will only contain signed userId)
    const userData = {
      id: user.id,
      email: user.email,
      role: user.role,
      unique_id: user.unique_id,
      full_name: user.full_name,
      avatar_url: user.avatar_url,
      college_id: user.college_id || null,
      is_verified: user.is_verified,
      is_premium: user.is_premium || false,
    }

    // Debug log to show session data
    console.log('Login user data:', userData)

    const response = NextResponse.json({
      success: true,
      user: userData
    })

    // Set signed session cookie (minimal payload: userId, version, timestamp)
    response.cookies.set(
      'claspire_session',
      createSessionCookie(user.id),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        path: '/'
      }
    )

    return response

  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Login failed. Try again.' },
      { status: 500 }
    )
  }
}
