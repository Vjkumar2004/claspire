import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function GET(req: NextRequest) {
  try {
    const { data: seniors, error } = await supabase
      .from('users')
      .select(`
        id,
        full_name,
        email,
        unique_id,
        role,
        college_id,
        company,
        designation,
        graduation_year,
        rise_points,
        avatar_url,
        created_at,
        college:college_id (
          name,
          short_name,
          location
        )
      `)
      .eq('role', 'senior')
      .eq('verification_status', 'verified') // Ensure only verified seniors are shown
      .order('rise_points', { ascending: false })

    if (error) {
      console.error('Error fetching seniors:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(seniors)
  } catch (err: any) {
    console.error('Seniors API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
