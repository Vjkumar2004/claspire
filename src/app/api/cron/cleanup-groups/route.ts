import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date().toISOString()

    const { data: expiredGroups, error: fetchError } = await supabase
      .from('student_groups')
      .select('id, name, auto_delete_at')
      .lt('auto_delete_at', now)

    if (fetchError) {
      console.error('Cleanup groups fetch error:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch expired groups' }, { status: 500 })
    }

    if (!expiredGroups || expiredGroups.length === 0) {
      return NextResponse.json({
        success: true,
        deleted: 0,
        message: 'No expired groups to clean up'
      })
    }

    const groupIds = expiredGroups.map(g => g.id)
    let deletedCount = 0

    for (const groupId of groupIds) {
      await supabase.from('student_group_messages').delete().eq('group_id', groupId)
      await supabase.from('student_group_members').delete().eq('group_id', groupId)
      await supabase.from('student_group_join_requests').delete().eq('group_id', groupId)
      const { error: deleteError } = await supabase
        .from('student_groups')
        .delete()
        .eq('id', groupId)

      if (!deleteError) {
        deletedCount++
      } else {
        console.error(`Failed to delete group ${groupId}:`, deleteError)
      }
    }

    console.log(`Cleanup: deleted ${deletedCount} expired groups`)

    return NextResponse.json({
      success: true,
      deleted: deletedCount,
      total_expired: expiredGroups.length,
      groups: expiredGroups.map(g => ({ id: g.id, name: g.name, auto_delete_at: g.auto_delete_at })),
      timestamp: now
    })
  } catch (err: any) {
    console.error('Cleanup groups cron error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
