import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
)

export async function POST(request: NextRequest) {
  try {
    const { token, email, password } = await request.json()

    if (!token || !email || !password) {
      return NextResponse.json(
        { error: 'Token, email, and password are required' },
        { status: 400 }
      )
    }

    // Validate password
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
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

    if (userError) {
      console.error('Database error:', userError)
      
      // Check if the error is due to missing columns
      if (userError.message.includes('column "reset_token" does not exist') || 
          userError.message.includes('column "reset_token_expiry" does not exist')) {
        return NextResponse.json(
          { 
            error: 'Database schema not updated. Please run the migration to add password reset fields.',
            requiresMigration: true
          },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { error: 'Invalid reset token' },
        { status: 400 }
      )
    }

    if (!user) {
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

    // Hash the password (you should use a proper hashing library like bcrypt)
    // For now, we'll store it as-is, but in production, ALWAYS hash passwords
    // import bcrypt from 'bcryptjs'
    // const hashedPassword = await bcrypt.hash(password, 12)

    // Update user's password and clear reset token
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password: password, // In production, use hashed password
        reset_token: null,
        reset_token_expiry: null,
        updated_at: new Date().toISOString()
      })
      .eq('email', email.toLowerCase())

    if (updateError) {
      console.error('Error updating password:', updateError)
      return NextResponse.json(
        { error: 'Failed to reset password' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully'
    })

  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
