import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  embedProfileInBio,
  resolveDisplayBio,
  resolveProfileData,
  stripProfileFromBio,
  type UserProfileData,
} from '@/lib/profile-data'

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
      company, designation, graduation_year, profile_data,
    } = body

    if (cgpa !== undefined && cgpa !== null && (cgpa < 0 || cgpa > 10)) {
      return NextResponse.json({ error: 'CGPA must be between 0 and 10' }, { status: 400 })
    }

    if (year !== undefined && year !== null && (year < 1 || year > 4)) {
      return NextResponse.json({ error: 'Year must be between 1 and 4' }, { status: 400 })
    }

    if (
      linkedin_url &&
      !linkedin_url.startsWith('https://linkedin.com') &&
      !linkedin_url.startsWith('https://www.linkedin.com')
    ) {
      return NextResponse.json({ error: 'Invalid LinkedIn URL' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }

    const scalarFields = [
      'bio', 'branch', 'year', 'cgpa', 'linkedin_url', 'passout_year',
      'company', 'designation', 'graduation_year', 'onesignal_player_id',
      'banner_url',
    ] as const

    scalarFields.forEach((field) => {
      if (body[field] !== undefined) updateData[field] = body[field]
    })

    if (profile_data !== undefined) {
      updateData.profile_data = profile_data
      const bioForStrip =
        body.bio !== undefined
          ? String(body.bio)
          : (await supabase.from('users').select('bio').eq('id', userId).single()).data?.bio || ''
      updateData.bio = stripProfileFromBio(bioForStrip)
    } else if (body.bio !== undefined) {
      updateData.bio = stripProfileFromBio(String(body.bio))
    }

    let { data: updatedUser, error } = await supabase
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
        avatar_url, onesignal_player_id, profile_data,
        colleges ( id, name, short_name, slug, location, state )
      `)
      .single()

    if (error?.message?.includes('profile_data')) {
      const { profile_data: pd, ...withoutProfileData } = updateData
      const retryPayload = { ...withoutProfileData } as Record<string, unknown>

      if (pd !== undefined) {
        const { data: current } = await supabase.from('users').select('bio').eq('id', userId).single()
        const baseBio =
          body.bio !== undefined ? String(body.bio) : resolveDisplayBio(current?.bio || '')
        retryPayload.bio = embedProfileInBio(baseBio, pd as UserProfileData)
      }

      const retry = await supabase
        .from('users')
        .update(retryPayload)
        .eq('id', userId)
        .select(`
          id, full_name, email, role,
          unique_id, rise_points, rp_level,
          doubt_count, answer_count,
          referral_count, webinar_count,
          is_verified, verification_status,
          bio, branch, year, cgpa, linkedin_url, passout_year,
          company, designation, graduation_year,
          avatar_url, onesignal_player_id,
          colleges ( id, name, short_name, slug, location, state )
        `)
        .single()
      updatedUser = retry.data ? { ...retry.data, profile_data: pd } : null
      error = retry.error
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const resolved = resolveProfileData(updatedUser!)
    const userResponse = {
      ...updatedUser,
      bio: resolveDisplayBio(updatedUser!.bio),
      profile_data: resolved,
    }

    const response = NextResponse.json({ success: true, user: userResponse })
    response.cookies.set('claspire_session', JSON.stringify(userResponse), {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })

    return response
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
