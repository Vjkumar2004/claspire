import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getAuthenticatedUser } from '@/lib/session'
import { applyRateLimit, getUserIdentifier } from '@/lib/rateLimitRedis'

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userIdentifier = await getUserIdentifier(req)
  const rateLimitResult = await applyRateLimit(req, 'general', userIdentifier)
  if (!rateLimitResult.success && rateLimitResult.response) {
    return rateLimitResult.response
  }

  const jwtSecret = process.env.SUPABASE_JWT_SECRET
  if (!jwtSecret) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  const header = { alg: 'HS256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const payload = {
    aud: 'authenticated',
    exp: now + 3600,
    sub: user.id,
    role: 'authenticated',
    iat: now,
  }

  const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url')
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = crypto
    .createHmac('sha256', jwtSecret)
    .update(`${base64Header}.${base64Payload}`)
    .digest('base64url')

  const accessToken = `${base64Header}.${base64Payload}.${signature}`

  return NextResponse.json({ access_token: accessToken })
}
