import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin, logAdminAction } from '@/lib/admin'

export async function GET(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  )

  try {
    const auth = await requireAdmin(req)
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { data: claims, error } = await supabase
      .from('college_claims')
      .select(`
        id,
        college_id,
        user_id,
        official_email,
        official_website,
        designation,
        contact_person,
        verification_msg,
        status,
        created_at,
        reviewed_at,
        colleges:college_id ( id, name, short_name, slug, type, location, state, email_domain, website_url ),
        users:user_id ( id, full_name, email, role, avatar_url )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Claims fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, claims })

  } catch (err: any) {
    console.error('Claims error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
