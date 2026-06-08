import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser } from '@/lib/session'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function POST(req: NextRequest) {
  try {
    console.log('[Connect] Request received')

    const user = await getAuthenticatedUser(req)
    if (!user) {
      console.log('[Connect] Auth failed — no user from cookie')
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    console.log('[Connect] Authenticated user:', user.id, user.full_name)

    const body = await req.json()
    const { receiver_id } = body
    console.log('[Connect] Target receiver_id:', receiver_id)

    if (!receiver_id) {
      return NextResponse.json({ error: 'receiver_id is required' }, { status: 400 })
    }

    if (user.id === receiver_id) {
      return NextResponse.json({ error: 'Cannot connect with yourself' }, { status: 400 })
    }

    const { data: receiver, error: receiverError } = await supabase
      .from('users')
      .select('id')
      .eq('id', receiver_id)
      .maybeSingle()
    console.log('[Connect] Receiver lookup — found:', !!receiver, 'error:', receiverError?.message)

    if (receiverError || !receiver) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log('[Connect] Checking existing connection')
    const { data: existing, error: existingError } = await supabase
      .from('connections')
      .select('id, status')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${receiver_id}),and(sender_id.eq.${receiver_id},receiver_id.eq.${user.id})`)
      .maybeSingle()
    console.log('[Connect] Existing check — existing:', !!existing, 'error:', existingError?.message)

    if (existing) {
      return NextResponse.json({
        error: 'already_requested',
        status: existing.status,
      }, { status: 409 })
    }

    console.log('[Connect] Creating connection:', { sender_id: user.id, receiver_id })
    const { data: newConnection, error: insertError } = await supabase
      .from('connections')
      .insert({
        sender_id: user.id,
        receiver_id,
        status: 'pending',
      })
      .select()
      .single()

    if (insertError) {
      console.error('[Connect] Insert error:', insertError)
      return NextResponse.json({ error: `Insert failed: ${insertError.message}` }, { status: 500 })
    }
    console.log('[Connect] Connection created:', newConnection?.id)

    console.log('[Connect] Creating notification')
    const { error: notifError } = await supabase.from('notifications').insert({
      receiver_id,
      sender_id: user.id,
      title: 'New Connection Request',
      message: `${user.full_name} wants to connect with you.`,
      type: 'message_request',
      link: '/network',
    })
    if (notifError) {
      console.error('[Connect] Notification insert error:', notifError)
    }

    return NextResponse.json({ success: true, connection: newConnection })
  } catch (error) {
    console.error('[Connect] Unhandled error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
