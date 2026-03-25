import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
)

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json()

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
        { status: 400 }
      )
    }

    // Validate OTP format (6 digits)
    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { error: 'Invalid OTP format' },
        { status: 400 }
      )
    }

    // Find user with matching OTP and email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('reset_otp, reset_otp_expiry')
      .eq('email', email.toLowerCase())
      .eq('reset_otp', otp)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid OTP' },
        { status: 400 }
      )
    }

    // Check if OTP has expired
    if (!user.reset_otp_expiry) {
      return NextResponse.json(
        { error: 'Invalid OTP' },
        { status: 400 }
      )
    }

    const expiryTime = new Date(user.reset_otp_expiry)
    const currentTime = new Date()

    if (currentTime > expiryTime) {
      // Clear expired OTP
      await supabase
        .from('users')
        .update({
          reset_otp: null,
          reset_otp_expiry: null
        })
        .eq('email', email.toLowerCase())

      return NextResponse.json(
        { error: 'OTP has expired' },
        { status: 400 }
      )
    }

    // OTP is valid - generate a temporary session token for password reset
    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    const resetTokenExpiry = new Date(Date.now() + 900000) // 15 minutes from now

    // Store reset token and clear OTP
    await supabase
      .from('users')
      .update({
        reset_token: resetToken,
        reset_token_expiry: resetTokenExpiry.toISOString(),
        reset_otp: null,
        reset_otp_expiry: null
      })
      .eq('email', email.toLowerCase())

    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully',
      resetToken
    })

  } catch (error) {
    console.error('Verify OTP error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
