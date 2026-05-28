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

      const today = new Date().toISOString().split('T')[0]
      let sessionUpdated = false
      let dailyRPEarned = false

      // ── Global Daily Visit RP ──
      if (dbUser.last_visit_date !== today) {
        // Give +1 RP
        const newPoints = (dbUser.rise_points || 0) + 1
        await supabase
          .from('users')
          .update({
            rise_points: newPoints,
            last_visit_date: today,
            updated_at: new Date().toISOString()
          })
          .eq('id', cookieUser.id)

        // Log it
        await supabase
          .from('rise_points_log')
          .insert({
            user_id: cookieUser.id,
            points: 1,
            reason: 'Daily visit bonus 🌅',
            created_at: new Date().toISOString()
          })

        user.rise_points = newPoints
        user.last_visit_date = today
        dailyRPEarned = true
        sessionUpdated = true

        // ── RP Level Auto-Leveling ──
        const newLevel = newPoints >= 1000 ? 4
          : newPoints >= 500 ? 3
          : newPoints >= 200 ? 2
          : 1

        if (newLevel !== dbUser.rp_level) {
          await supabase
            .from('users')
            .update({ rp_level: newLevel })
            .eq('id', cookieUser.id)
          user.rp_level = newLevel
        }
      }

      // We attach dailyRPEarned to the response so the frontend knows to show the toast
      const response = NextResponse.json({ user, dailyRPEarned })

      // Check if cookie is stale (e.g. is_premium manually updated in DB, or points updated)
      if (sessionUpdated || dbUser.is_premium !== cookieUser.is_premium || dbUser.role !== cookieUser.role || dbUser.college_id !== cookieUser.college_id) {
        console.log('useAuth - refreshing stale session cookie')
        response.cookies.set('claspire_session', JSON.stringify(user), {
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 60 * 60 * 24 * 7 // 7 days
        })
      }

      return response
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
