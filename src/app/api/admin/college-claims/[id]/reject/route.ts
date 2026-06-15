import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin, logAdminAction } from '@/lib/admin'

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
      .select('*')
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
        status: 'rejected',
        reviewed_by: admin.id,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', id)

    if (claimUpdateError) {
      console.error('Claim update error:', claimUpdateError)
      return NextResponse.json({ error: claimUpdateError.message }, { status: 500 })
    }

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined
    await logAdminAction(admin.id, 'REJECT_COLLEGE_CLAIM', 'college_claim', id, {
      college_id: claim.college_id,
      user_id: claim.user_id,
      official_email: claim.official_email
    }, ip)

    return NextResponse.json({
      success: true,
      message: 'Claim rejected.'
    })

  } catch (err: any) {
    console.error('Reject error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
