import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUserIdFromRequest } from '@/lib/session'
import { migrateProfileData } from '@/lib/profile-data'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const userId = getUserIdFromRequest(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { headline, bio, profile_updates } = body
    console.log('[POST /api/onboarding/complete] body:', JSON.stringify(body))
    console.log('[POST /api/onboarding/complete] headline type:', typeof headline, 'bio type:', typeof bio)
    console.log('[POST /api/onboarding/complete] headline:', JSON.stringify(headline), 'bio:', JSON.stringify(bio))

    let currentProfileData: Record<string, unknown> = {}

    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('profile_data')
      .eq('id', userId)
      .single()

    if (userError?.message?.includes('profile_data')) {
      currentProfileData = {}
    } else if (userError) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    } else {
      currentProfileData = { ...(currentUser?.profile_data || {}) }
    }

    let mergedProfileData = { ...currentProfileData }
    if (profile_updates) {
      mergedProfileData = { ...mergedProfileData, ...profile_updates }
    }
    
    const migratedData = migrateProfileData(mergedProfileData)

    const updatePayload: any = {
      onboarding_completed: true,
      profile_data: migratedData,
    }

    if (headline !== undefined) updatePayload.headline = headline
    if (bio !== undefined) updatePayload.bio = bio
    console.log('[POST /api/onboarding/complete] updatePayload:', JSON.stringify(updatePayload))
    console.log('[POST /api/onboarding/complete] bio in updatePayload:', 'bio' in updatePayload, 'bio value:', JSON.stringify(updatePayload.bio))

    const { error: updateError } = await supabase
      .from('users')
      .update(updatePayload)
      .eq('id', userId)

    if (updateError) {
      console.error('Error updating onboarding complete:', updateError)
      return NextResponse.json({ error: 'Failed to complete onboarding' }, { status: 500 })
    }

    console.log('[POST /api/onboarding/complete] update succeeded')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Onboarding complete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
