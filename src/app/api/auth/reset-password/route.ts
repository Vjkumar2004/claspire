import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { createNotification } from '@/lib/notifications'
import { applyRateLimit } from '@/lib/rateLimitRedis'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
)

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 3 requests per hour per IP
    const rateLimitResult = await applyRateLimit(request, 'passwordReset')
    if (!rateLimitResult.success && rateLimitResult.response) {
      return rateLimitResult.response
    }

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
      .select('id, reset_token, reset_token_expiry')
      .eq('email', email.toLowerCase())
      .eq('reset_token', token)
      .single()

    if (userError) {
      console.error('Database error:', userError)
      
      // Check if the error is due to missing columns
      if (userError.message?.includes('column "reset_token" does not exist') || 
          userError.message?.includes('column "reset_token_expiry" does not exist')) {
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

    // Hash the password using bcryptjs to match login route
    const hashedPassword = await bcrypt.hash(password, 10)

    // Update user's password and clear reset token
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password_hash: hashedPassword,
        reset_token: null,
        reset_token_expiry: null,
        updated_at: new Date().toISOString()
      })
      .eq('email', email.toLowerCase())

    if (updateError) {
      console.error('Error updating password:', updateError)
      return NextResponse.json(
        { error: updateError.message || 'Failed to reset password', details: updateError },
        { status: 500 }
      )
    }

    // Notify user that password was changed
    try {
      await createNotification({
        receiver_id: user.id,
        type: 'password_changed',
        title: 'Password Updated',
        message: 'Your password was changed successfully.',
        link: '/login'
      })

      const { data: pwUser } = await supabase
        .from('users')
        .select('onesignal_player_id')
        .eq('id', user.id)
        .single()

      if (pwUser?.onesignal_player_id) {
        await fetch('https://onesignal.com/api/v1/notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${process.env.ONESIGNAL_REST_API_KEY}`
          },
          body: JSON.stringify({
            app_id: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
            include_player_ids: [pwUser.onesignal_player_id],
            headings: { en: 'Password Updated' },
            contents: { en: 'Your password was changed successfully.' },
            url: `${process.env.NEXT_PUBLIC_APP_URL}/login`
          })
        })
      }
    } catch (pwNotifErr) {
      console.error('Password change notification error:', pwNotifErr)
      // Don't fail the request if notification fails
    }

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully'
    })

  } catch (error: any) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error', details: error?.stack || error },
      { status: 500 }
    )
  }
}
