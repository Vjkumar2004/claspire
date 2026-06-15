import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser } from '@/lib/session'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  )

  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { slug } = await params

    const { data: college } = await supabase
      .from('colleges')
      .select('*')
      .eq('slug', slug)
      .single()

    if (!college) {
      return NextResponse.json({ error: 'College not found' }, { status: 404 })
    }

    const { data: adminEntry } = await supabase
      .from('college_admins')
      .select('*')
      .eq('college_id', college.id)
      .eq('user_id', user.id)
      .eq('status', 'approved')
      .maybeSingle()

    if (!adminEntry) {
      return NextResponse.json({ error: 'Not authorized as admin for this college' }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      admin: adminEntry,
      college
    })

  } catch (err: any) {
    console.error('Admin check error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
