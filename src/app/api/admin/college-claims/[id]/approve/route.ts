import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin, logAdminAction } from '@/lib/admin'
import { createNotification, sendPushToUsers } from '@/lib/notifications'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  )

  try {
    const auth = await requireAdmin(req)
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }
    const admin = auth.user

    const { id } = await params

    const { data: claim } = await supabase
      .from('college_claims')
      .select('*, colleges!college_id ( name, slug )')
      .eq('id', id)
      .single()

    if (!claim) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 })
    }

    if (claim.status !== 'pending') {
      return NextResponse.json({ error: 'Claim has already been processed' }, { status: 400 })
    }

    const { error: claimUpdateError } = await supabase
      .from('college_claims')
      .update({
        status: 'approved',
        reviewed_by: admin.id,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', id)

    if (claimUpdateError) {
      console.error('Claim update error:', claimUpdateError)
      return NextResponse.json({ error: claimUpdateError.message }, { status: 500 })
    }

    const { error: adminInsertError } = await supabase
      .from('college_admins')
      .insert({
        college_id: claim.college_id,
        user_id: claim.user_id,
        role: 'owner',
        status: 'approved',
        created_at: new Date().toISOString()
      })

    if (adminInsertError) {
      console.error('Admin insert error:', adminInsertError)
      return NextResponse.json({ error: adminInsertError.message }, { status: 500 })
    }

    const { error: collegeUpdateError } = await supabase
      .from('colleges')
      .update({
        is_verified: true,
        claimed_by: claim.user_id,
        claimed_at: new Date().toISOString()
      })
      .eq('id', claim.college_id)

    if (collegeUpdateError) {
      console.error('College update error:', collegeUpdateError)
      return NextResponse.json({ error: collegeUpdateError.message }, { status: 500 })
    }

    // Notify the user who submitted the claim
    const collegeName = claim.colleges?.name || 'your college'
    await Promise.all([
      createNotification({
        receiver_id: claim.user_id,
        sender_id: admin.id,
        type: 'college_claim_approved',
        title: 'College Claim Approved',
        message: `Your claim for ${collegeName} has been approved. You are now an admin of this college page.`,
        link: `/colleges/${claim.colleges?.slug || ''}`
      }),
      sendPushToUsers(
        [claim.user_id],
        'College Claim Approved',
        `Your claim for ${collegeName} has been approved.`,
        `/colleges/${claim.colleges?.slug || ''}`
      )
    ])

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined
    await logAdminAction(admin.id, 'APPROVE_COLLEGE_CLAIM', 'college_claim', id, {
      college_id: claim.college_id,
      user_id: claim.user_id,
      official_email: claim.official_email
    }, ip)

    return NextResponse.json({
      success: true,
      message: 'Claim approved and college admin created.'
    })

  } catch (err: any) {
    console.error('Approve error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
