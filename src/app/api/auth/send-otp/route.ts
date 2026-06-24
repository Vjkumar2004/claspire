import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { applyRateLimit, getClientIdentifier } from '@/lib/rateLimitRedis'
import { sendEmail } from '@/services/emailService'
import { verifyTurnstileToken } from '@/lib/turnstile'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { email, turnstileToken } = await req.json()

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

    // Rate limiting: 5 OTP requests per 15 minutes per IP
    const identifier = getClientIdentifier(req);
    const rateLimitResult = await applyRateLimit(req, 'otp', `otp:${identifier}:${email}`);

    if (!rateLimitResult.success && rateLimitResult.response) {
      return rateLimitResult.response
    }

    // Generate 6 digit OTP
    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString()

    const expiresAt = new Date(
      Date.now() + 10 * 60 * 1000
    ).toISOString()

    // Delete old OTPs
    await supabase
      .from('otp_store')
      .delete()
      .eq('email', email)

    // Store new OTP
    const { error: dbError } = await supabase
      .from('otp_store')
      .insert({
        email,
        otp,
        expires_at: expiresAt,
        verified: false
      })

    if (dbError) {
      console.error('DB Error:', dbError)
      return NextResponse.json(
        { error: 'Failed to store OTP' },
        { status: 500 }
      )
    }

    // Send via SMTP
    await sendEmail({
      to: email,
      subject: `${otp} - Your Claspire OTP`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify your email - Claspire</title>
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
                      <h2 style="color: #111827; font-size: 24px; font-weight: 600; margin: 0 0 20px 0; text-align: center;">Verify your email</h2>
                      <p style="color: #4b5563; font-size: 16px; line-height: 24px; margin: 0 0 30px 0; text-align: center;">
                        Welcome to Claspire! Please use the verification code below to complete your signup or sign in.
                      </p>
                      
                      <!-- OTP Box -->
                      <div style="background-color: #f5f3ff; border: 2px dashed #8b5cf6; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 30px;">
                        <span style="display: block; color: #6d28d9; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Your Verification Code</span>
                        <span style="color: #7C3AED; font-size: 42px; font-weight: 800; letter-spacing: 8px; font-family: monospace;">${otp}</span>
                      </div>
                      
                      <p style="color: #6b7280; font-size: 14px; line-height: 20px; margin: 0; text-align: center;">
                        This code will expire in <strong>10 minutes</strong>.<br>
                        Do not share this OTP with anyone. The Claspire team will never ask for your OTP.
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
      `
    })

    return NextResponse.json({
      success: true,
      message: 'OTP sent!'
    })

  } catch (error: any) {
    console.error('Send OTP error:', error)
    return NextResponse.json(
      { error: 'Failed to send OTP. Try again.' },
      { status: 500 }
    )
  }
}
