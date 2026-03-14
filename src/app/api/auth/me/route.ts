import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(req: NextRequest) {
  try {
    const session = req.cookies.get('claspire_session')
    
    if (!session?.value) {
      return NextResponse.json(
        { user: null },
        { status: 401 }
      )
    }
    
    try {
      const cookieUser = JSON.parse(session.value)
      
      // Fetch latest user data from Supabase to ensure avatar_url is sync'd
      const { data: dbUser, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('id', cookieUser.id)
        .single()

      if (dbError || !dbUser) {
        console.error('User not found in DB:', dbError)
        return NextResponse.json({ user: cookieUser }) // Fallback to cookie data
      }

      // Merge and return
      const user = {
        ...cookieUser,
        ...dbUser
      }

      return NextResponse.json({ user })
    } catch (parseError) {
      console.error('Failed to parse session:', parseError)
      return NextResponse.json(
        { user: null },
        { status: 401 }
      )
    }
    
  } catch (error) {
    console.error('Auth me route error:', error)
    return NextResponse.json(
      { user: null },
      { status: 401 }
    )
  }
}
