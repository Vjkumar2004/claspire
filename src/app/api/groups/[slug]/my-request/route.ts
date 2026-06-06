import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser } from '@/lib/session'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    // SECURITY: Use signed session verification instead of direct cookie parsing
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ status: null })
    }

    const { data: group } = await supabase
      .from('student_groups')
      .select('id')
      .eq('slug', slug)
      .single()

    if (!group) return NextResponse.json({ status: null })

    const { data: joinRequest } = await supabase
      .from('student_group_join_requests')
      .select('status')
      .eq('group_id', group.id)
      .eq('user_id', user.id)
      .single()

    return NextResponse.json({ status: joinRequest?.status ?? null })

  } catch {
    return NextResponse.json({ status: null })
  }
}
