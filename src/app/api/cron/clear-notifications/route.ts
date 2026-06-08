import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function GET(req: NextRequest) {
  try {
    // Security: only Vercel cron can trigger this
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete only read notifications older than 24 hours
    // Unread notifications are preserved regardless of age
    const cutoff = new Date(
      Date.now() - 24 * 60 * 60 * 1000
    ).toISOString()

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('is_read', true)
      .lt('created_at', cutoff)

    if (error) {
      console.error('Cron clear error:', error)
      return NextResponse.json(
        { error: 'Failed to clear notifications' },
        { status: 500 }
      )
    }

    console.log('✅ Read notifications older than 24hrs cleared')

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: 'Read notifications older than 24hrs cleared'
    })
  } catch (err: any) {
    console.error('Cron error:', err)
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
}
