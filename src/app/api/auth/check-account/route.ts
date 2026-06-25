import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { applyRateLimit } from '@/lib/rateLimitRedis'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 10 requests per 10 minutes per IP
    const rateLimitResult = await applyRateLimit(request, 'checkAccount')
    if (!rateLimitResult.success && rateLimitResult.response) {
      return rateLimitResult.response
    }

    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Always return generic response to prevent account enumeration
    // Do NOT reveal whether the account exists or not
    return NextResponse.json({
      success: true
    })

  } catch (error) {
    console.error('Check account API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

