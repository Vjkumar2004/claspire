import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function GET() {
  try {
    const { data: communities, error } = await supabase
      .from('communities')
      .select(`
        id,
        slug,
        display_name,
        member_count,
        senior_count,
        doubt_count,
        colleges (
          id,
          name,
          short_name,
          location,
          state,
          type
        )
      `)
      .order('member_count', { ascending: false })

    if (error) throw error

    return NextResponse.json({
      success: true,
      communities: communities || []
    })

  } catch (err: any) {
    console.error('Colleges fetch error:', err)
    return NextResponse.json(
      { error: 'Server error', details: err.message },
      { status: 500 }
    )
  }
}
