import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateOTP } from '@/lib/auth'
import { sendOTPviaSMTP } from '@/services/emailService'
import { applyRateLimit } from '@/lib/rateLimitRedis'
import { verifyTurnstileToken } from '@/lib/turnstile'
import bcrypt from 'bcryptjs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
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
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset OTP - Claspire</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f3f4f6; padding: 40px 0;">
            <tr>
              <td align="center">
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                  <!-- Header -->
                  <tr>
                    <td align="center" style="padding: 30px 40px; background-color: #ffffff; border-bottom: 1px solid #f3f4f6;">
                      <!-- Styled text for logo to ensure visibility across all email clients -->
                      <div style="font-size: 32px; font-weight: 800; letter-spacing: -1px;">
                        <span style="color: #7C3AED;">claspire</span>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Body -->
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="color: #111827; font-size: 24px; font-weight: 600; margin: 0 0 20px 0; text-align: center;">Reset Your Password</h2>
                      <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin: 0 0 30px 0; text-align: center;">
                        Hi ${fullName || 'User'},<br>
                        We received a request to reset your password. Use the verification code below to complete the process.
                      </p>
                      
                      <!-- OTP Box -->
                      <div style="background-color: #f5f3ff; border: 2px dashed #8b5cf6; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 30px;">
                        <span style="display: block; color: #6d28d9; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Your Verification Code</span>
                        <span style="color: #7C3AED; font-size: 42px; font-weight: 800; letter-spacing: 8px; font-family: monospace;">${otp}</span>
                      </div>
                      
                      <p style="color: #6b7280; font-size: 14px; line-height: 20px; margin: 0; text-align: center;">
                        This code will expire in <strong>10 minutes</strong>.<br>
                        If you didn't request a password reset, you can safely ignore this email.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f9fafb; padding: 24px 40px; border-top: 1px solid #f3f4f6;">
                      <p style="color: #9ca3af; font-size: 12px; line-height: 18px; margin: 0; text-align: center;">
                        © ${new Date().getFullYear()} Claspire. All rights reserved.<br>
                        India's College Community
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
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
    // Rate limiting: 3 requests per hour per IP
    const rateLimitResult = await applyRateLimit(request, 'passwordReset')
    if (!rateLimitResult.success && rateLimitResult.response) {
      return rateLimitResult.response
    }

    const { email, turnstileToken } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    if (!turnstileToken) {
      return NextResponse.json(
        { error: 'Security check required. Please refresh the page.' },
        { status: 400 }
      )
    }

    const turnstileValid = await verifyTurnstileToken(turnstileToken)
    if (!turnstileValid) {
      return NextResponse.json(
        { error: 'Security check failed. Please refresh the page.' },
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
    const hashedOtp = await bcrypt.hash(otp, 10)
    const otpExpiry = new Date(Date.now() + 600000) // 10 minutes from now

    // Store OTP in database
    const { error: updateError } = await supabase
      .from('users')
      .update({
        reset_otp: hashedOtp,
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
        message: 'An OTP has been sent to your email address.'
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
