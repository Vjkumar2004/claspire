import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser } from '@/lib/session'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await req.json()
    const { connection_id } = body

    if (!connection_id) {
      return NextResponse.json({ error: 'connection_id is required' }, { status: 400 })
    }

    const { data: connection, error: fetchError } = await supabase
      .from('connections')
      .select('id, sender_id, receiver_id, status')
      .eq('id', connection_id)
      .single()

    if (fetchError || !connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
    }

    if (connection.sender_id !== user.id && connection.receiver_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    if (connection.status !== 'accepted') {
      return NextResponse.json({ error: 'Can only remove accepted connections' }, { status: 400 })
    }

    const { error: deleteError } = await supabase
      .from('connections')
      .delete()
      .eq('id', connection_id)

    if (deleteError) {
      console.error('Remove connection error:', deleteError)
      return NextResponse.json({ error: 'Failed to remove connection' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Remove API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
