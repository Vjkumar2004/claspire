import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const cookie = req.cookies.get('claspire_session')
    if (!cookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const session = JSON.parse(cookie.value)
    const userId = session.id

    if (session.role !== 'senior') {
      return NextResponse.json({ error: 'Only seniors can post jobs' }, { status: 403 })
    }

    const {
      community_id,
      role: jobRole,
      company_name,
      description,
      location,
      job_type,
      salary_range,
      apply_link,
      referral_available,
      last_date
    } = await req.json()

    // Insert job
    const { data: job, error } = await supabase
      .from('jobs')
      .insert({
        community_id,
        posted_by: userId,
        role: jobRole,
        company_name,
        description,
        location,
        job_type,
        salary_range,
        apply_link,
        referral_available: referral_available || false,
        last_date: last_date || null,
        is_active: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get community slug + members
    const { data: comm } = await supabase
      .from('communities')
      .select('slug')
      .eq('id', community_id)
      .single()

    const { data: poster } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', userId)
      .single()

    // Notify all community members
    const { data: members } = await supabase
      .from('community_members')
      .select('user_id')
      .eq('community_id', community_id)
      .neq('user_id', userId)

    if (members?.length) {
      // In-app notifications
      const notifs = members.map(m => ({
        type: 'new_job',
        title: `💼 New Job at ${company_name}!`,
        message: `${poster?.full_name} posted ${jobRole} at ${company_name}${referral_available ? ' — Referral Available! 🎯' : ''}`,
        receiver_id: m.user_id,
        sender_id: userId,
        link: `/community/c/${comm?.slug}?tab=jobs`,
        is_read: false,
        created_at: new Date().toISOString()
      }))

      for (let i = 0; i < notifs.length; i += 50) {
        await supabase
          .from('notifications')
          .insert(notifs.slice(i, i + 50))
      }

      // Push notifications via OneSignal
      const { data: pushUsers } = await supabase
        .from('users')
        .select('onesignal_player_id')
        .in('id', members.map(m => m.user_id))
        .not('onesignal_player_id', 'is', null)

      if (pushUsers?.length) {
        const playerIds = pushUsers.map(u => u.onesignal_player_id).filter(Boolean)
        if (playerIds.length) {
          await fetch('https://onesignal.com/api/v1/notifications', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Basic ${process.env.ONESIGNAL_REST_API_KEY}`
            },
            body: JSON.stringify({
              app_id: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
              include_player_ids: playerIds,
              headings: { en: `💼 New Job at ${company_name}!` },
              contents: { en: `${jobRole} at ${company_name}${referral_available ? ' — Referral Available!' : ''}` },
              url: `${process.env.NEXT_PUBLIC_APP_URL}/community/c/${comm?.slug}`
            })
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      job
    })

  } catch (err: any) {
    console.error('Job create error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
