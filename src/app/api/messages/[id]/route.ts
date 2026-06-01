import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { canModifyMessage } from '@/lib/message-utils'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

async function getSessionUser(req: NextRequest) {
  const cookie = req.cookies.get('claspire_session')
  if (!cookie?.value) return null
  try {
    const session = JSON.parse(cookie.value)
    return session.id as string
  } catch {
    return null
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getSessionUser(req)
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { id } = await params
    const { content } = await req.json()

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    const { data: existing, error: fetchError } = await supabase
      .from('direct_messages')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    if (existing.sender_id !== userId) {
      return NextResponse.json({ error: 'Only the sender can edit this message' }, { status: 403 })
    }

    if (!canModifyMessage(existing.created_at)) {
      return NextResponse.json(
        { error: 'Messages can only be edited within 7 hours of sending' },
        { status: 403 }
      )
    }

    const { data: updated, error: updateError } = await supabase
      .from('direct_messages')
      .update({
        content: content.trim(),
        edited_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single()

    if (updateError?.message?.includes('edited_at')) {
      const { data: retryUpdated, error: retryError } = await supabase
        .from('direct_messages')
        .update({ content: content.trim() })
        .eq('id', id)
        .select('*')
        .single()

      if (retryError) {
        return NextResponse.json({ error: retryError.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: retryUpdated })
    }

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: updated })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getSessionUser(req)
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { id } = await params

    const { data: existing, error: fetchError } = await supabase
      .from('direct_messages')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    if (existing.sender_id !== userId) {
      return NextResponse.json({ error: 'Only the sender can delete this message' }, { status: 403 })
    }

    if (!canModifyMessage(existing.created_at)) {
      return NextResponse.json(
        { error: 'Messages can only be deleted within 7 hours of sending' },
        { status: 403 }
      )
    }

    const { error: deleteError } = await supabase
      .from('direct_messages')
      .delete()
      .eq('id', id)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, deletedId: id })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
