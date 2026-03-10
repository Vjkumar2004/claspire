import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json()

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP required' },
        { status: 400 }
      )
    }

    // Get OTP record
    const { data, error } = await supabase
      .from('otp_store')
      .select('*')
      .eq('email', email)
      .eq('otp', otp)
      .eq('verified', false)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Invalid OTP. Please enter correct OTP' },
        { status: 400 }
      )
    }

    // Check expiry
    if (new Date(data.expires_at) < new Date()) {
      await supabase
        .from('otp_store')
        .delete()
        .eq('email', email)
      
      return NextResponse.json(
        { error: 'OTP expired. Please resend OTP' },
        { status: 400 }
      )
    }

    // Mark verified
    await supabase
      .from('otp_store')
      .update({ verified: true })
      .eq('id', data.id)

    return NextResponse.json({
      success: true,
      message: 'OTP verified!'
    })

  } catch (error: any) {
    console.error('Verify OTP error:', error)
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    )
  }
}
