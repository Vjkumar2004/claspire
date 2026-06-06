import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser } from '@/lib/session'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function GET(req: NextRequest) {
  try {
    // SECURITY: Use signed session verification instead of direct cookie parsing
    // Direct JSON.parse(cookie.value) is unsafe because cookies can be modified
    // via DevTools or proxy tools, allowing session hijacking and privilege escalation
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const userId = user.id

    // Check role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (userData.role !== 'student') {
      return NextResponse.json({ error: 'Only juniors can view accepted seniors' }, { status: 403 })
    }

    // Step 1: Fetch accepted requests
    const { data: requests, error: requestsError } = await supabase
      .from('message_requests')
      .select('id, student_id, senior_id, status, created_at, responded_at')
      .eq('student_id', userId)
      .eq('status', 'accepted')
      .order('responded_at', { ascending: false })

    if (requestsError) {
      console.error('Fetch accepted seniors error:', requestsError)
      return NextResponse.json({ error: 'Failed to fetch accepted seniors' }, { status: 500 })
    }

    if (!requests || requests.length === 0) {
      return NextResponse.json({ seniors: [] })
    }

    // Step 2: Fetch senior details separately
    const seniorIds = requests.map(r => r.senior_id)

    const { data: seniors, error: seniorsError } = await supabase
      .from('users')
      .select('id, full_name, avatar_url, company, designation, unique_id')
      .in('id', seniorIds)

    if (seniorsError) {
      console.error('Fetch seniors error:', seniorsError)
      return NextResponse.json({ error: 'Failed to fetch senior details' }, { status: 500 })
    }

    // Step 3: Merge
    const formattedSeniors = requests.map(request => {
      const senior = seniors?.find(s => s.id === request.senior_id)
      return {
        id: request.id,
        senior_id: request.senior_id,
        request_created_at: request.created_at,
        accepted_at: request.responded_at,
        full_name: senior?.full_name || 'Unknown',
        avatar_url: senior?.avatar_url || null,
        company: senior?.company || null,
        designation: senior?.designation || null,
        unique_id: senior?.unique_id || null,
      }
    })

    return NextResponse.json({ seniors: formattedSeniors })

  } catch (error) {
    console.error('Get accepted seniors error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}