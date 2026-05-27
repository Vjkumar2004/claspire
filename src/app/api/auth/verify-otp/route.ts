import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
)

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
)

export async function POST(request: NextRequest) {
  try {
    const { email, otp, purpose = 'signup' } = await request.json()

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()
    const normalizedOtp = String(otp).trim()

    // Validate OTP format (6 digits)
    if (!/^\d{6}$/.test(normalizedOtp)) {
      return NextResponse.json(
        { error: 'Invalid OTP format' },
        { status: 400 }
      )
    }

    // Password reset flow — OTP stored on users.reset_otp by /api/auth/forgot-password
    if (purpose === 'password_reset') {
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('id, reset_otp, reset_otp_expiry')
        .eq('email', normalizedEmail)
        .single()

      if (userError || !user) {
        return NextResponse.json(
          { error: 'Invalid OTP' },
          { status: 400 }
        )
      }

      if (!user.reset_otp || String(user.reset_otp) !== normalizedOtp) {
        return NextResponse.json(
          { error: 'Invalid OTP' },
          { status: 400 }
        )
      }

      if (!user.reset_otp_expiry) {
        return NextResponse.json(
          { error: 'Invalid OTP' },
          { status: 400 }
        )
      }

      const expiryTime = new Date(user.reset_otp_expiry)
      if (new Date() > expiryTime) {
        await supabaseAdmin
          .from('users')
          .update({ reset_otp: null, reset_otp_expiry: null })
          .eq('email', normalizedEmail)

        return NextResponse.json(
          { error: 'OTP has expired' },
          { status: 400 }
        )
      }

      const resetToken = randomBytes(32).toString('hex')
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000).toISOString()

      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          reset_token: resetToken,
          reset_token_expiry: resetTokenExpiry,
          reset_otp: null,
          reset_otp_expiry: null,
        })
        .eq('email', normalizedEmail)

      if (updateError) {
        console.error('Failed to issue reset token:', updateError)
        return NextResponse.json(
          { error: 'Failed to verify OTP. Please try again.' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'OTP verified successfully',
        resetToken,
      })
    }

    // Signup flow — OTP in otp_store table
    const { data: otpRecord, error: otpError } = await supabase
      .from('otp_store')
      .select('otp, expires_at, verified')
      .eq('email', normalizedEmail)
      .eq('otp', normalizedOtp)
      .eq('verified', false)
      .single()

    if (otpError || !otpRecord) {
      return NextResponse.json(
        { error: 'Invalid OTP' },
        { status: 400 }
      )
    }

    if (!otpRecord.expires_at) {
      return NextResponse.json(
        { error: 'Invalid OTP' },
        { status: 400 }
      )
    }

    const expiryTime = new Date(otpRecord.expires_at)
    if (new Date() > expiryTime) {
      await supabase
        .from('otp_store')
        .delete()
        .eq('email', normalizedEmail)
        .eq('otp', normalizedOtp)

      return NextResponse.json(
        { error: 'OTP has expired' },
        { status: 400 }
      )
    }

    await supabase
      .from('otp_store')
      .update({ verified: true })
      .eq('email', normalizedEmail)
      .eq('otp', normalizedOtp)

    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully',
    })
  } catch (error) {
    console.error('Verify OTP error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
