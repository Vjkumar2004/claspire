import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser } from '@/lib/session'
import { revalidatePath } from 'next/cache'

const ALLOWED_FIELDS = ['banner_url', 'logo_url', 'description', 'website_url', 'social_links', 'avg_package', 'highest_package', 'placement_rate', 'nirf_rank', 'rating']

export async function POST(
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
    const body = await req.json()

    const { data: college } = await supabase
      .from('colleges')
      .select('id, name, slug, name, short_name, type, location, state')
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

    const updates: Record<string, any> = {}
    for (const key of Object.keys(body)) {
      if (ALLOWED_FIELDS.includes(key)) {
        updates[key] = body[key]
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update. Allowed: ' + ALLOWED_FIELDS.join(', ') }, { status: 400 })
    }

    const { error: updateError } = await supabase
      .from('colleges')
      .update(updates)
      .eq('id', college.id)

    if (updateError) {
      console.error('College update error:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Revalidate college pages and list
    revalidatePath('/colleges')
    revalidatePath(`/colleges/${slug}`)
    revalidatePath('/api/colleges')

    return NextResponse.json({
      success: true,
      message: 'College profile updated successfully.',
      updated_fields: Object.keys(updates)
    })

  } catch (err: any) {
    console.error('College admin update error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
