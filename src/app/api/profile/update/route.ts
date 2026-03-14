import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function PATCH(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  )

  try {
    const cookie = req.cookies.get('claspire_session')
    if (!cookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const session = JSON.parse(cookie.value)
    const userId = session.id

    const body = await req.json()
    const { 
      bio, branch, year, cgpa, linkedin_url, passout_year,
      company, designation, graduation_year 
    } = body

    // Validation
    if (cgpa !== undefined && (cgpa < 0 || cgpa > 10)) {
      return NextResponse.json({ error: 'CGPA must be between 0 and 10' }, { status: 400 })
    }

    if (year !== undefined && (year < 1 || year > 4)) {
      return NextResponse.json({ error: 'Year must be between 1 and 4' }, { status: 400 })
    }

    if (
      linkedin_url && 
      !linkedin_url.startsWith('https://linkedin.com') && 
      !linkedin_url.startsWith('https://www.linkedin.com')
    ) {
      return NextResponse.json({ error: 'LinkedIn URL must start with https://linkedin.com or https://www.linkedin.com' }, { status: 400 })
    }

    // Only allow specific fields
    const updateData: any = {}
    const allowedFields = [
      'bio', 'branch', 'year', 'cgpa', 'linkedin_url', 'passout_year',
      'company', 'designation', 'graduation_year'
    ]

    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    })

    updateData.updated_at = new Date().toISOString()

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select(`
        id, full_name, email, role,
        unique_id, rise_points, rp_level,
        doubt_count, answer_count,
        referral_count, webinar_count,
        is_verified, verification_status,
        bio, branch, year, cgpa, linkedin_url, passout_year,
        company, designation, graduation_year,
        avatar_url,
        colleges ( id, name, short_name, slug )
      `)
      .single()

    if (error) {
      console.error('Profile update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const response = NextResponse.json({
      success: true,
      user: updatedUser
    })

    // Update session cookie to keep parity
    response.cookies.set(
      'claspire_session',
      JSON.stringify(updatedUser),
      {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        path: '/'
      }
    )

    return response

  } catch (err: any) {
    console.error('Server error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
