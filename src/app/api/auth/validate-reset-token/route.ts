import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
)

export async function POST(request: NextRequest) {
  try {
    const { token, email } = await request.json()

    if (!token || !email) {
      return NextResponse.json(
        { error: 'Token and email are required' },
        { status: 400 }
      )
    }

    // Find user with matching reset token and email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('reset_token, reset_token_expiry')
      .eq('email', email.toLowerCase())
      .eq('reset_token', token)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid reset token' },
        { status: 400 }
      )
    }

    // Check if token has expired
    if (!user.reset_token_expiry) {
      return NextResponse.json(
        { error: 'Invalid reset token' },
        { status: 400 }
      )
    }

    const expiryTime = new Date(user.reset_token_expiry)
    const currentTime = new Date()

    if (currentTime > expiryTime) {
      // Clear expired token
      await supabase
        .from('users')
        .update({
          reset_token: null,
          reset_token_expiry: null
        })
        .eq('email', email.toLowerCase())

      return NextResponse.json(
        { error: 'Reset token has expired' },
        { status: 400 }
      )
    }

    // Token is valid
    return NextResponse.json({
      valid: true,
      message: 'Reset token is valid'
    })

  } catch (error) {
    console.error('Validate reset token error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
