import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  try {
    const { userId, points, reason, postId, voterId } = await request.json()

    if (!userId || !points || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, points, reason' },
        { status: 400 }
      )
    }

    // Validate points value
    if (typeof points !== 'number' || points <= 0) {
      return NextResponse.json(
        { error: 'Points must be a positive number' },
        { status: 400 }
      )
    }

    // Validate reason
    const validReasons = ['post_created', 'answer', 'upvote_received', 'answer_accepted']
    if (!validReasons.includes(reason)) {
      return NextResponse.json(
        { error: 'Invalid reason' },
        { status: 400 }
      )
    }

    // Get current user points
    const { data: currentPoints, error: fetchError } = await supabase
      .from('users')
      .select('rise_points')
      .eq('id', userId)
      .single()

    if (fetchError) {
      console.error('Error fetching user points:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch user points' },
        { status: 500 }
      )
    }

    // Update user points
    const newPoints = (currentPoints?.rise_points || 0) + points
    const { error: updateError } = await supabase
      .from('users')
      .update({ rise_points: newPoints })
      .eq('id', userId)

    if (updateError) {
      console.error('Error updating user points:', updateError)
      return NextResponse.json(
        { error: 'Failed to update points' },
        { status: 500 }
      )
    }

    // Create points transaction record
    const { error: transactionError } = await supabase
      .from('rise_points_log')
      .insert({
        user_id: userId,
        points: points,
        reason: `${reason}${postId ? ` for post ${postId}` : ''}${voterId ? ` by user ${voterId}` : ''}`,
        created_at: new Date().toISOString()
      })

    if (transactionError) {
      console.error('Error creating point transaction:', transactionError)
      // Don't fail the request if transaction recording fails, but log it
    }

    return NextResponse.json({
      success: true,
      newPoints: newPoints,
      pointsAwarded: points,
      reason: reason
    })

  } catch (error) {
    console.error('Points add API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
