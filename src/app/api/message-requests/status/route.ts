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

    // Get user role to ensure they're a junior/student
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (userData.role !== 'student') {
      return NextResponse.json({ error: 'Only juniors can check request status' }, { status: 403 })
    }

    // Get senior_id from query params
    const { searchParams } = new URL(req.url)
    const senior_id = searchParams.get('senior_id')

    if (!senior_id) {
      return NextResponse.json({ error: 'senior_id query parameter is required' }, { status: 400 })
    }

    // Check request status
    const { data: request, error: requestError } = await supabase
      .from('message_requests')
      .select('status')
      .eq('student_id', userId)
      .eq('senior_id', senior_id)
      .single()

    if (requestError && requestError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Request status check error:', requestError)
      return NextResponse.json({ error: 'Failed to check status' }, { status: 500 })
    }

    const status = request ? request.status : 'none'

    return NextResponse.json({ status })

  } catch (error) {
    console.error('Check request status error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
