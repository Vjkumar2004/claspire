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

    // Find OTP in otp_store table
    const { data: otpRecord, error: otpError } = await supabase
      .from('otp_store')
      .select('otp, expires_at, verified')
      .eq('email', email.toLowerCase())
      .eq('otp', otp)
      .eq('verified', false)
      .single()

    if (otpError || !otpRecord) {
      return NextResponse.json(
        { error: 'Invalid OTP' },
        { status: 400 }
      )
    }

    // Check if OTP has expired
    if (!otpRecord.expires_at) {
      return NextResponse.json(
        { error: 'Invalid OTP' },
        { status: 400 }
      )
    }

    const expiryTime = new Date(otpRecord.expires_at)
    const currentTime = new Date()

    if (currentTime > expiryTime) {
      // Clear expired OTP
      await supabase
        .from('otp_store')
        .delete()
        .eq('email', email.toLowerCase())
        .eq('otp', otp)

      return NextResponse.json(
        { error: 'OTP has expired' },
        { status: 400 }
      )
    }

    // Mark OTP as verified
    await supabase
      .from('otp_store')
      .update({ verified: true })
      .eq('email', email.toLowerCase())
      .eq('otp', otp)

    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully'
    })

  } catch (error) {
    console.error('Verify OTP error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
