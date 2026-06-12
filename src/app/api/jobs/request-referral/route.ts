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

    const { jobId, seniorId } = await req.json()

    if (!jobId || !seniorId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 1. Check if already requested
    const { data: existing } = await supabase
      .from('referral_requests')
      .select('id')
      .eq('job_id', jobId)
      .eq('requester_id', user.id)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'You have already requested a referral for this job' }, { status: 400 })
    }

    // 2. Fetch job details and verify senior ownership
    const { data: job } = await supabase
      .from('jobs')
      .select('company_name, role, posted_by')
      .eq('id', jobId)
      .single()

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    if (seniorId !== job.posted_by) {
      return NextResponse.json({ error: 'Invalid referral target' }, { status: 403 })
    }

    // 3. Create request
    const { error: requestError } = await supabase
      .from('referral_requests')
      .insert({
        job_id: jobId,
        requester_id: user.id,
        senior_id: seniorId,
        status: 'pending'
      })

    if (requestError) throw requestError

    // 4. Create notification for the senior
    await createNotification({
      receiver_id: seniorId,
      sender_id: user.id,
      title: 'New Referral Request 📥',
      message: `${user.full_name} is seeking a referral for ${job?.role} at ${job?.company_name}.`,
      type: 'referral_request',
      link: '/dashboard/senior'
    })

    // 5. Push notification to the senior via OneSignal
    try {
      const { data: senior } = await supabase
        .from('users')
        .select('onesignal_player_id')
        .eq('id', seniorId)
        .single()

      if (senior?.onesignal_player_id) {
        await fetch('https://onesignal.com/api/v1/notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${process.env.ONESIGNAL_REST_API_KEY}`
          },
          body: JSON.stringify({
            app_id: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
            include_player_ids: [senior.onesignal_player_id],
            headings: { en: '📥 New Referral Request!' },
            contents: { en: `${user.full_name} wants a referral for ${job?.role} at ${job?.company_name}` },
            url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/senior`
          })
        })
      }
    } catch (pushErr) {
      console.error('Push notification error (referral request):', pushErr)
    }

    return NextResponse.json({ success: true, message: 'Referral request sent successfully' })

  } catch (err: any) {
    console.error('Referral request error:', err)
    return NextResponse.json({ error: 'Failed to send request' }, { status: 500 })
  }
}
