import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { email, role } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    console.log('Checking account existence for:', email, 'role:', role)

    // Check if user already exists with this email
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('id, email, role, full_name, is_active')
      .eq('email', email.toLowerCase())
      .single()

    console.log('Existing user:', existingUser)
    console.log('User error:', userError)

    if (userError && userError.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is expected
      console.error('Database error:', userError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (existingUser) {
      // User exists, check if they're active
      if (existingUser.is_active) {
        return NextResponse.json({
          exists: true,
          isActive: true,
          role: existingUser.role,
          fullName: existingUser.full_name,
          message: `An account with this email already exists as a ${existingUser.role}. Please login instead.`
        }, { status: 409 })
      } else {
        return NextResponse.json({
          exists: true,
          isActive: false,
          role: existingUser.role,
          fullName: existingUser.full_name,
          message: 'An account with this email exists but is not active. Please contact support.'
        }, { status: 409 })
      }
    }

    // No account found, user can proceed
    return NextResponse.json({
      exists: false,
      message: 'No account found with this email. You can proceed with registration.'
    }, { status: 200 })

  } catch (error) {
    console.error('Check account API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
