import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { OAuth2Client } from 'google-auth-library'
import { createSessionCookie } from '@/lib/session'
import { applyRateLimit } from '@/lib/rateLimitRedis'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

export async function POST(req: NextRequest) {
  try {
    // Rate limiting: 5 attempts per 10 minutes per IP
    const rateLimitResult = await applyRateLimit(req, 'googleAuth')
    if (!rateLimitResult.success && rateLimitResult.response) {
      return rateLimitResult.response
    }

    const { credential } = await req.json()

    if (!credential) {
      return NextResponse.json(
        { error: 'Google credential ID token required' },
        { status: 400 }
      )
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      return NextResponse.json(
        { error: 'Server misconfiguration: GOOGLE_CLIENT_ID not set' },
        { status: 500 }
      )
    }

    // Debug: Log server Client ID and decode token payload locally
    console.log('Server GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID)
    try {
      const parts = credential.split('.')
      if (parts.length >= 2) {
        const decoded = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'))
        console.log('Token Payload Details:', {
          aud: decoded.aud,
          iss: decoded.iss,
          email: decoded.email
        })
      }
    } catch (err) {
      console.error('Failed to log decoded token payload:', err)
    }

    // 1. Verify token locally
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    })

    const payload = ticket.getPayload()
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid Google token' },
        { status: 400 }
      )
    }

    const { email, sub: google_id, email_verified } = payload

    if (!email || !email_verified) {
      return NextResponse.json(
        { error: 'Google account is not verified' },
        { status: 400 }
      )
    }

    // 2. Query user by email first to support safe Google Account Linking
    const { data: user, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle()

    if (dbError || !user) {
      return NextResponse.json(
        { error: 'No account found with this Google email. Please complete your registration first.', isNewUser: true, email, google_id },
        { status: 404 }
      )
    }

    // 3. Perform matching and account linking logic
    if (!user.google_id) {
      // Scenario 1: First-time account linking
      const { error: updateError } = await supabase
        .from('users')
        .update({
          google_id: google_id,
          auth_provider: 'email_google',
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('Failed to link Google account:', updateError)
        return NextResponse.json(
          { error: 'Failed to link Google account to existing user.' },
          { status: 500 }
        )
      }

      // Update in-memory user object
      user.google_id = google_id
      user.auth_provider = 'email_google'
      console.log(`Successfully linked Google account for existing user ${user.id}`)
    } else if (user.google_id !== google_id) {
      // Scenario 3: Google account mismatch (hijacking protection)
      return NextResponse.json(
        { error: 'Google Account Mismatch. This email is already linked to another Google account.' },
        { status: 403 }
      )
    }
    // Scenario 2: Stored google_id matches (user.google_id === google_id), proceed normally

    // 4. Create user data for response (cookie will only contain signed userId)
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
      google_id: user.google_id,
    }

    console.log('Google login user data:', userData)

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
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/'
      }
    )

    return response

  } catch (error: any) {
    console.error('Google login API error:', error)
    return NextResponse.json(
      { error: 'Google login failed. Try again.' },
      { status: 500 }
    )
  }
}
