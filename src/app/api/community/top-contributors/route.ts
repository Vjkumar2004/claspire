import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
)

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, avatar_url, rise_points, rp_level, unique_id')
      .gte('rise_points', 1)
      .order('rise_points', { ascending: false })
      .limit(5)

    if (error) throw error

    return NextResponse.json({ success: true, contributors: data || [] })
  } catch (error) {
    console.error('Failed to fetch top contributors:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch contributors' }, { status: 500 })
  }
}
