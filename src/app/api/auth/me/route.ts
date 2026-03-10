import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    console.log('Auth me route called')
    const session = req.cookies.get('claspire_session')
    console.log('Session cookie exists:', !!session?.value)
    
    if (!session?.value) {
      console.log('No session cookie found')
      return NextResponse.json(
        { user: null },
        { status: 401 }
      )
    }
    
    try {
      const user = JSON.parse(session.value)
      console.log('Session parsed successfully:', user.email, user.role)
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
