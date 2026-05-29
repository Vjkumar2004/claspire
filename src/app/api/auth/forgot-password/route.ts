import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/services/emailService'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
)

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Send OTP via SMTP
async function sendOTPviaSMTP(email: string, otp: string, fullName: string): Promise<boolean> {
  try {
    const result = await sendEmail({
      to: email,
      subject: 'Your Password Reset OTP - Claspire',
      html: `
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
      text: `Your Claspire password reset OTP is: ${otp}. This OTP will expire in 10 minutes.`
    })
    
    return !!result.success
  } catch (error) {
    console.error('Error sending OTP via SMTP:', error)
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

    // Send OTP via SMTP
    // Check if SMTP is configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('SMTP not configured. OTP for testing:', otp)
      // For now, return success even without email for testing
      return NextResponse.json({
        success: true,
        message: 'An OTP has been sent to your email address.',
        debugInfo: 'SMTP not configured - check console for OTP'
      })
    }
    
    const emailSent = await sendOTPviaSMTP(email, otp, user.full_name || '')
    
    if (!emailSent) {
      console.error('Failed to send OTP email to:', email)
      return NextResponse.json(
        { error: 'Failed to send OTP email. Please check your SMTP configuration.' },
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
