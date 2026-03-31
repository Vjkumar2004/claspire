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

    let {
      community_id,
      role: jobRole,
      company_name,
      description,
      location,
      job_type,
      salary_range,
      referral_available,
      deadline
    } = await req.json()

    // If community_id is missing, find user's college community
    if (!community_id) {
      const { data: userProfile } = await supabase
        .from('users')
        .select('college_id')
        .eq('id', userId)
        .single()
      
      if (userProfile?.college_id) {
        const { data: comm } = await supabase
          .from('communities')
          .select('id')
          .eq('college_id', userProfile.college_id)
          .single()
        
        if (comm) community_id = comm.id
      }
    }

    if (!community_id) {
      return NextResponse.json({ error: 'Could not find a community to post this job to.' }, { status: 400 })
    }

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
        referral_available: referral_available || false,
        deadline: deadline || null,
        is_active: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Job insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Award 20 RP to the senior for posting a job
    const { data: seniorUser } = await supabase
      .from('users')
      .select('rise_points, full_name')
      .eq('id', userId)
      .single()

    await supabase
      .from('rise_points_log')
      .insert({
        user_id: userId,
        points: 20,
        reason: `Posted a job: ${jobRole} at ${company_name} 💼`,
        created_at: new Date().toISOString()
      })

    await supabase
      .from('users')
      .update({ rise_points: (seniorUser?.rise_points || 0) + 20 })
      .eq('id', userId)

    // Get community slug + college info
    const { data: comm } = await supabase
      .from('communities')
      .select('slug, college_id')
      .eq('id', community_id)
      .single()

    // Notify ALL students from the same college (not just community members)
    const { data: collegeStudents } = await supabase
      .from('users')
      .select('id')
      .eq('college_id', comm?.college_id)
      .eq('role', 'student')
      .neq('id', userId) // Exclude the senior who posted the job

    if (collegeStudents?.length) {
      // In-app notifications
      const notifs = collegeStudents.map(student => ({
        type: 'new_job',
        title: `💼 New Job at ${company_name}!`,
        message: `${seniorUser?.full_name} posted ${jobRole} at ${company_name}${referral_available ? ' — Referral Available! 🎯' : ''}`,
        receiver_id: student.id,
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
        .in('id', collegeStudents.map(s => s.id))
        .not('onesignal_player_id', 'is', null)

      if (pushUsers?.length) {
        const playerIds = pushUsers.map(u => u.onesignal_player_id).filter(Boolean)
        if (playerIds.length) {
          try {
            const pushRes = await fetch('https://onesignal.com/api/v1/notifications', {
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
            const pushResult = await pushRes.json()
            console.log('Job post push result:', JSON.stringify(pushResult))
            if (pushResult.errors) {
              console.error('OneSignal push errors:', pushResult.errors)
            }
          } catch (pushErr) {
            console.error('Push notification error (job post):', pushErr)
          }
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
