import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createNotification } from '@/lib/notifications'
import { getAuthenticatedUser } from '@/lib/session'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function POST(req: NextRequest) {
  try {
    // SECURITY: Use signed session verification instead of direct cookie parsing
    // Direct JSON.parse(cookie.value) is unsafe because cookies can be modified
    // via DevTools or proxy tools, allowing session hijacking and privilege escalation
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { referralId } = await req.json()
    if (!referralId) {
      return NextResponse.json({ error: 'Referral ID is required' }, { status: 400 })
    }

    // 1. Fetch referral details with joins
    const { data: referral, error: fetchError } = await supabase
      .from('referral_requests')
      .select(`
        id, requester_id, senior_id, job_id, status,
        job:jobs ( company_name, role ),
        senior:users!senior_id ( full_name )
      `)
      .eq('id', referralId)
      .single()

    if (fetchError || !referral) {
      console.error('Fetch referral error:', fetchError)
      return NextResponse.json({ error: 'Referral request not found' }, { status: 404 })
    }

    if (referral.status !== 'pending') {
      return NextResponse.json({ error: 'Referral is already processed' }, { status: 400 })
    }

    const ref = referral as any

    // Authorization: Only the assigned senior may approve this referral
    if (user.id !== ref.senior_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const juniorId = ref.requester_id
    const seniorName = ref.senior?.full_name || 'A senior'
    const jobRole = ref.job?.role || 'the job'
    const companyName = ref.job?.company_name || 'the company'

    // 2. Update referral status
    const { error: updateError } = await supabase
      .from('referral_requests')
      .update({ status: 'approved', updated_at: new Date().toISOString() })
      .eq('id', referralId)

    if (updateError) throw updateError

    // 3-4. Fetch both users and update in parallel
    const { data: userRows } = await supabase
      .from('users')
      .select('id, referral_count, rise_points')
      .in('id', [ref.senior_id, juniorId])

    const seniorUser = userRows?.find(u => u.id === ref.senior_id)
    const juniorUser = userRows?.find(u => u.id === juniorId)

    await Promise.all([
      supabase.from('users').update({ 
        referral_count: (seniorUser?.referral_count || 0) + 1,
        rise_points: (seniorUser?.rise_points || 0) + 15
      }).eq('id', ref.senior_id),
      supabase.from('users').update({ 
        rise_points: (juniorUser?.rise_points || 0) + 25,
        referral_count: (juniorUser?.referral_count || 0) + 1
      }).eq('id', juniorId),
      supabase.from('rise_points_log').insert({
        user_id: ref.senior_id, points: 15,
        reason: `Approved a referral for ${jobRole} @ ${companyName} 🤝`,
        created_at: new Date().toISOString()
      }),
      supabase.from('rise_points_log').insert({
        user_id: juniorId, points: 25,
        reason: `Referral approved by ${seniorName}! 🎯`,
        created_at: new Date().toISOString()
      }),
    ])

    // 5. Create In-App Notification
    try {
        const notifResult = await createNotification({
          receiver_id: juniorId,
          sender_id: user.id,
          type: 'referral_approved',
          title: 'Congratulations! Referral Approved! 🎉',
          message: `${seniorName} has approved your referral request for ${jobRole} at ${companyName}. Check your dashboard!`,
          link: '/dashboard/junior'
        })
        console.log('In-app notification result:', notifResult)
    } catch (notifErr) {
        console.error('In-app notification error:', notifErr)
    }

    // 6. Push notification to junior via OneSignal
    try {
      const { data: requester } = await supabase
        .from('users')
        .select('onesignal_player_id')
        .eq('id', juniorId)
        .single()

      if (requester?.onesignal_player_id) {
        const osRes = await fetch('https://onesignal.com/api/v1/notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${process.env.ONESIGNAL_REST_API_KEY}`
          },
          body: JSON.stringify({
            app_id: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
            include_player_ids: [requester.onesignal_player_id],
            headings: { en: '🎉 Referral Approved!' },
            contents: { en: `${seniorName} approved your referral for ${jobRole} at ${companyName}` },
            url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/junior`
          })
        })
        console.log('OneSignal push status:', osRes.status)
      }
    } catch (pushErr) {
      console.error('Push notification error (referral approve):', pushErr)
    }

    return NextResponse.json({ success: true, message: 'Referral approved successfully' })

  } catch (err: any) {
    console.error('Approval error:', err)
    return NextResponse.json({ error: 'Failed to approve referral' }, { status: 500 })
  }
}
