import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
)

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Send OTP via Mailjet
async function sendOTPviaMailjet(email: string, otp: string, fullName: string): Promise<boolean> {
  try {
    const mailjetApiKey = process.env.MAILJET_API_KEY
    const mailjetSecretKey = process.env.MAILJET_SECRET_KEY

    if (!mailjetApiKey || !mailjetSecretKey) {
      console.error('Mailjet credentials not configured. Please set MAILJET_API_KEY and MAILJET_SECRET_KEY in environment variables.')
      return false
    }

    const response = await fetch('https://api.mailjet.com/v3.1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${mailjetApiKey}:${mailjetSecretKey}`).toString('base64')}`
      },
      body: JSON.stringify({
        Messages: [{
          From: {
            Email: 'noreply@claspire.in',
            Name: 'Claspire'
          },
          To: [{
            Email: email,
            Name: fullName || 'User'
          }],
          Subject: 'Your Password Reset OTP - Claspire',
          HTMLPart: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; padding: 20px;">
                <h1 style="color: #7C3AED;">cl<span style="color: #7C3AED;">aspire</span></h1>
              </div>
              
              <div style="padding: 30px; background: #f9fafb; border-radius: 8px; margin: 20px 0; text-align: center;">
                <h2 style="color: #1f2937; margin-bottom: 16px;">Password Reset OTP</h2>
                <p style="color: #6b7280; margin-bottom: 24px;">
                  Hi ${fullName || 'User'},<br><br>
                  Your OTP for password reset is:
                </p>
                
                <div style="background: #7C3AED; color: white; font-size: 32px; font-weight: bold; 
                            padding: 20px; border-radius: 8px; letter-spacing: 4px; margin: 20px 0;">
                  ${otp}
                </div>
                
                <p style="color: #6b7280; margin-top: 24px; font-size: 14px;">
                  This OTP will expire in 10 minutes.<br>
                  If you didn't request this, please ignore this email.
                </p>
              </div>
              
              <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
                <p>© 2024 Claspire · India's College Community</p>
              </div>
            </div>
          `,
          TextPart: `Your Claspire password reset OTP is: ${otp}. This OTP will expire in 10 minutes.`
        }]
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Mailjet API error:', response.status, errorText)
      return false
    }

    const result = await response.json()
    console.log('Mailjet response:', result)
    
    return result.Messages?.[0]?.Status === 'success'
  } catch (error) {
    console.error('Error sending OTP via Mailjet:', error)
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Check if user exists in our database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('email', email.toLowerCase())
      .single()

    if (userError) {
      console.error('Database error:', userError)
      
      // Check if the error is due to missing columns
      if (userError.message.includes('column "reset_otp" does not exist') || 
          userError.message.includes('column "reset_otp_expiry" does not exist')) {
        return NextResponse.json(
          { 
            error: 'Database schema not updated. Please run the migration to add password reset fields.',
            requiresMigration: true
          },
          { status: 500 }
        )
      }
      
      // Don't reveal if email exists or not for security
      return NextResponse.json({
        success: true,
        message: 'If an account with this email exists, an OTP has been sent.'
      })
    }

    if (!user) {
      // Don't reveal if email exists or not for security
      return NextResponse.json({
        success: true,
        message: 'If an account with this email exists, an OTP has been sent.'
      })
    }

    // Generate 6-digit OTP
    const otp = generateOTP()
    const otpExpiry = new Date(Date.now() + 600000) // 10 minutes from now

    // Store OTP in database
    const { error: updateError } = await supabase
      .from('users')
      .update({
        reset_otp: otp,
        reset_otp_expiry: otpExpiry.toISOString()
      })
      .eq('email', email.toLowerCase())

    if (updateError) {
      console.error('Error storing OTP:', updateError)
      return NextResponse.json(
        { error: 'Failed to process reset request' },
        { status: 500 }
      )
    }

    // Send OTP via Mailjet
    // Check if Mailjet is configured
    if (!process.env.MAILJET_API_KEY || !process.env.MAILJET_SECRET_KEY) {
      console.log('Mailjet not configured. OTP for testing:', otp)
      // For now, return success even without email for testing
      return NextResponse.json({
        success: true,
        message: 'An OTP has been sent to your email address.',
        debugInfo: 'Mailjet not configured - check console for OTP'
      })
    }
    
    const emailSent = await sendOTPviaMailjet(email, otp, user.full_name || '')
    
    if (!emailSent) {
      console.error('Failed to send OTP email to:', email)
      return NextResponse.json(
        { error: 'Failed to send OTP email. Please check your Mailjet configuration.' },
        { status: 500 }
      )
    }

    console.log('OTP sent successfully to:', email)

    return NextResponse.json({
      success: true,
      message: 'An OTP has been sent to your email address.'
    })

  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
