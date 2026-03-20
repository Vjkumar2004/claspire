import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function GET(req: NextRequest) {
  try {
    console.log('🔥 Incoming requests API called (simple version)')
    
    // Get current user from session cookie
    const session = req.cookies.get('claspire_session')
    if (!session?.value) {
      console.log('❌ No session cookie found')
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    let userSession
    try {
      userSession = JSON.parse(session.value)
      console.log('✅ Session parsed, user ID:', userSession.id)
    } catch (parseError) {
      console.log('❌ Failed to parse session')
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const userId = userSession.id

    // Get user role to ensure they're a senior
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (userError || !userData) {
      console.error('❌ User not found:', userError)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (userData.role !== 'senior') {
      console.log('❌ User is not a senior:', userData.role)
      return NextResponse.json({ error: 'Only seniors can view incoming requests' }, { status: 403 })
    }

    console.log('✅ User is senior, fetching requests...')

    // Simple query - just get basic request info first
    const { data: requests, error: requestsError } = await supabase
      .from('message_requests')
      .select('*')
      .eq('senior_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    console.log('📊 Simple query result:', { requests, requestsError })

    if (requestsError) {
      console.error('❌ Simple query error:', requestsError)
      return NextResponse.json({ error: 'Failed to fetch requests', details: requestsError.message }, { status: 500 })
    }

    console.log('✅ Found requests:', requests?.length || 0)

    // Try to get user info for each request separately
    const formattedRequests = []
    for (const request of requests || []) {
      try {
        const { data: studentData, error: studentError } = await supabase
          .from('users')
          .select('full_name, avatar_url, college_id, branch, year, unique_id')
          .eq('id', request.student_id)
          .single()

        if (studentError) {
          console.error('❌ Failed to get student data:', studentError)
          formattedRequests.push({
            ...request,
            full_name: 'Unknown User',
            avatar_url: null,
            college_name: 'College not specified'
          })
        } else {
          formattedRequests.push({
            ...request,
            full_name: studentData.full_name,
            avatar_url: studentData.avatar_url,
            college_id: studentData.college_id,
            branch: studentData.branch,
            year: studentData.year,
            unique_id: studentData.unique_id,
            college_name: 'College info not loaded'
          })
        }
      } catch (err) {
        console.error('❌ Error processing request:', err)
        formattedRequests.push({
          ...request,
          full_name: 'Error loading user',
          avatar_url: null,
          college_name: 'Error'
        })
      }
    }

    console.log('📤 Sending response:', { requests: formattedRequests.length })

    return NextResponse.json({ requests: formattedRequests })

  } catch (error) {
    console.error('💥 Get incoming requests error:', error)
    console.error('💥 Error stack:', error?.stack)
    return NextResponse.json({ error: 'Internal server error', details: error?.message }, { status: 500 })
  }
}
