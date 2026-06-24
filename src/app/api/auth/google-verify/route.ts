import { NextRequest, NextResponse } from 'next/server'
import { OAuth2Client } from 'google-auth-library'
import { applyRateLimit } from '@/lib/rateLimitRedis'

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

export async function POST(req: NextRequest) {
  try {
    // Rate limiting: 5 attempts per 10 minutes per IP
    const rateLimitResult = await applyRateLimit(req, 'googleAuth')
    if (!rateLimitResult.success && rateLimitResult.response) {
      return rateLimitResult.response
    }

    const { credential } = await req.json()

    if (!credential) {
      return NextResponse.json(
        { error: 'Google credential ID token required' },
        { status: 400 }
      )
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      return NextResponse.json(
        { error: 'Server misconfiguration: GOOGLE_CLIENT_ID not set' },
        { status: 500 }
      )
    }

    // Debug: Log server Client ID and decode token payload locally
    console.log('Server GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID)
    try {
      const parts = credential.split('.')
      if (parts.length >= 2) {
        const decoded = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'))
        console.log('Token Payload Details:', {
          aud: decoded.aud,
          iss: decoded.iss,
          email: decoded.email
        })
      }
    } catch (err) {
      console.error('Failed to log decoded token payload:', err)
    }

    // Verify token locally with Google OAuth2 Client (highly secure and performant)
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    })

    const payload = ticket.getPayload()
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid Google ID token payload' },
        { status: 400 }
      )
    }

    const { email, sub: google_id, email_verified } = payload

    if (!email_verified) {
      return NextResponse.json(
        { error: 'Unverified Google accounts are not permitted' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      email,
      google_id,
    })

  } catch (error: any) {
    console.error('Google token verification failed:', error)
    return NextResponse.json(
      { error: 'Failed to verify Google account. Please try again.' },
      { status: 401 }
    )
  }
}
