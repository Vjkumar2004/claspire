import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function GET(req: NextRequest) {
  try {
    const session = req.cookies.get('claspire_session')
    if (!session?.value) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    let userSession
    try {
      userSession = JSON.parse(session.value)
    } catch {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const userId = userSession.id

    // Check role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (userData.role !== 'senior') {
      return NextResponse.json({ error: 'Only seniors can view incoming requests' }, { status: 403 })
    }

    // Step 1: Fetch pending requests
    const { data: requests, error: requestsError } = await supabase
      .from('message_requests')
      .select('id, student_id, senior_id, status, created_at, responded_at')
      .eq('senior_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (requestsError) {
      console.error('❌ Fetch requests error:', requestsError)
      return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 })
    }

    if (!requests || requests.length === 0) {
      return NextResponse.json({ requests: [] })
    }

    // Step 2: Fetch student details separately
    const studentIds = requests.map(r => r.student_id)

    const { data: students, error: studentsError } = await supabase
      .from('users')
      .select('id, full_name, avatar_url, college_id, branch, year, unique_id')
      .in('id', studentIds)

    if (studentsError) {
      console.error('❌ Fetch students error:', studentsError)
      return NextResponse.json({ error: 'Failed to fetch student details' }, { status: 500 })
    }

    // Step 3: Fetch college details
    const collegeIds = [...new Set(students?.map(s => s.college_id).filter(Boolean))]

    let colleges: any[] = []
    if (collegeIds.length > 0) {
      const { data: collegeData } = await supabase
        .from('colleges')
        .select('id, name, short_name, location')
        .in('id', collegeIds)
      colleges = collegeData || []
    }

    // Step 4: Merge everything
    const formattedRequests = requests.map(request => {
      const student = students?.find(s => s.id === request.student_id)
      const college = colleges.find(c => c.id === student?.college_id)

      return {
        id: request.id,
        student_id: request.student_id,
        senior_id: request.senior_id,
        status: request.status,
        created_at: request.created_at,
        responded_at: request.responded_at,
        full_name: student?.full_name || 'Unknown',
        avatar_url: student?.avatar_url || null,
        college_id: student?.college_id || null,
        branch: student?.branch || null,
        year: student?.year || null,
        unique_id: student?.unique_id || null,
        college_name: college?.name || null,
        college_short_name: college?.short_name || null,
        college_location: college?.location || null,
      }
    })

    return NextResponse.json({ requests: formattedRequests })

  } catch (error: any) {
    console.error('💥 Error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error?.message }, { status: 500 })
  }
}