import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser } from '@/lib/session'
import { applyRateLimit, getUserIdentifier } from '@/lib/rateLimitRedis'

export async function GET(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  )

  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const collegeId = searchParams.get('college_id')

    if (!collegeId) {
      return NextResponse.json({ error: 'college_id is required' }, { status: 400 })
    }

    const { data: claim } = await supabase
      .from('college_claims')
      .select('id, status, created_at')
      .eq('college_id', collegeId)
      .eq('user_id', user.id)
      .maybeSingle()

    return NextResponse.json({ success: true, claim })

  } catch (err: any) {
    console.error('Claim check error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  )

  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: 'You must be signed in to claim a college' }, { status: 401 })
    }

    // Rate limiting: 3 claims per hour per user
    const userIdentifier = await getUserIdentifier(req)
    const rateLimitResult = await applyRateLimit(req, 'collegeClaim', userIdentifier)
    if (!rateLimitResult.success && rateLimitResult.response) {
      return rateLimitResult.response
    }

    const { college_id, official_email, official_website, designation, contact_person, verification_msg } = await req.json()

    if (!college_id || !official_email || !official_website || !designation || !contact_person) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data: college } = await supabase
      .from('colleges')
      .select('id, name, email_domain, website_url')
      .eq('id', college_id)
      .single()

    if (!college) {
      return NextResponse.json({ error: 'College not found' }, { status: 404 })
    }

    const domain = official_email.split('@')[1]?.toLowerCase()

    // Try email_domain first, fallback to extracting from website_url
    let collegeDomain = college.email_domain?.toLowerCase()
    if (!collegeDomain && college.website_url) {
      try {
        const url = new URL(college.website_url)
        const hostParts = url.hostname.replace('www.', '').split('.')
        collegeDomain = hostParts.slice(-2).join('.').toLowerCase()
      } catch {
        collegeDomain = null
      }
    }

    if (!collegeDomain) {
      return NextResponse.json({ error: 'This college does not have a verified domain on Claspire. Please contact support.' }, { status: 400 })
    }

    // Must match exactly OR be a subdomain (e.g. cs.aaacet.ac.in)
    // Prevents fakeaaacet.ac.in from passing endsWith check
    const isExactMatch = domain === collegeDomain
    const isSubdomain = domain?.endsWith('.' + collegeDomain)
    if (!domain || (!isExactMatch && !isSubdomain)) {
      return NextResponse.json({ error: `Email must use the college domain (@${collegeDomain}). Personal emails (gmail.com, yahoo.com, etc.) are not allowed.` }, { status: 400 })
    }

    const { data: existingClaim } = await supabase
      .from('college_claims')
      .select('id, status')
      .eq('college_id', college_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingClaim) {
      if (existingClaim.status === 'pending') {
        return NextResponse.json({ error: 'You already have a pending claim for this college.' }, { status: 400 })
      }
      if (existingClaim.status === 'approved') {
        return NextResponse.json({ error: 'You are already an admin of this college.' }, { status: 400 })
      }
    }

    const { error: insertError } = await supabase
      .from('college_claims')
      .insert({
        college_id,
        user_id: user.id,
        official_email,
        official_website,
        designation,
        contact_person,
        verification_msg: verification_msg || null,
        status: 'pending',
        created_at: new Date().toISOString()
      })

    if (insertError) {
      console.error('Claim insert error:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Your claim has been submitted for review. We will notify you once it is approved.'
    })

  } catch (err: any) {
    console.error('Claim error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
