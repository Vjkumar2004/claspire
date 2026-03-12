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

    const { referralId } = await req.json()
    if (!referralId) {
      return NextResponse.json({ error: 'Referral ID is required' }, { status: 400 })
    }

    // 1. Fetch referral details
    const { data: referral, error: fetchError } = await supabase
      .from('referral_requests')
      .select(`
        id, requester_id, senior_id, job_id, status,
        job:job_id ( company_name, role ),
        senior:senior_id ( full_name )
      `)
      .eq('id', referralId)
      .single()

    if (fetchError || !referral) {
      return NextResponse.json({ error: 'Referral request not found' }, { status: 404 })
    }

    if (referral.status !== 'pending') {
      return NextResponse.json({ error: 'Referral is already processed' }, { status: 400 })
    }

    // 2. Update referral status
    const { error: updateError } = await supabase
      .from('referral_requests')
      .update({ status: 'approved', updated_at: new Date().toISOString() })
      .eq('id', referralId)

    if (updateError) throw updateError

    // 3. Increment senior's referral count
    const { data: senior } = await supabase
      .from('users')
      .select('referral_count')
      .eq('id', referral.senior_id)
      .single()

    await supabase
      .from('users')
      .update({ referral_count: (senior?.referral_count || 0) + 1 })
      .eq('id', referral.senior_id)

    const ref = referral as any
    await supabase
      .from('notifications')
      .insert({
        user_id: ref.requester_id,
        title: 'Referral Approved! 🎉',
        content: `Your request for ${ref.job?.role} at ${ref.job?.company_name} has been approved by ${ref.senior?.full_name}.`,
        type: 'referral_approved',
        link: '/dashboard'
      })

    return NextResponse.json({ success: true, message: 'Referral approved successfully' })

  } catch (err: any) {
    console.error('Approval error:', err)
    return NextResponse.json({ error: 'Failed to approve referral' }, { status: 500 })
  }
}
