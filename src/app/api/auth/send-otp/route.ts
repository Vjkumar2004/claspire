import { NextRequest, NextResponse } from 'next/server'
import Mailjet from 'node-mailjet'
import { createClient } from '@supabase/supabase-js'
import { rateLimit, getClientIdentifier } from '@/lib/rateLimit'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const mailjet = new Mailjet({
  apiKey: process.env.MAILJET_API_KEY!,
  apiSecret: process.env.MAILJET_SECRET_KEY!
})

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Rate limiting: 5 OTP requests per 15 minutes per IP
    const identifier = getClientIdentifier(req);
    const rateLimitResult = rateLimit({
      identifier: `otp:${identifier}:${email}`,
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxAttempts: 5,
    });

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Too many OTP requests. Please try again later.',
          resetTime: rateLimitResult.resetTime 
        },
        { status: 429 }
      )
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

    // Send via Mailjet
    const result = await mailjet
      .post('send', { version: 'v3.1' })
      .request({
        Messages: [
          {
            From: {
              Email: process.env.MAILJET_FROM_EMAIL,
              Name: 'Claspire'
            },
            To: [{ Email: email }],
            Subject: `${otp} - Your Claspire OTP`,
            HTMLPart: `
              <div style="font-family:Arial,sans-serif;
                max-width:480px;margin:0 auto;
                padding:32px;background:#ffffff;">
                
                <div style="text-align:center;
                  margin-bottom:32px;">
                  <h1 style="font-size:24px;
                    color:#0A0A0A;margin:0;">
                    🎓 Claspire
                  </h1>
                  <p style="color:#9CA3AF;
                    font-size:14px;margin-top:4px;">
                    Your college community
                  </p>
                </div>

                <h2 style="font-size:20px;
                  color:#0A0A0A;margin-bottom:8px;">
                  Verify your email
                </h2>
                <p style="color:#6B7280;font-size:14px;
                  line-height:1.6;margin-bottom:24px;">
                  Use this OTP to complete your signup.
                  Valid for 10 minutes only.
                </p>

                <div style="background:#F3F0FF;
                  border-radius:12px;padding:24px;
                  text-align:center;margin:24px 0;">
                  <p style="font-size:13px;color:#7C3AED;
                    font-weight:600;margin:0 0 8px;">
                    YOUR OTP
                  </p>
                  <p style="font-size:40px;font-weight:800;
                    color:#7C3AED;letter-spacing:8px;margin:0;">
                    ${otp}
                  </p>
                  <p style="font-size:12px;color:#9CA3AF;
                    margin:8px 0 0;">
                    Expires in 10 minutes
                  </p>
                </div>

                <p style="color:#9CA3AF;font-size:12px;
                  text-align:center;line-height:1.6;">
                  Do not share this OTP with anyone.<br/>
                  Claspire team will never 
                  ask for your OTP.
                </p>

                <hr style="border:none;
                  border-top:1px solid #F3F4F6;
                  margin:24px 0;"/>

                <p style="color:#D1D5DB;font-size:11px;
                  text-align:center;">
                  © 2024 Claspire · 
                  India's College Community
                </p>
              </div>
            `
          }
        ]
      })

    console.log('Mailjet sent:', result.body)

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
