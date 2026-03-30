import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

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
    const cookiesStore = await cookies()
    const sessionCookie = cookiesStore.get('claspire_session')

    if (!sessionCookie?.value) {
      return NextResponse.json({ status: null })
    }

    const cookieUser = JSON.parse(sessionCookie.value)

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
      .eq('user_id', cookieUser.id)
      .single()

    return NextResponse.json({ status: joinRequest?.status ?? null })

  } catch {
    return NextResponse.json({ status: null })
  }
}
