import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  )

  try {
    const cookie = req.cookies.get('claspire_session')
    let userId = null
    
    if (cookie) {
      try {
        const session = JSON.parse(cookie.value)
        userId = session.id
      } catch (e) {
        console.warn('Failed to parse optional session for college request')
      }
    }

    const { 
      college_name, short_name, location, state, 
      college_type, email_domain, website_url, additional_info 
    } = await req.json()

    // Required fields check
    if (!college_name || !short_name || !location || !state || !college_type || !email_domain) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if duplicate in colleges table
    const { data: existingCollege } = await supabase
      .from('colleges')
      .select('id')
      .ilike('name', college_name)
      .single()

    if (existingCollege) {
      return NextResponse.json({ error: 'This college is already on Claspire!' }, { status: 400 })
    }

    // Check duplicate pending requests
    const { data: existingRequest } = await supabase
      .from('college_requests')
      .select('id')
      .ilike('college_name', college_name)
      .eq('status', 'pending')
      .maybeSingle()

    if (existingRequest) {
      return NextResponse.json({ error: "Already requested, we're reviewing it!" }, { status: 400 })
    }

    // Insert request
    const { error: insertError } = await supabase
      .from('college_requests')
      .insert({
        college_name,
        short_name,
        location,
        state,
        college_type,
        email_domain,
        website_url,
        additional_info,
        requested_by: userId,
        status: 'pending',
        created_at: new Date().toISOString()
      })

    if (insertError) {
      console.error('College request error:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Coming Soon! Your request has been recorded."
    })

  } catch (err: any) {
    console.error('Server error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    )
  
    try {
      const { data: requests, error } = await supabase
        .from('college_requests')
        .select(`
          id, college_name, short_name, status, created_at
        `)
        .order('created_at', { ascending: false })
  
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
  
      return NextResponse.json({ success: true, requests })
    } catch (err: any) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
