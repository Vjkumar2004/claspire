import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { resolveDisplayBio, resolveProfileData } from '@/lib/profile-data'
import { verifySessionCookie, createSessionCookie } from '@/lib/session'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
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
      // Verify signed session cookie
      const verifiedSession = verifySessionCookie(session.value)

      if (!verifiedSession) {
        console.error('Invalid or tampered session cookie')
        return NextResponse.json(
          { user: null },
          { status: 401 }
        )
      }

      const { userId, isLegacy } = verifiedSession

      // Fetch latest user data from Supabase (always fetch from DB now)
      const { data: dbUser, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (dbError || !dbUser) {
        console.error('User not found in DB:', dbError)
        return NextResponse.json(
          { user: null },
          { status: 401 }
        )
      }

      const user = {
        ...dbUser,
        bio: resolveDisplayBio(dbUser.bio),
        profile_data: resolveProfileData(dbUser),
      }

      const today = new Date().toISOString().split('T')[0]
      let dailyRPEarned = false

      // ── Global Daily Visit RP ──
      if (dbUser.last_visit_date !== today) {
        // Update users table first and get the persisted value
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({
            rise_points: (dbUser.rise_points || 0) + 1,
            last_visit_date: today,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)
          .select('rise_points, last_visit_date, rp_level')
          .single()

        if (updateError || !updatedUser) {
          console.error('Daily visit RP update failed:', updateError || 'UPDATE affected 0 rows')
        } else {
          // Only log if the update succeeded
          const { error: logError } = await supabase
            .from('rise_points_log')
            .insert({
              user_id: userId,
              points: 1,
              reason: 'Daily visit bonus 🌅',
              created_at: new Date().toISOString()
            })

          if (logError) {
            console.error('Daily visit RP log insert failed:', logError)
          }

          // Use actual persisted values from database
          user.rise_points = updatedUser.rise_points
          user.last_visit_date = updatedUser.last_visit_date
          dailyRPEarned = true

          // ── RP Level Auto-Leveling (based on persisted value) ──
          const newLevel = updatedUser.rise_points >= 1000 ? 4
            : updatedUser.rise_points >= 500 ? 3
            : updatedUser.rise_points >= 200 ? 2
            : 1

          if (newLevel !== dbUser.rp_level) {
            const { error: levelError } = await supabase
              .from('users')
              .update({ rp_level: newLevel })
              .eq('id', userId)

            if (levelError) {
              console.error('RP level update failed:', levelError)
            } else {
              user.rp_level = newLevel
            }
          }
        }
      }

      // We attach dailyRPEarned to the response so the frontend knows to show the toast
      const response = NextResponse.json({ user, dailyRPEarned })

      // If legacy cookie detected, migrate to new signed cookie
      if (isLegacy) {
        console.log('[Auth/me] Migrating legacy cookie to signed format for user:', userId)
        response.cookies.set('claspire_session', createSessionCookie(userId), {
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 60 * 60 * 24 * 30 // 30 days
        })
      }

      return response
    } catch (parseError) {
      console.error('Failed to verify session:', parseError)
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
