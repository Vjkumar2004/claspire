import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function POST(req: NextRequest) {
  try {
    // Get current user from session cookie
    const session = req.cookies.get('claspire_session')
    if (!session?.value) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    let userSession
    try {
      userSession = JSON.parse(session.value)
    } catch (parseError) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const userId = userSession.id

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
      return NextResponse.json({ error: 'Only juniors can send message requests' }, { status: 403 })
    }

    // Parse request body
    const body = await req.json()
    const { senior_id } = body

    if (!senior_id) {
      return NextResponse.json({ error: 'senior_id is required' }, { status: 400 })
    }

    // Verify that the target user is a senior
    const { data: seniorData, error: seniorError } = await supabase
      .from('users')
      .select('role')
      .eq('id', senior_id)
      .single()

    if (seniorError || !seniorData) {
      return NextResponse.json({ error: 'Senior not found' }, { status: 404 })
    }

    if (seniorData.role !== 'senior') {
      return NextResponse.json({ error: 'Target user is not a senior' }, { status: 400 })
    }

    // Check if request already exists
    const { data: existingRequest, error: existingError } = await supabase
      .from('message_requests')
      .select('id, status')
      .eq('student_id', userId)
      .eq('senior_id', senior_id)
      .single()

    if (existingRequest) {
      return NextResponse.json({ 
        error: 'already_requested', 
        status: existingRequest.status 
      }, { status: 400 })
    }

    // Insert new request
    const { data: newRequest, error: insertError } = await supabase
      .from('message_requests')
      .insert({
        student_id: userId,
        senior_id: senior_id,
        status: 'pending'
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert request error:', insertError)
      return NextResponse.json({ error: 'Failed to send request' }, { status: 500 })
    }

    return NextResponse.json({ success: true, request: newRequest })

  } catch (error) {
    console.error('Send message request error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
