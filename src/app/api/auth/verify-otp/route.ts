import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'crypto'
import { applyRateLimit, getClientIdentifier, checkOtpLockout, recordFailedOtpAttempt, clearOtpAttempts } from '@/lib/rateLimitRedis'
import bcrypt from 'bcryptjs'

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
    // Rate limiting: 5 attempts per 15 minutes per IP
    const rateLimitResult = await applyRateLimit(request, 'otpVerify')
    if (!rateLimitResult.success && rateLimitResult.response) {
      return rateLimitResult.response
    }

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

    // OTP brute-force protection: check Redis lockout state
    const lockout = await checkOtpLockout(normalizedEmail)
    if (lockout.locked) {
      return NextResponse.json(
        {
          error: 'Too many failed attempts. Please try again later.',
          retryAfter: lockout.lockoutDuration,
        },
        {
          status: 429,
          headers: {
            'Retry-After': lockout.lockoutDuration.toString(),
          },
        }
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
        await recordFailedOtpAttempt(normalizedEmail)
        return NextResponse.json(
          { error: 'Invalid OTP' },
          { status: 400 }
        )
      }

      if (!user.reset_otp) {
        await recordFailedOtpAttempt(normalizedEmail)
        return NextResponse.json(
          { error: 'Invalid OTP' },
          { status: 400 }
        )
      }

      const isMatch = await bcrypt.compare(normalizedOtp, String(user.reset_otp))
      if (!isMatch) {
        await recordFailedOtpAttempt(normalizedEmail)
        return NextResponse.json(
          { error: 'Invalid OTP' },
          { status: 400 }
        )
      }

      if (!user.reset_otp_expiry) {
        await recordFailedOtpAttempt(normalizedEmail)
        return NextResponse.json(
          { error: 'Invalid OTP' },
          { status: 400 }
        )
      }

      const expiryTime = new Date(user.reset_otp_expiry)
      if (new Date() > expiryTime) {
        await recordFailedOtpAttempt(normalizedEmail)
        await supabaseAdmin
          .from('users')
          .update({ reset_otp: null, reset_otp_expiry: null })
          .eq('email', normalizedEmail)

        return NextResponse.json(
          { error: 'OTP has expired' },
          { status: 400 }
        )
      }

      // Clear failed attempts on successful verification
      await clearOtpAttempts(normalizedEmail)

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
      .eq('verified', false)
      .single()

    if (otpError || !otpRecord) {
      await recordFailedOtpAttempt(normalizedEmail)
      return NextResponse.json(
        { error: 'Invalid OTP' },
        { status: 400 }
      )
    }

    const isMatchSignup = await bcrypt.compare(normalizedOtp, String(otpRecord.otp))
    if (!isMatchSignup) {
      await recordFailedOtpAttempt(normalizedEmail)
      return NextResponse.json(
        { error: 'Invalid OTP' },
        { status: 400 }
      )
    }

    if (!otpRecord.expires_at) {
      await recordFailedOtpAttempt(normalizedEmail)
      return NextResponse.json(
        { error: 'Invalid OTP' },
        { status: 400 }
      )
    }

    const expiryTime = new Date(otpRecord.expires_at)
    if (new Date() > expiryTime) {
      await recordFailedOtpAttempt(normalizedEmail)
      await supabase
        .from('otp_store')
        .delete()
        .eq('email', normalizedEmail)
        .eq('otp', otpRecord.otp)

      return NextResponse.json(
        { error: 'OTP has expired' },
        { status: 400 }
      )
    }

    // Clear failed attempts on successful verification
    await clearOtpAttempts(normalizedEmail)

    await supabase
      .from('otp_store')
      .update({ verified: true })
      .eq('email', normalizedEmail)
      .eq('otp', otpRecord.otp)

    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully',
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
