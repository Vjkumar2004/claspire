import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createNotification } from '@/lib/notifications'

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

    const user = JSON.parse(cookie.value)
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

    // 2. Fetch job details for notification/email context
    const { data: job } = await supabase
      .from('jobs')
      .select('company_name, role')
      .eq('id', jobId)
      .single()

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

    return NextResponse.json({ success: true, message: 'Referral request sent successfully' })

  } catch (err: any) {
    console.error('Referral request error:', err)
    return NextResponse.json({ error: 'Failed to send request' }, { status: 500 })
  }
}
