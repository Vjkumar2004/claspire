import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const cookie = req.cookies.get('claspire_session')
    if (!cookie) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const session = JSON.parse(cookie.value)
    const userId = session.id

    // Check if user is a senior
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role, rise_points, college_id')
      .eq('id', userId)
      .single()

    if (userError || user?.role !== 'senior') {
      return NextResponse.json(
        { error: 'Only seniors can post jobs' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const {
      company_name,
      role,
      salary_range,
      location,
      job_type,
      description, // Used for job link/description
      requirements,
      deadline,
      referral_available,
      is_active = true
    } = body

    // Find the community ID for the user's college
    const { data: comm } = await supabase
      .from('communities')
      .select('id')
      .eq('college_id', user.college_id)
      .single()

    if (!comm) {
      return NextResponse.json(
        { error: 'Community not found for your college' },
        { status: 404 }
      )
    }

    // Insert job
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert({
        posted_by: userId,
        community_id: comm.id,
        company_name,
        role,
        salary_range,
        location,
        job_type,
        description,
        requirements,
        deadline,
        referral_available,
        is_active,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (jobError) {
      console.error('Job create error:', jobError)
      return NextResponse.json(
        { error: jobError.message },
        { status: 500 }
      )
    }

    // Reward senior with Rise Points (e.g., +20 RP for posting a job)
    const rpAmount = 20
    await supabase
      .from('rise_points_log')
      .insert({
        user_id: userId,
        points: rpAmount,
        reason: `Posted a job: ${role} at ${company_name} 💼`,
        created_at: new Date().toISOString()
      })

    await supabase
      .from('users')
      .update({
        rise_points: (user.rise_points || 0) + rpAmount
      })
      .eq('id', userId)

    // Trigger Notification for all community members
    const { data: members } = await supabase
      .from('community_members')
      .select('user_id')
      .eq('community_id', comm.id)

    if (members && members.length > 0) {
      const { createNotification } = await import('@/lib/notifications')
      // Map members to notification promises
      const notifPromises = members
        .filter(m => m.user_id !== userId) // Don't notify the poster
        .map(m => createNotification({
          receiverId: m.user_id,
          senderId: userId,
          type: 'job_post',
          title: 'New Job Opportunity! 💼',
          message: `${company_name} is hiring for ${role}! Check it out.`,
          link: '/jobs'
        }))
      
      await Promise.all(notifPromises.slice(0, 50)) // Cap at 50 for performance/sanity
    }

    return NextResponse.json({
      success: true,
      job,
      rpEarned: rpAmount
    })

  } catch (err: any) {
    console.error('Create job error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
